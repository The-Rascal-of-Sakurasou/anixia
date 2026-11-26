import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
const allowedOrigin="https://the-rascal-of-sakurasou.github.io";
const headers={"Access-Control-Allow-Origin":allowedOrigin,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-anixia-cron-token","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json; charset=utf-8"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const formats:Record<string,string>={"Q63952888":"tv","Q20650540":"movie","Q220898":"ova","Q1047299":"ona","Q117209498":"movie","Q117467240":"web","Q11086742":"tv","Q113671041":"ona","Q113687694":"ova","Q117467246":"tv","Q117717390":"movie","Q1261214":"special"};
const query=(limit:number,offset:number)=>
"SELECT ?item ?itemLabel ?jaLabel ?date ?episodes (SAMPLE(?countryCode) AS ?countryCode) (GROUP_CONCAT(DISTINCT STR(?class);separator=\"|\") AS ?classes) WHERE {"+
" VALUES ?class { wd:Q63952888 wd:Q20650540 wd:Q220898 wd:Q1047299 wd:Q117209498 wd:Q117467240 wd:Q11086742 wd:Q113671041 wd:Q113687694 wd:Q117467246 wd:Q117717390 wd:Q1261214 }"+
" ?item wdt:P31 ?class . OPTIONAL { ?item wdt:P495 ?country . OPTIONAL { ?country wdt:P297 ?countryCode . } }"+
" FILTER(?class != wd:Q1261214 || EXISTS { ?item wdt:P136/wdt:P279* wd:Q1107 } || EXISTS { ?item wdt:P2079 wd:Q11425 })"+
" OPTIONAL { ?item wdt:P580 ?startDate . } OPTIONAL { ?item wdt:P577 ?publicationDate . }"+
" BIND(COALESCE(?startDate, ?publicationDate) AS ?date) FILTER(BOUND(?date) && YEAR(?date)>=1963)"+
" FILTER NOT EXISTS { ?item wdt:P136 ?adultGenre . VALUES ?adultGenre { wd:Q136926229 wd:Q49148153 wd:Q185529 wd:Q599558 wd:Q2275499 wd:Q16254232 wd:Q2292320 wd:Q172067 } }"+
" OPTIONAL { ?item wdt:P1113 ?episodes . }"+
" OPTIONAL { ?item rdfs:label ?jaLabel . FILTER(LANG(?jaLabel)='ja') }"+
" SERVICE wikibase:label { bd:serviceParam wikibase:language 'ja,en'. }"+
" } GROUP BY ?item ?itemLabel ?jaLabel ?date ?episodes ORDER BY ?item LIMIT "+limit+" OFFSET "+offset;
async function fetchPage(limit:number,offset:number){
 const url="https://query.wikidata.org/sparql?"+new URLSearchParams({query:query(limit,offset),format:"json"});
 for(let i=0;i<4;i++){
  const res=await fetch(url,{headers:{"Accept":"application/sparql-results+json","User-Agent":"ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/)"}});
  if(res.status===429){await wait(Math.min(60,Math.max(2,Number(res.headers.get("Retry-After")||10)))*1000);continue;}
  if([500,502,503,504].includes(res.status)&&i<3){await wait((i+1)*2500);continue;}
  if(!res.ok)throw new Error("Wikidata Query Service HTTP "+res.status);
  const data=await res.json();return Array.isArray(data?.results?.bindings)?data.results.bindings:[];
 }
 throw new Error("Wikidata Query Service remained unavailable.");
}
function mapRow(b:any){
 const qid=String(b?.item?.value||"").match(/(Q\d+)$/)?.[1]||"";
 const label=String(b?.itemLabel?.value||"").trim().slice(0,500);
 const ja=String(b?.jaLabel?.value||"").trim().slice(0,500);
 const titleJa=ja||null;
 const title=titleJa||label;
 const date=String(b?.date?.value||"").match(/^(\d{4})/);
 const year=date?Number(date[1]):null;
 const classes=String(b?.classes?.value||"").split("|").map((value:string)=>value.match(/(Q\d+)$/)?.[1]||"").filter(Boolean);
 const priority=["Q1261214","Q113687694","Q220898","Q113671041","Q1047299","Q63952888","Q11086742","Q117467246","Q117717390","Q20650540","Q117209498","Q117467240"];
 const cls=priority.find(value=>classes.includes(value))||classes[0]||"";
 const episodes=Number(b?.episodes?.value);
 if(!/^Q\d+$/.test(qid)||!title||!year||year<1963)return null;
 const format=formats[cls]||"other";
 const publishable=Boolean(titleJa)&&["tv","movie","ova","ona","web","special"].includes(format);
 return {source:"wikidata",source_id:qid,title,title_ja:titleJa,format,release_year:year,country_code:(/^[A-Z]{2}$/.test(String(b?.countryCode?.value||""))?String(b.countryCode.value):null),episode_count:Number.isInteger(episodes)&&episodes>0?episodes:null,episodes_count:Number.isInteger(episodes)&&episodes>0?episodes:null,is_published:false,source_synced_at:new Date().toISOString()};
}
async function digestHex(value:string){
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function fetchCrossSourceIds(qids:string[]){
 const malByQid=new Map<string,Set<string>>();
 const aniListByQid=new Map<string,Set<string>>();
 for(let start=0;start<qids.length;start+=40){
  const batch=qids.slice(start,start+40).filter(qid=>/^Q[0-9]+$/.test(qid));
  if(!batch.length)continue;
  const values=batch.map(qid=>"wd:"+qid).join(" ");
  const sparql="SELECT ?item ?malId ?aniListId WHERE { VALUES ?item { "+values+" } OPTIONAL { ?item wdt:P4086 ?malId . } OPTIONAL { ?item wdt:P8729 ?aniListId . } } ORDER BY ?item ?malId ?aniListId";
  const endpoint="https://query.wikidata.org/sparql?"+new URLSearchParams({query:sparql,format:"json"});
  let bindings:any[]=[],requestSucceeded=false;
  for(let attempt=0;attempt<4;attempt++){
   const response=await fetch(endpoint,{headers:{"Accept":"application/sparql-results+json","User-Agent":"ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/)"}});
   if(response.status===429){await wait(Math.min(60,Math.max(2,Number(response.headers.get("Retry-After")||10)))*1000);continue;}
   if([500,502,503,504].includes(response.status)&&attempt<3){await wait((attempt+1)*2500);continue;}
   if(!response.ok)throw new Error("Wikidata external-ID lookup HTTP "+response.status);
   const payload=await response.json();bindings=Array.isArray(payload?.results?.bindings)?payload.results.bindings:[];requestSucceeded=true;break;
  }
  if(!requestSucceeded)throw new Error("Wikidata external-ID lookup failed after retries.");
  for(const binding of bindings){
   const qid=String(binding?.item?.value||"").match(/(Q[0-9]+)$/)?.[1];
   const malId=String(binding?.malId?.value||"").trim();
   const aniListId=String(binding?.aniListId?.value||"").trim();
   if(!qid)continue;
   if(/^[0-9]+$/.test(malId)){
    if(!malByQid.has(qid))malByQid.set(qid,new Set());
    malByQid.get(qid)!.add(malId);
   }
   if(/^[0-9]+$/.test(aniListId)){
    if(!aniListByQid.has(qid))aniListByQid.set(qid,new Set());
    aniListByQid.get(qid)!.add(aniListId);
   }
  }
  if(start+40<qids.length)await wait(1200);
 }
 return {malByQid,aniListByQid};
}
async function fetchMalIds(qids:string[]){
 return (await fetchCrossSourceIds(qids)).malByQid;
}
async function persistMalMappings(db:any,works:any[],providedMalByQid?:Map<string,Set<string>>){
 const validWorks=works.filter((row:any)=>row?.id&&/^Q[0-9]+$/.test(String(row.source_id||"")));
 if(!validWorks.length)return {linked:0,alreadyLinked:0,missing:0,ambiguous:0,collision:0,idsFound:0};
 const malByQid=providedMalByQid||await fetchMalIds(validWorks.map((row:any)=>String(row.source_id)));
 const existingRows=await fetchAllRows(()=>db.from("anime_external_ids").select("anime_id,external_id").eq("source","myanimelist").order("external_id"));
 const assignedByAnime=new Map<string,string>();
 const assignedByMal=new Map<string,string>();
 for(const row of existingRows){
  assignedByAnime.set(String(row.anime_id),String(row.external_id));
  assignedByMal.set(String(row.external_id),String(row.anime_id));
 }
 const inserts:any[]=[];
 let alreadyLinked=0,missing=0,ambiguous=0,collision=0;
 for(const work of validWorks){
  const animeId=String(work.id),qid=String(work.source_id),ids=malByQid.get(qid);
  if(!ids||ids.size===0){missing++;continue;}
  if(ids.size!==1){ambiguous++;continue;}
  const malId=[...ids][0],sameAnime=assignedByAnime.get(animeId);
  if(sameAnime){if(sameAnime===malId)alreadyLinked++;else collision++;continue;}
  if(assignedByMal.has(malId)){collision++;continue;}
  inserts.push({anime_id:animeId,source:"myanimelist",external_id:malId,source_url:"https://myanimelist.net/anime/"+malId,is_primary:false,last_verified_at:new Date().toISOString()});
  assignedByAnime.set(animeId,malId);
  assignedByMal.set(malId,animeId);
 }
 if(inserts.length){
  const saved=await db.from("anime_external_ids").upsert(inserts,{onConflict:"source,external_id",ignoreDuplicates:true});
  if(saved.error)throw saved.error;
 }
 return {linked:inserts.length,alreadyLinked,missing,ambiguous,collision,idsFound:malByQid.size};
}

async function fetchAllRows(buildQuery:()=>any,pageSize=500){
 const rows:any[]=[];
 for(let offset=0;;offset+=pageSize){
  const result=await buildQuery().range(offset,offset+pageSize-1);
  if(result.error)throw result.error;
  const page=result.data||[];
  rows.push(...page);
  if(page.length<pageSize)break;
 }
 return rows;
}


async function fetchEpisodeCounts(qids:string[]){
 const result=new Map<string,number>();
 const unique=[...new Set(qids.filter(qid=>/^Q[1-9][0-9]*$/.test(qid)))];
 for(let start=0;start<unique.length;start+=50){
  const batch=unique.slice(start,start+50);
  const url=new URL("https://www.wikidata.org/w/api.php");
  url.search=new URLSearchParams({action:"wbgetentities",ids:batch.join("|"),props:"claims",format:"json"}).toString();
  let payload:any=null;
  for(let attempt=0;attempt<4;attempt++){
   const response=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/)"}});
   if(response.status===429){const retry=Number(response.headers.get("Retry-After")||5);await wait(Math.min(30,Math.max(2,retry))*1000);continue;}
   if([500,502,503,504].includes(response.status)&&attempt<3){await wait((attempt+1)*1500);continue;}
   if(!response.ok)throw new Error("Wikidata episode-count API HTTP "+response.status);
   payload=await response.json();break;
  }
  if(!payload?.entities)throw new Error("Wikidata episode-count response did not contain entities.");
  for(const [qid,entity] of Object.entries(payload.entities as Record<string,any>)){
   const claims=Array.isArray(entity?.claims?.P1113)?entity.claims.P1113:[];
   const preferred=claims.filter((c:any)=>c?.rank==="preferred");
   const selected=preferred.length?preferred:claims.filter((c:any)=>c?.rank!=="deprecated");
   const values=new Set<number>();
   for(const claim of selected){
    const raw=claim?.mainsnak?.datavalue?.value?.amount;
    if(raw===undefined||raw===null)continue;
    const n=Number(String(raw).replace(/^\\+/,""));
    if(Number.isSafeInteger(n)&&n>0&&n<=2147483647)values.add(n);
   }
   if(values.size===1)result.set(qid,[...values][0]);
  }
  if(start+50<unique.length)await wait(1100);
 }
 return result;
}

async function fetchJapaneseLabels(qids:string[]):Promise<Map<string,string>>{
 const result=new Map<string,string>();
 const unique=[...new Set(qids.filter(qid=>/^Q[1-9][0-9]*$/.test(qid)))];
 for(let start=0;start<unique.length;start+=50){
  const chunk=unique.slice(start,start+50);
  const params=new URLSearchParams({
   action:"wbgetentities",ids:chunk.join("|"),props:"labels|aliases|sitelinks",
   languages:"ja",format:"json",origin:"*"
  });
  let payload:any=null;
  for(let attempt=0;attempt<4;attempt++){
   const response=await fetch("https://www.wikidata.org/w/api.php?"+params.toString(),{
    headers:{"User-Agent":"ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; Japanese title metadata)","Accept":"application/json"}
   });
   if(response.status===429){
    await wait(Math.min(60,Math.max(2,Number(response.headers.get("Retry-After")||10)))*1000);
    continue;
   }
   if([500,502,503,504].includes(response.status)&&attempt<3){
    await wait((attempt+1)*2000);
    continue;
   }
   if(!response.ok)throw new Error("Wikidata Japanese-label API HTTP "+response.status);
   payload=await response.json();
   break;
  }
  if(!payload)throw new Error("Wikidata Japanese-label API remained unavailable.");
  for(const [id,entity] of Object.entries(payload.entities||{})){
   const data=entity as any;
   const label=String(data?.labels?.ja?.value||"").trim();
   const aliases=Array.isArray(data?.aliases?.ja)
    ? data.aliases.ja.map((x:any)=>String(x?.value||"").trim()).filter(Boolean) : [];
   const jawiki=String(data?.sitelinks?.jawiki?.title||"").trim();
   // Prefer the Japanese Wikidata label, then a Japanese alias, then the
   // Japanese Wikipedia page title. Never transliterate or invent a title.
   const candidates=[label,...aliases,jawiki];
   const value=candidates.find(v=>v.length>=2&&v.length<=100&&/[ぁ-んァ-ヶ一-龯]/u.test(v));
   if(/^Q[1-9][0-9]*$/.test(id)&&value) result.set(id,value);
  }
  if(start+50<unique.length)await wait(500);
 }
 return result;
}

async function autoReviewWikidata(db:any){
 const active=await db.from("catalog_sync_runs").select("id,started_at")
  .eq("source","wikidata-auto-review").eq("status","running")
  .order("started_at",{ascending:false}).limit(1).maybeSingle();
 if(active.error)throw active.error;
 if(active.data?.id){
  const started=Date.parse(String(active.data.started_at||""));
  if(Number.isFinite(started)&&Date.now()-started<5*60*1000){
   return {skipped:true,reason:"another_auto_review_is_running",activeRunId:active.data.id};
  }
  const stale=await db.from("catalog_sync_runs").update({
   status:"failed",finished_at:new Date().toISOString(),
   error_message:"Marked stale after exceeding the 5-minute auto-review execution window."
  }).eq("id",active.data.id).eq("status","running");
  if(stale.error)throw stale.error;
 }
 const run=await db.from("catalog_sync_runs").insert({
  source:"wikidata-auto-review",status:"running",pages_requested:0,
  records_seen:0,records_inserted_or_updated:0
 }).select("id").single();
 if(run.error)throw run.error;
 const [pending,all,external,genres,animeGenres,suppressions]=await Promise.all([
  fetchAllRows(()=>db.from("anime").select("id,source,source_id,title,title_ja,format,release_year,episode_count")
   .eq("source","wikidata").eq("is_published",false).order("source").order("id")),
  fetchAllRows(()=>db.from("anime").select("id,source,source_id,title,title_ja,title_kana,format,release_year").order("id")),
  fetchAllRows(()=>db.from("anime_external_ids").select("anime_id,source,external_id,source_url")
   .eq("source","wikidata").order("anime_id")),
  fetchAllRows(()=>db.from("genres").select("id,name").order("id")),
  fetchAllRows(()=>db.from("anime_genres").select("anime_id,genre_id").order("anime_id").order("genre_id")),
  fetchAllRows(()=>db.from("catalog_duplicate_suppressions").select("source,external_id,canonical_anime_id")
   .in("source",["wikidata","anilist"]).order("source").order("external_id"))
 ]);
 const suppressedKeys=new Set(suppressions.map((x:any)=>String(x.source)+":"+String(x.external_id)));
 const externalByAnime=new Map(external.map((x:any)=>[String(x.source)+":"+String(x.anime_id),x]));
 const missingTitleRows=pending.filter((a:any)=>!String(a.title_ja||"").trim());
 const missingTitleQids=missingTitleRows.map((a:any)=>String(a.source_id||""));
 let japaneseLabels=new Map<string,string>();
 if(missingTitleQids.length){
  try{japaneseLabels=await fetchJapaneseLabels(missingTitleQids);}
  catch(labelError){console.error("Wikidata Japanese-label fallback skipped:",labelError);}
 }
 let titleRepairsApplied=0,titleRepairsFromWikidata=0;
 for(const a of missingTitleRows){
  const qid=String(a.source_id||"");
  const wikidataTitle=japaneseLabels.get(qid);
  if(!wikidataTitle)continue;
  const saved=await db.from("anime").update({title_ja:wikidataTitle,updated_at:new Date().toISOString()})
   .eq("id",a.id).eq("is_published",false).select("id").maybeSingle();
  if(saved.error)throw saved.error;
  if(!saved.data?.id)continue;
  a.title_ja=wikidataTitle;
  const allRow=all.find((row:any)=>String(row.id)===String(a.id));
  if(allRow)allRow.title_ja=wikidataTitle;
  titleRepairsApplied++;
  titleRepairsFromWikidata++;
 }
 const qidEpisodeCounts=await fetchEpisodeCounts(pending
  .filter((a:any)=>String(a.source)==="wikidata"&&["tv","ova","ona","special"].includes(String(a.format||""))&&(!Number.isSafeInteger(Number(a.episode_count))||Number(a.episode_count)<1))
  .map((a:any)=>String(a.source_id||"")));
 const adultGenreIds=new Set(genres
  .filter((g:any)=>["hentai","adult","pornography","erotica"].includes(String(g.name||"").toLowerCase()))
  .map((g:any)=>String(g.id)));
 const adultAnimeIds=new Set(animeGenres
  .filter((x:any)=>adultGenreIds.has(String(x.genre_id))).map((x:any)=>String(x.anime_id)));
 const normalize=(value:any)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\s　]+/g,"");
 const eligible:any[]=[], reasons:Record<string,number>={};
 const titleIdsByKey=new Map<string,Set<string>>();
 const titleKey=(row:any)=>[normalize(row.title_ja||row.title_kana||row.title),String(row.release_year||""),String(row.format||"")].join("|");
 for(const row of all){
  const sourceKey=String(row.source||"")+":"+String(row.source_id||"");
  if(suppressedKeys.has(sourceKey))continue;
  const key=titleKey(row);
  if(!key.startsWith("|")){
   if(!titleIdsByKey.has(key))titleIdsByKey.set(key,new Set());
   titleIdsByKey.get(key)!.add(String(row.id));
  }
 }
 const hold=(reason:string)=>{reasons[reason]=(reasons[reason]||0)+1;};
 for(const a of pending){
  const title=String(a.title_ja||"").trim(), qid=String(a.source_id||"");
  const fmt=String(a.format||""), episodes=Number(a.episode_count);
  const source=String(a.source||"");
  const ext=externalByAnime.get(source+":"+String(a.id));
  const fetchedEpisodeCount=source==="wikidata"?qidEpisodeCounts.get(qid):undefined;
  if(fetchedEpisodeCount&&["tv","ova","ona","special"].includes(fmt)){
   const episodeSave=await db.from("anime").update({episode_count:fetchedEpisodeCount,episodes_count:fetchedEpisodeCount,updated_at:new Date().toISOString()}).eq("id",a.id).eq("is_published",false);
   if(episodeSave.error)throw episodeSave.error;
   a.episode_count=fetchedEpisodeCount;
  }
  let reason="";
  if(source!=="wikidata")reason="unsupported_source";
  else if(!/^Q[1-9][0-9]*$/.test(qid))reason="invalid_wikidata_id";
  else if(suppressedKeys.has(source+":"+qid))reason="suppressed_duplicate";
  else if(!title)reason="missing_japanese_title";
  else if(title.length<2||title.length>100)reason="invalid_title_length";
  else if(String(a.title||"").trim().length<2||String(a.title||"").trim().length>500)reason="invalid_original_title";
  else if(!Number.isInteger(Number(a.release_year))||Number(a.release_year)<1963||Number(a.release_year)>new Date().getUTCFullYear()+1)reason="invalid_release_year";
  else if(!["tv","movie","ova","ona","special","web"].includes(fmt))reason="unsupported_format";
  else if(!ext||String(ext.external_id)!==qid||
   String(ext.source_url||"")!=="https://www.wikidata.org/wiki/"+qid)reason="missing_source_link";
  else if(adultAnimeIds.has(String(a.id)))reason="adult_genre_flag";
  else {
   const matchingIds=titleIdsByKey.get([normalize(title),String(a.release_year||""),fmt].join("|"));
   const duplicate=Boolean(matchingIds&&[...matchingIds].some(id=>id!==String(a.id)));
   if(duplicate)reason="possible_duplicate";
   else eligible.push(a);
  }
  if(reason)hold(reason);
 }
 const ids=eligible.map((a:any)=>String(a.id));
 let approvedIds:string[]=[];
 for(let start=0;start<ids.length;start+=100){
  const batch=ids.slice(start,start+100);
  const saved=await db.from("anime").update({is_published:true}).in("id",batch).select("id");
  if(saved.error)throw saved.error;
  approvedIds.push(...(saved.data||[]).map((x:any)=>String(x.id)));
 }
 const now=new Date().toISOString();
 const finish=await db.from("catalog_sync_runs").update({
  finished_at:now,status:"succeeded",records_seen:pending.length,
  records_inserted_or_updated:approvedIds.length,
  error_message:JSON.stringify({held:pending.length-approvedIds.length,reasons,titleRepairsApplied,titleRepairsFromWikidata,}).slice(0,1000)
 }).eq("id",run.data.id);
 if(finish.error)throw finish.error;
 return {scanned:pending.length,autoApproved:approvedIds.length,heldForReview:pending.length-approvedIds.length,holdReasons:reasons,titleRepairsApplied,titleRepairsFromWikidata,runId:run.data.id,reviewedSources:["wikidata"],reviewDatasetSizes:{allAnime:all.length,sourceExternalIds:external.length,genres:genres.length,animeGenreLinks:animeGenres.length}};
}

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&origin!==allowedOrigin)return json({error:"Origin not allowed"},403);
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return json({error:"Supabase server configuration is incomplete."},500);
 try{
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  let authorized=false;
  const token=req.headers.get("x-anixia-cron-token");
  if(token){
   const check=await db.from("catalog_sync_secrets").select("secret_hash").eq("id",1).maybeSingle();
   if(check.error)throw check.error;
   const hash=await digestHex(token);
   const storedHash=check.data?.secret_hash;
   authorized=typeof storedHash==="string"&&storedHash.length>0&&hash===storedHash;
  }
  if(!authorized){
   const auth=req.headers.get("Authorization");
   if(!auth?.startsWith("Bearer "))return json({error:"管理者ログインまたは有効な同期トークンが必要です。"},401);
   const userClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
   const user=await userClient.auth.getUser();
   if(user.error||!user.data.user)return json({error:"ログイン状態を確認できません。"},401);
   const adminCheck=await userClient.rpc("is_anixia_admin");
   if(adminCheck.error||adminCheck.data!==true)return json({error:"ANIXIA管理者権限が必要です。"},403);
  }
  const body=await req.json().catch(()=>({}));
  const requiredSources=["wikidata"];
  const sourceRows=await db.from("catalog_sources").select("code,rights_review_status,is_enabled").in("code",requiredSources);
  if(sourceRows.error)throw sourceRows.error;
  const sourceByCode=new Map((sourceRows.data||[]).map((row:any)=>[String(row.code),row]));
  for(const sourceCode of requiredSources){
   const source=sourceByCode.get(sourceCode);
   if(!source?.is_enabled||source.rights_review_status!=="approved"){
    return json({error:sourceCode+"の利用承認が有効ではないため、同期を停止しました。"},423);
   }
  }
  if(body?.mode==="auto_review"){
   const review=await autoReviewWikidata(db);
   return json({status:"completed",...review});
  }
  if(body?.mode==="sync_mal_ids"){
   const state=await db.from("catalog_sync_state").select("next_offset").eq("source","wikidata-mal-ids").maybeSingle();
   if(state.error)throw state.error;
   const offset=Math.max(0,Number(state.data?.next_offset)||0);
   const batchSize=Math.min(300,Math.max(50,Math.floor(Number(body?.limit)||200)));
   const worksResult=await db.from("anime").select("id,source_id")
    .eq("source","wikidata").not("source_id","is",null).order("source_id").range(offset,offset+batchSize-1);
   if(worksResult.error)throw worksResult.error;
   const report=await persistMalMappings(db,worksResult.data||[]);
   const nextOffset=(worksResult.data||[]).length<batchSize?0:offset+(worksResult.data||[]).length;
   const now=new Date().toISOString();
   const cursor=await db.from("catalog_sync_state").upsert({
    source:"wikidata-mal-ids",next_offset:nextOffset,last_success_at:now,updated_at:now
   },{onConflict:"source"});
   if(cursor.error)throw cursor.error;
   return json({status:"completed",offset,nextOffset,worksChecked:(worksResult.data||[]).length,wikidataMALIdsFound:report.idsFound,...report,sourceProperty:"Wikidata P4086"});
  }
  const mode=body?.mode==="preview"?"preview":"sync";
  const limit=Math.min(100,Math.max(10,Math.floor(Number(body?.limit)||50)));
  const state=await db.from("catalog_sync_state").select("next_offset").eq("source","wikidata").single();
  if(state.error)throw state.error;
  const offset=Math.max(0,Number(state.data?.next_offset)||0);
  const bindings=await fetchPage(limit,offset),map=new Map<string,any>();
  for(const b of bindings){const row=mapRow(b);if(row&&!map.has(row.source_id))map.set(row.source_id,row);}
  const rows=[...map.values()];
  if(mode==="preview"){
   const ids=rows.map(x=>x.source_id);
   const found=ids.length?await db.from("anime").select("source_id,is_published").eq("source","wikidata").in("source_id",ids):{data:[],error:null};
   if(found.error)throw found.error;
   const existing=new Map((found.data||[]).map((x:any)=>[String(x.source_id),Boolean(x.is_published)]));
   return json({mode,offset,recordsSeen:bindings.length,candidates:rows.map(x=>({sourceId:x.source_id,title:x.title,titleJa:x.title_ja,format:x.format,releaseYear:x.release_year,episodeCount:x.episode_count,readyForAdminReview:Boolean(x.title_ja)&&["tv","movie","ova","ona","web","special"].includes(x.format),alreadyImported:existing.has(x.source_id),alreadyPublished:existing.get(x.source_id)===true,wikidataUrl:"https://www.wikidata.org/wiki/"+x.source_id}))});
  }
  const suppressionResult=rows.length
   ?await db.from("catalog_duplicate_suppressions").select("external_id").eq("source","wikidata").in("external_id",rows.map(row=>row.source_id))
   :{data:[],error:null};
  if(suppressionResult.error)throw suppressionResult.error;
  const suppressedIds=new Set((suppressionResult.data||[]).map((row:any)=>String(row.external_id)));

  // Before creating Wikidata rows, match incoming QIDs to existing works by MAL ID.
  // This prevents a second row when AniList or another source already represents the same anime.
  const incomingIdentifiers=rows.length
   ?await fetchCrossSourceIds(rows.map(row=>String(row.source_id)))
   :{malByQid:new Map<string,Set<string>>(),aniListByQid:new Map<string,Set<string>>()};
  const incomingMalByQid=incomingIdentifiers.malByQid;
  const incomingAniListByQid=incomingIdentifiers.aniListByQid;
  const existingMalRows=await fetchAllRows(()=>db.from("anime_external_ids").select("anime_id,external_id").eq("source","myanimelist").order("external_id"));
  const animeByMal=new Map<string,string>();
  for(const item of existingMalRows)animeByMal.set(String(item.external_id),String(item.anime_id));
  const existingAniListRows=await fetchAllRows(()=>db.from("anime_external_ids").select("anime_id,external_id").eq("source","anilist").order("external_id"));
  const animeByAniList=new Map<string,string>();
  for(const item of existingAniListRows)animeByAniList.set(String(item.external_id),String(item.anime_id));
  const existingWikiRows=await fetchAllRows(()=>db.from("anime_external_ids")
   .select("anime_id,external_id").eq("source","wikidata").order("anime_id"));
  const animeByQid=new Map(existingWikiRows.map((item:any)=>[String(item.external_id),String(item.anime_id)]));
  const animeWithWikiId=new Set(existingWikiRows.map((item:any)=>String(item.anime_id)));
  const crossLinks:any[]=[];
  const crossSuppressions:any[]=[];
  let linkedByMal=0,linkedByAniList=0,identifierConflicts=0,suppressedByExistingWikidataId=0;
  for(const row of rows){
   const qid=String(row.source_id);
   if(suppressedIds.has(qid))continue;
   const existingWikiAnime=animeByQid.get(qid);
   if(existingWikiAnime){suppressedIds.add(qid);continue;}
   const malIds=incomingMalByQid.get(qid),aniIds=incomingAniListByQid.get(qid);
   const malTarget=malIds?.size===1?animeByMal.get([...malIds][0]):undefined;
   const aniTarget=aniIds?.size===1?animeByAniList.get([...aniIds][0]):undefined;
   if(malTarget&&aniTarget&&malTarget!==aniTarget){identifierConflicts++;continue;}
   const targetAnimeId=aniTarget||malTarget;
   if(!targetAnimeId)continue;
   const reason=aniTarget
    ?"Matched to existing anime by an unambiguous AniList ID (Wikidata P8729)."
    :"Matched to existing anime by an unambiguous MyAnimeList ID (Wikidata P4086).";
   if(animeWithWikiId.has(targetAnimeId)){
    // anime_external_ids allows one Wikidata identifier per anime row.
    // Keep the existing identifier and record this additional QID as a suppressed duplicate.
    crossSuppressions.push({
     source:"wikidata",external_id:qid,canonical_anime_id:targetAnimeId,
     reason:"Suppressed as a duplicate: the canonical anime already has a Wikidata ID; "+reason
    });
    suppressedIds.add(qid);
    suppressedByExistingWikidataId++;
    continue;
   }
   crossLinks.push({
    anime_id:targetAnimeId,source:"wikidata",external_id:qid,
    source_url:"https://www.wikidata.org/wiki/"+qid,is_primary:false,
    last_verified_at:new Date().toISOString()
   });
   crossSuppressions.push({
    source:"wikidata",external_id:qid,canonical_anime_id:targetAnimeId,
    reason:"Linked to existing anime before import; "+reason
   });
   suppressedIds.add(qid);
   animeWithWikiId.add(targetAnimeId);
   if(aniTarget)linkedByAniList++;else linkedByMal++;
  }
  if(crossLinks.length){
   const linked=await db.from("anime_external_ids").upsert(crossLinks,{onConflict:"source,external_id",ignoreDuplicates:true});
   if(linked.error)throw linked.error;
  }
  if(crossSuppressions.length){
   const savedSuppressions=await db.from("catalog_duplicate_suppressions").upsert(crossSuppressions,{onConflict:"source,external_id",ignoreDuplicates:true});
   if(savedSuppressions.error)throw savedSuppressions.error;
  }
  const importRows=rows.filter(row=>!suppressedIds.has(String(row.source_id)));
  const run=await db.from("catalog_sync_runs").insert({source:"wikidata",status:"running",pages_requested:0,records_seen:0,records_inserted_or_updated:0}).select("id").single();
  if(run.error)throw run.error;
  try{
   const saved=importRows.length?await db.from("anime").upsert(importRows,{onConflict:"source,source_id",ignoreDuplicates:true}).select("id"):{data:[],error:null};
   if(saved.error)throw saved.error;
   // Keep all newly imported candidates private until an administrator reviews them.
   let malIdsLinked=0;
   if(importRows.length){
    const sourceIds=importRows.map(row=>row.source_id);
    const imported=await db.from("anime").select("id,source_id").eq("source","wikidata").in("source_id",sourceIds);
    if(imported.error)throw imported.error;
    const externalIds=(imported.data||[]).map((row:any)=>({
     anime_id:row.id,
     source:"wikidata",
     external_id:String(row.source_id),
     source_url:"https://www.wikidata.org/wiki/"+String(row.source_id),
     is_primary:true,
     last_verified_at:new Date().toISOString()
    }));
    if(externalIds.length){
     const mapped=await db.from("anime_external_ids").upsert(externalIds,{onConflict:"source,external_id",ignoreDuplicates:true});
     if(mapped.error)throw mapped.error;
    }
    const malMapping=await persistMalMappings(db,imported.data||[],incomingMalByQid);
    malIdsLinked=malMapping.linked;
   }
   let autoReview:any={status:"scheduled_separately"};
   if(body?.runAutoReview===true){
    try{autoReview={status:"completed",...await autoReviewWikidata(db)};}
    catch(reviewError){
     const detail=reviewError instanceof Error
      ?(reviewError.stack||reviewError.message)
      :JSON.stringify(reviewError&&typeof reviewError==="object"
       ?{message:(reviewError as any).message,details:(reviewError as any).details,hint:(reviewError as any).hint,code:(reviewError as any).code}
       :reviewError);
     console.error("ANIXIA Wikidata auto-review failed:",detail);
     autoReview={status:"failed",error:String(detail||reviewError).slice(0,1000)};
    }
   }
   const next=bindings.length>=limit?offset+limit:0,now=new Date().toISOString();
   const stateUpdate=await db.from("catalog_sync_state").update({next_offset:next,last_success_at:now,updated_at:now}).eq("source","wikidata");
   if(stateUpdate.error)throw stateUpdate.error;
   const inserted=saved.data?.length||0;
   const finish=await db.from("catalog_sync_runs").update({finished_at:now,status:"succeeded",pages_requested:1,records_seen:bindings.length,records_inserted_or_updated:inserted}).eq("id",run.data.id);
   if(finish.error)throw finish.error;
   return json({status:"completed",offset,nextOffset:next,recordsSeen:bindings.length,validCandidates:importRows.length,suppressedDuplicateCandidates:rows.length-importRows.length,linkedToExistingByMalId:linkedByMal,linkedToExistingByAniListId:linkedByAniList,suppressedByExistingWikidataId,identifierConflicts,readyForAdminReview:importRows.filter(row=>Boolean(row.title_ja)&&["tv","movie","ova","ona","special","web"].includes(row.format)).length,heldForMissingJapaneseTitleOrUnsupportedFormat:importRows.filter(row=>!row.title_ja||!["tv","movie","ova","ona","special","web"].includes(row.format)).length,recordsInsertedOrUpdated:inserted,linkedMyAnimeListIds:typeof malIdsLinked==="number"?malIdsLinked:0,autoReview,sweepRestarted:next===0});
  }catch(error){
   await db.from("catalog_sync_runs").update({finished_at:new Date().toISOString(),status:"failed",pages_requested:1,records_seen:bindings.length,error_message:JSON.stringify(error).slice(0,1000)}).eq("id",run.data.id);
   throw error;
  }
 }catch(error){console.error("ANIXIA Wikidata sync failed:",error);return json({error:"Wikidata作品同期に失敗しました。Edge Functionログを確認してください。"},500);}
});