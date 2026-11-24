'use client';
import { useEffect, useState } from 'react';
import { experimentVariant, experimentTitle } from '@/lib/forgepilot-pro';

type Assignment={id:string;visitorId:string;title:string;storeId:string};
export function useForgePilotExperiment(store:any, config:any) {
  const [assignment,setAssignment]=useState<Assignment|null>(null);
  const id=String(store?.id||'');
  const domain=String(store?.domain||'');
  const adaptive=config?.layoutEngine==='adaptive-v1'&&Array.isArray(config?.sections)&&config.sections.some((s:any)=>s?.type==='hero');
  useEffect(()=>{
    let cancelled=false;
    let pending=false;
    const consent=()=>{
      try{return new URLSearchParams(window.location.search).get('forgepilot-audit')!=='1'&&navigator.doNotTrack!=='1'&&!(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl&&localStorage.getItem('shopforge-traffic-consent-'+id)==='granted';}catch{return false;}
    };
    const update=async()=>{
      if(cancelled||pending)return;
      if(!id||!domain||!adaptive||!consent()){setAssignment(null);return;}
      let visitorId='';
      try{
        const visitor=JSON.parse(localStorage.getItem('shopforge-traffic-id-'+id)||'null');
        if(!visitor||visitor.expiresAt<=Date.now()||!/^[0-9a-f-]{36}$/i.test(String(visitor.id)))return;
        visitorId=String(visitor.id);
      }catch{return;}
      pending=true;
      try{
        const response=await fetch('/api/forgepilot/experiment?domain='+encodeURIComponent(domain),{cache:'no-store'});
        if(!response.ok)return;
        const {experiment}=await response.json();
        if(cancelled||!consent())return;
        const next=experiment?{id:String(experiment.id),visitorId,title:experimentVariant(visitorId)==='A'?String(experiment.a):String(experiment.b),storeId:id}:null;
        setAssignment(current=>current&&next&&current.id===next.id&&current.title===next.title&&current.visitorId===next.visitorId?current:next);
      }catch{/* storefront stays available */}finally{pending=false;}
    };
    setAssignment(null);
    void update();
    // The existing traffic tracker creates the visitor id after consent.
    const first=window.setTimeout(()=>void update(),1200);
    const timer=window.setInterval(()=>void update(),30000);
    window.addEventListener('shopforge:traffic-consent-changed',update);
    window.addEventListener('storage',update);
    return()=>{cancelled=true;clearTimeout(first);clearInterval(timer);window.removeEventListener('shopforge:traffic-consent-changed',update);window.removeEventListener('storage',update);};
  },[id,domain,adaptive]);
  useEffect(()=>{
    if(!assignment||assignment.storeId!==id||!adaptive)return;
    // Register after the actual variant has rendered, not when merely assigned.
    const record=()=>{
      try{if(document.visibilityState!=='visible'||localStorage.getItem('shopforge-traffic-consent-'+id)!=='granted'||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return;
      void fetch('/api/forgepilot/experiment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain,visitorId:assignment.visitorId,experimentId:assignment.id}),keepalive:true}).catch(()=>{});}catch{}
    };
    const timer=window.setTimeout(record,900);
    const retry=window.setTimeout(record,3000);
    document.addEventListener('visibilitychange',record);
    return()=>{clearTimeout(timer);clearTimeout(retry);document.removeEventListener('visibilitychange',record);};
  },[assignment,id,domain,adaptive]);
  return adaptive&&assignment?.storeId===id?experimentTitle(config,assignment.title):config;
}
