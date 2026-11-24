"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUp, Check, Loader2, MessageCircle, X } from 'lucide-react';

const questions = ['Como criar uma loja de roupa?', 'Como melhorar as minhas vendas?', 'Que produtos devo destacar?'];

export default function LandingAssistant() {
  const [input,setInput] = useState('');
  const [message,setMessage] = useState('');
  const [answer,setAnswer] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [popup,setPopup] = useState(false);
  const invited = useRef(false);
  const lock = useRef(false);
  const abort = useRef<AbortController|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const reduce = useReducedMotion();
  useEffect(()=>()=>{abort.current?.abort(); if(timer.current) clearTimeout(timer.current);},[]);
  useEffect(()=>{
    if(!popup)return;
    const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setPopup(false);};
    window.addEventListener('keydown',close);
    return()=>window.removeEventListener('keydown',close);
  },[popup]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const question=input.trim();
    if(!question||lock.current)return;
    lock.current=true; setBusy(true); setError(''); setMessage(question); setAnswer(''); setInput('');
    const controller=new AbortController(); abort.current=controller;
    try {
      const response=await fetch('/api/landing-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question}),signal:controller.signal});
      const data=await response.json();
      if(!response.ok||typeof data.answer!=='string')throw new Error(data.error||'Não foi possível responder.');
      if(controller.signal.aborted)return;
      setAnswer(data.answer);
      if(!invited.current){
        invited.current=true;
        timer.current=setTimeout(()=>setPopup(true),5000);
      }
    } catch(e) {
      if(!controller.signal.aborted){setError(e instanceof Error?e.message:'Não foi possível responder.');setInput(question);}
    } finally {
      if(!controller.signal.aborted){lock.current=false;setBusy(false);}
    }
  }

  return <>
    <div className="rounded-2xl border border-[#d9e2dc] bg-[#ffffff] text-[#1b2d22] shadow-[0_18px_50px_-35px_#173b2a]">
      <div className="flex items-center gap-3 border-b border-[#e3e9e4] px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#204d36] text-white"><MessageCircle size={21}/></span>
        <div className="flex-1"><p className="font-semibold">Assistente ShopForge</p><p className="text-xs text-[#65786a]">Experimenta a IA, sem criar conta</p></div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-[#286346]"><span className="h-2 w-2 rounded-full bg-[#31905b]"/> Demo</span>
      </div>
      <div className="min-h-[210px] space-y-4 px-5 py-5 sm:px-6" aria-live="polite" aria-busy={busy}>
        {!message?<><p className="max-w-[90%] rounded-xl rounded-tl-sm bg-[#eff4ef] p-4 text-sm leading-relaxed">Olá! Estás a pensar criar uma loja online ou queres melhorar um negócio que já tens? Conta-me a tua ideia.</p><div className="flex flex-wrap gap-2">{questions.map(q=><button key={q} type="button" onClick={()=>setInput(q)} className="rounded-lg border border-[#d9e2dc] px-3 py-2 text-xs font-medium text-[#34523d] transition hover:bg-[#eff4ef] focus-visible:outline-2 focus-visible:outline-[#286346]">{q}</button>)}</div></>:<><p className="ml-auto max-w-[90%] break-words rounded-xl rounded-tr-sm bg-[#e0eddf] p-4 text-sm leading-relaxed">{message}</p>{busy&&<p className="flex items-center gap-2 text-sm text-[#53685a]"><Loader2 size={16} className="motion-safe:animate-spin"/> A preparar a tua resposta…</p>}{answer&&<motion.p initial={reduce?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} className="max-w-[95%] whitespace-pre-wrap break-words rounded-xl rounded-tl-sm bg-[#eff4ef] p-4 text-sm leading-relaxed">{answer}</motion.p>}{error&&<p role="alert" className="rounded-lg bg-[#fff2e5] p-3 text-xs leading-relaxed text-[#874c22]">{error}</p>}</>}
      </div>
      <form onSubmit={send} className="border-t border-[#e3e9e4] p-4 sm:p-5">
        <label htmlFor="landing-chat-input" className="sr-only">A tua pergunta</label>
        <div className="flex items-end gap-2 rounded-xl border border-[#cad8ce] p-2 focus-within:border-[#286346]">
          <textarea id="landing-chat-input" rows={2} maxLength={600} value={input} disabled={busy} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}} placeholder="Escreve a tua pergunta…" className="min-w-0 flex-1 resize-none !bg-transparent px-2 py-2 text-sm !text-[#1b2d22] outline-none" />
          <button type="submit" disabled={busy||!input.trim()} aria-label="Enviar mensagem" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#245439] text-white transition hover:bg-[#173b2a] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286346]">{busy?<Loader2 size={17} className="motion-safe:animate-spin"/>:<ArrowUp size={19}/>}</button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#65786a]">Demonstração limitada. A mensagem é enviada ao Gemini para gerar a resposta; não incluas dados pessoais ou confidenciais.</p>
      </form>
    </div>
    <AnimatePresence>{popup&&<motion.aside role="region" aria-label="Convite para criar conta" initial={reduce?false:{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={reduce?undefined:{opacity:0,y:20}} transition={{duration:reduce?0:.28}} className="fixed bottom-4 right-4 z-[70] w-[calc(100%-2rem)] max-w-[390px] rounded-2xl border border-[#c0d2c2] bg-[#f8faf5] p-5 text-[#172d20] shadow-[0_20px_70px_-20px_#172d2080] sm:bottom-6 sm:right-6 sm:p-6">
      <button type="button" aria-label="Fechar convite" onClick={()=>setPopup(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-[#53685a] hover:bg-[#e5eee5]"><X size={19}/></button>
      <p className="mb-3 pr-8 text-xs font-semibold uppercase tracking-[.12em] text-[#286346]">A tua próxima etapa</p><h3 className="pr-5 text-2xl font-semibold leading-tight tracking-[-.035em]">Gostaste da experiência?</h3><p className="mt-2 text-sm leading-relaxed text-[#53685a]">Transforma as ideias em ação. Cria uma conta e começa a construir o teu negócio com a ShopForge.</p>
      <p className="mt-4 flex items-center gap-2 text-xs font-medium"><Check size={15} className="text-[#286346]"/> Plano Starter gratuito</p>
      <Link href="/register" className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#245439] px-4 py-3 font-semibold text-white hover:bg-[#173b2a]">Criar a minha conta <ArrowRight size={17}/></Link>
      <button type="button" onClick={()=>setPopup(false)} className="mt-3 w-full py-2 text-xs text-[#53685a] hover:underline">Agora não</button>
    </motion.aside>}</AnimatePresence>
  </>;
}
