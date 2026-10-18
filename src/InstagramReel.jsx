import React,{useEffect} from 'react';
const reelUrl='https://www.instagram.com/reel/DeWuq53IvtE/';
export function InstagramReel(){
 useEffect(()=>{
  const process=()=>window.instgrm?.Embeds?.process?.();
  if(window.instgrm?.Embeds?.process){process();return}
  let script=document.getElementById('instagram-embed-script');
  if(!script){script=document.createElement('script');script.id='instagram-embed-script';script.src='https://www.instagram.com/embed.js';script.async=true;document.body.appendChild(script)}
  script.addEventListener('load',process);
  if(script.dataset.loaded==='true')process();
  const loaded=()=>{script.dataset.loaded='true'};
  script.addEventListener('load',loaded);
  return()=>{script.removeEventListener('load',process);script.removeEventListener('load',loaded)};
 },[]);
 return <div className="reel-frame instagram-official">
  <blockquote className="instagram-media" data-instgrm-captioned data-instgrm-permalink={reelUrl} data-instgrm-version="14" style={{background:'#fff',border:0,borderRadius:3,margin:'0 auto',maxWidth:540,minWidth:0,width:'100%'}}>
   <div className="instagram-loading"><p>Featured Zetech University Reel</p><a href={reelUrl} target="_blank" rel="noopener noreferrer">Watch the Reel on Instagram ↗</a><p className="instagram-credit">A post shared by Zetech University (@zetech_university)</p></div>
  </blockquote>
  <p className="embed-fallback">Video not appearing? <a href={reelUrl} target="_blank" rel="noopener noreferrer">Open the Reel directly on Instagram ↗</a></p>
 </div>
}
