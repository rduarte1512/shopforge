'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ArrowUp, BarChart3, Check, Copy, History, Loader2, Maximize2, Mic, Minimize2, Package, PanelRightOpen, Plus, Sparkles, Square, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { chatWithAssistant } from '@/lib/ai-actions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Conversation = { id: number; messages: Message[] };
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const MIN_WIDTH = 340;
const MAX_WIDTH = 820;
const DEFAULT_WIDTH = 440;
const WIDTH_KEY = 'shopforge:assistant-width';
const suggestions = [
  { icon: TrendingUp, title: 'Aumentar vendas', prompt: 'Que estratégias posso usar para aumentar as vendas da minha loja online?' },
  { icon: Package, title: 'Melhorar produtos', prompt: 'Como posso melhorar as descrições e as páginas dos meus produtos?' },
  { icon: BarChart3, title: 'Analisar resultados', prompt: 'Que métricas devo acompanhar para avaliar o desempenho da minha loja?' },
];
const iconButton = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-gray hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40';

function clampWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

function AssistantMark({ large = false }: { large?: boolean }) {
  return (
    <span className={`relative grid shrink-0 place-items-center bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20 ${large ? 'h-16 w-16 rounded-[22px]' : 'h-9 w-9 rounded-xl'}`}>
      <Sparkles className={large ? 'h-8 w-8' : 'h-4 w-4'} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

export default function GlobalAssistant() {
  const { userId } = useAuth();
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recent, setRecent] = useState<Conversation[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const requestRef = useRef(0);
  const busyRef = useRef(false);
  const conversationId = useRef(0);
  const nextId = useRef(1);
  const dragRef = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const browser = window as SpeechWindow;
    setVoiceSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition));
    try {
      const saved = localStorage.getItem(WIDTH_KEY);
      if (saved && Number.isFinite(Number(saved))) setWidth(clampWidth(Number(saved)));
    } catch { /* The default works without local storage. */ }
    return () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      recognition?.abort();
      requestRef.current++;
      busyRef.current = false;
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(WIDTH_KEY, String(width)); } catch { /* Optional preference. */ }
  }, [width]);

  // Never expose the previous account's conversation after signing out or switching accounts.
  useEffect(() => {
    requestRef.current++;
    busyRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.abort();
    setListening(false);
    setIsLoading(false);
    setMessages([]);
    setRecent([]);
    setInput('');
    setError('');
    setVoiceNotice('');
    setCopied(null);
    setShowRecent(false);
    setIsOpen(false);
    conversationId.current = nextId.current++;
  }, [userId]);

  useEffect(() => {
    if (isOpen && !showRecent) messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [messages, isOpen, isLoading, showRecent, reducedMotion]);

  useEffect(() => {
    if (!isOpen || showRecent || listening) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [isOpen, showRecent, listening]);

  function stopVoice(discard = false) {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (discard) {
      recognitionRef.current = null;
      recognition.abort();
      setListening(false);
    } else {
      try { recognition.stop(); } catch {
        recognitionRef.current = null;
        setListening(false);
      }
    }
  }

  function closePanel() {
    stopVoice(true);
    setIsOpen(false);
    setShowRecent(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      stopVoice(true);
      setIsOpen(false);
      setShowRecent(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  function toggleVoice() {
    if (recognitionRef.current) {
      stopVoice();
      return;
    }
    setIsOpen(true);
    setShowRecent(false);
    setVoiceNotice('');
    const browser = window as SpeechWindow;
    const Speech = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Speech) {
      setVoiceNotice('O ditado não está disponível neste navegador. Podes escrever normalmente.');
      return;
    }
    const recognition = new Speech();
    const prefix = input.trimEnd();
    recognition.lang = 'pt-PT';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    setListening(true);

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ').trim();
      setInput([prefix, transcript].filter(Boolean).join(' '));
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setListening(false);
      if (event.error === 'aborted') return;
      setVoiceNotice(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Permite o acesso ao microfone nas definições do navegador para usar o ditado.'
          : event.error === 'no-speech'
            ? 'Não foi detetada voz. Tenta falar novamente.'
            : 'Não foi possível captar a voz. Verifica o microfone e a ligação e tenta novamente.'
      );
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setListening(false);
    };
    try { recognition.start(); } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceNotice('Não foi possível iniciar o microfone. Tenta novamente.');
    }
  }

  function archiveCurrent() {
    if (!messages.length) return;
    setRecent(previous => [{ id: conversationId.current, messages }, ...previous.filter(item => item.id !== conversationId.current)].slice(0, 12));
  }

  function newConversation() {
    if (busyRef.current) return;
    stopVoice(true);
    archiveCurrent();
    conversationId.current = nextId.current++;
    setMessages([]);
    setInput('');
    setError('');
    setVoiceNotice('');
    setCopied(null);
    setShowRecent(false);
  }

  function restoreConversation(conversation: Conversation) {
    if (busyRef.current) return;
    stopVoice(true);
    archiveCurrent();
    conversationId.current = conversation.id;
    setMessages(conversation.messages);
    setRecent(previous => previous.filter(item => item.id !== conversation.id));
    setInput('');
    setError('');
    setVoiceNotice('');
    setCopied(null);
    setShowRecent(false);
  }

  async function send(text = input, retry = false) {
    const value = text.trim();
    if (!value || busyRef.current || recognitionRef.current) return;
    setIsOpen(true);
    setShowRecent(false);
    setInput('');
    setError('');
    const history = messages[messages.length - 1]?.role === 'user' ? messages.slice(0, -1) : messages;
    const next: Message[] = retry ? messages : [...history, { role: 'user', content: value }];
    setMessages(next);
    busyRef.current = true;
    setIsLoading(true);
    const request = ++requestRef.current;
    try {
      // The existing server action expects a user message first and a user message last.
      const response = await chatWithAssistant(next);
      if (request !== requestRef.current) return;
      setMessages([...next, { role: 'assistant', content: response }]);
    } catch (err) {
      if (request !== requestRef.current) return;
      console.error('Assistant error:', err);
      setError('Não foi possível obter uma resposta. Tenta novamente.');
    } finally {
      if (request === requestRef.current) {
        busyRef.current = false;
        setIsLoading(false);
      }
    }
  }

  async function copyMessage(index: number, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(index);
    } catch {
      setCopied(null);
    }
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.form
            key="assistant-launcher"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onSubmit={event => { event.preventDefault(); void send(); }}
            className="fixed bottom-4 right-4 z-[9999] flex w-[390px] max-w-[calc(100vw_-_2rem)] items-center gap-2 rounded-full border border-border bg-card-bg p-2 shadow-xl sm:bottom-6 sm:right-6"
          >
            <button type="button" onClick={() => setIsOpen(true)} aria-label="Abrir assistente ShopForge" className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-primary"><AssistantMark /></button>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder="Trabalhar com a ShopForge AI" aria-label="Mensagem para a ShopForge AI" className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-text-primary outline-none placeholder:text-text-secondary" />
            <button type="button" onClick={toggleVoice} title={voiceSupported ? 'Ditar mensagem' : 'Disponibilidade do ditado'} aria-label="Ditar mensagem" className={iconButton}><Mic className="h-[18px] w-[18px]" /></button>
            {input.trim() ? (
              <button type="submit" disabled={isLoading} title="Enviar mensagem" aria-label="Enviar mensagem" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
            ) : (
              <button type="button" onClick={() => setIsOpen(true)} title="Abrir painel lateral" aria-label="Abrir painel lateral" aria-expanded={false} className={iconButton}><PanelRightOpen className="h-[19px] w-[19px]" /></button>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="assistant-panel"
            id="shopforge-assistant-panel"
            aria-label="Assistente ShopForge AI"
            initial={reducedMotion ? false : { x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: 'easeOut' }}
            style={{ width: expanded ? 'min(100vw, 1120px)' : `min(100vw, ${width}px)` }}
            className="fixed inset-y-0 right-0 z-[10000] flex h-[100dvh] max-w-full flex-col border-l border-border bg-card-bg text-text-primary shadow-2xl"
          >
            {!expanded && (
              <div
                role="separator" aria-label="Redimensionar painel do assistente" aria-orientation="vertical" aria-valuemin={MIN_WIDTH} aria-valuemax={MAX_WIDTH} aria-valuenow={width} tabIndex={0}
                className="group absolute inset-y-0 -left-1.5 z-10 hidden w-3 cursor-col-resize touch-none items-center justify-center outline-none sm:flex focus-visible:bg-primary/20"
                onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); dragRef.current = { x: event.clientX, width: event.currentTarget.parentElement?.getBoundingClientRect().width ?? width }; event.currentTarget.setPointerCapture(event.pointerId); }}
                onPointerMove={event => { const drag = dragRef.current; if (drag) setWidth(clampWidth(drag.width + drag.x - event.clientX)); }}
                onPointerUp={event => { dragRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
                onPointerCancel={() => { dragRef.current = null; }}
                onLostPointerCapture={() => { dragRef.current = null; }}
                onKeyDown={event => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  setWidth(previous => event.key === 'Home' ? MIN_WIDTH : event.key === 'End' ? MAX_WIDTH : clampWidth(previous + (event.key === 'ArrowLeft' ? 24 : -24)));
                }}
              ><span className="h-12 w-1 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></div>
            )}

            <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
              <AssistantMark />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold tracking-tight">ShopForge AI</h2>
                <p className="truncate text-[11px] text-text-secondary">O teu assistente de e-commerce</p>
              </div>
              <button type="button" disabled={isLoading} onClick={() => setShowRecent(previous => !previous)} aria-pressed={showRecent} title="Conversas recentes" aria-label="Conversas recentes" className={iconButton + (showRecent ? ' bg-bg-gray text-primary' : '')}><History className="h-[18px] w-[18px]" /></button>
              <button type="button" disabled={isLoading} onClick={newConversation} title="Nova conversa" aria-label="Nova conversa" className={iconButton}><Plus className="h-5 w-5" /></button>
              <button type="button" onClick={() => setExpanded(previous => !previous)} aria-label={expanded ? 'Restaurar tamanho' : 'Expandir painel'} title={expanded ? 'Restaurar tamanho' : 'Expandir painel'} className={iconButton + ' hidden sm:inline-flex'}>{expanded ? <Minimize2 className="h-[17px] w-[17px]" /> : <Maximize2 className="h-[17px] w-[17px]" />}</button>
              <button type="button" onClick={closePanel} aria-label="Fechar assistente" title="Fechar assistente" className={iconButton}><X className="h-5 w-5" /></button>
            </header>

            {showRecent ? (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-5 flex items-center justify-between"><h3 className="text-base font-semibold">Conversas recentes</h3><button type="button" onClick={() => setShowRecent(false)} className="text-xs font-semibold text-text-secondary hover:text-primary">Voltar</button></div>
                <p className="mb-4 text-xs leading-relaxed text-text-secondary">Histórico desta sessão. Não é guardado após recarregar a página.</p>
                {recent.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-text-secondary">Ainda não tens conversas anteriores.</p> : (
                  <div className="space-y-2">{recent.map(conversation => <button key={conversation.id} type="button" onClick={() => restoreConversation(conversation)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-bg-gray"><History className="h-4 w-4 shrink-0 text-text-secondary" /><span className="truncate text-sm">{conversation.messages[0]?.content}</span></button>)}</div>
                )}
              </div>
            ) : (
              <>
                <div role="log" aria-label="Mensagens da conversa" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-5 py-8 text-center sm:px-7">
                      <AssistantMark large />
                      <span className="mt-5 text-xs font-semibold tracking-wide text-text-secondary">O teu parceiro de negócio</span>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">Por onde começamos?</h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">Explora ideias, melhora a tua loja e encontra respostas para as tuas dúvidas, num só lugar.</p>
                      <div className="mt-7 grid w-full max-w-sm gap-2.5">
                        {suggestions.map(({ icon: Icon, title, prompt }) => (
                          <button key={title} type="button" disabled={listening} onClick={() => { setInput(prompt); inputRef.current?.focus(); }} className="group flex items-center gap-3 rounded-2xl border border-border px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-emerald-600 dark:text-emerald-300"><Icon className="h-[18px] w-[18px]" /></span>
                            <span className="flex-1 text-sm font-medium">{title}</span><ArrowUp className="h-4 w-4 rotate-45 text-text-muted transition-colors group-hover:text-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
                      {messages.map((message, index) => message.role === 'user' ? (
                        <div key={index} className="flex justify-end"><div className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md border border-border bg-bg-gray px-4 py-3 text-sm leading-relaxed">{message.content}</div></div>
                      ) : (
                        <div key={index} className="flex items-start gap-3">
                          <AssistantMark />
                          <div className="min-w-0 flex-1 pt-1">
                            <div className="mb-1 text-xs font-semibold text-text-secondary">ShopForge AI</div>
                            <div className="whitespace-pre-wrap break-words text-sm leading-7">{message.content}</div>
                            <button type="button" onClick={() => void copyMessage(index, message.content)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-text-secondary hover:bg-bg-gray" aria-label="Copiar resposta">{copied === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === index ? 'Copiado' : 'Copiar'}</button>
                          </div>
                        </div>
                      ))}
                      {isLoading && <div className="flex items-center gap-3 text-sm text-text-secondary"><AssistantMark /><Loader2 className="h-4 w-4 animate-spin text-primary" /> A preparar a resposta…</div>}
                      {error && <div role="alert" className="rounded-xl border border-border p-3 text-sm text-text-secondary"><p>{error}</p><button type="button" onClick={() => void send(messages[messages.length - 1]?.content, true)} className="mt-2 font-semibold text-emerald-600 dark:text-emerald-300">Tentar novamente</button></div>}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <footer className="shrink-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 sm:px-5">
                  {voiceNotice && <div role="status" className="mb-2 rounded-xl border border-border px-3 py-2 text-xs leading-relaxed text-text-secondary">{voiceNotice}</div>}
                  <form onSubmit={event => { event.preventDefault(); void send(); }} className="rounded-[22px] border border-border bg-card-bg p-3 shadow-sm transition-colors focus-within:border-primary/60">
                    <textarea
                      ref={inputRef} value={input} readOnly={listening} rows={3}
                      onChange={event => setInput(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
                      placeholder={listening ? 'A ouvir a tua voz…' : 'Trabalhar com a ShopForge AI…'}
                      aria-label="Escrever mensagem"
                      className="block min-h-[72px] w-full resize-y rounded-lg bg-transparent px-1 py-1 text-sm leading-relaxed text-text-primary outline-none"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-xs text-text-secondary" aria-live="polite">
                        {listening ? <><span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" /> A ouvir · para para editar</> : <><Sparkles className="h-4 w-4 shrink-0 text-primary" /> Assistente inteligente</>}
                      </span>
                      <button type="button" onClick={toggleVoice} aria-label={listening ? 'Parar ditado' : 'Ditar mensagem'} aria-pressed={listening} title={listening ? 'Parar ditado' : 'Ditar em português'} className={iconButton + (listening ? ' bg-red-500/10 text-red-500' : '')}>{listening ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}</button>
                      <button type="submit" disabled={!input.trim() || isLoading || listening} aria-label="Enviar mensagem" title="Enviar mensagem" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" strokeWidth={2.4} /></button>
                    </div>
                  </form>
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-text-secondary">{listening ? 'Ditado através do navegador. O texto só é enviado ao assistente quando confirmares.' : 'A IA pode cometer erros. Confirma as informações importantes.'}</p>
                </footer>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
