'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChartNoAxesCombined, ShieldCheck, X } from 'lucide-react';

type EventType = 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_started' | 'heartbeat';
type PageKind = 'home' | 'product' | 'cart' | 'other';
type StorefrontEvent = { storeId: string; eventType: 'add_to_cart' | 'checkout_started'; productId?: string };
const EVENT_NAME = 'shopforge:traffic-event';
const OPEN_SETTINGS = 'shopforge:traffic-preferences';
const uuid = () => crypto.randomUUID();
const tokenKey = (storeId: string) => 'shopforge-traffic-id-' + storeId;
const choiceKey = (storeId: string) => 'shopforge-traffic-consent-' + storeId;
const sessionKey = (storeId: string) => 'shopforge-traffic-session-' + storeId;
const validUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);

export function emitStorefrontTraffic(event: StorefrontEvent) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
}

function getIdentifiers(storeId: string) {
  const existing = localStorage.getItem(tokenKey(storeId));
  let visitorId: string | undefined;
  try {
    const stored = existing ? JSON.parse(existing) : null;
    if (stored && validUuid(stored.id) && stored.expiresAt > Date.now()) visitorId = stored.id;
  } catch { /* Novo identificador */ }
  if (!visitorId) {
    visitorId = uuid();
    localStorage.setItem(tokenKey(storeId), JSON.stringify({ id: visitorId, expiresAt: Date.now() + 90 * 86400000 }));
  }
  let sessionId = sessionStorage.getItem(sessionKey(storeId));
  if (!sessionId || !validUuid(sessionId)) {
    sessionId = uuid();
    sessionStorage.setItem(sessionKey(storeId), sessionId);
  }
  return { visitorId, sessionId };
}
function classify(path: string, domain: string): { pageKind: PageKind; productId?: string } {
  const prefix = '/s/' + domain;
  const suffix = path.startsWith(prefix) ? path.slice(prefix.length).replace(/^\//, '') : '';
  if (!suffix) return { pageKind: 'home' };
  if (suffix === 'cart') return { pageKind: 'cart' };
  const product = /^product\/([0-9a-f-]{36})(?:\/|$)/i.exec(suffix);
  if (product) return { pageKind: 'product', productId: product[1] };
  return { pageKind: 'other' };
}
export default function StoreTrafficTracker({ storeId, domain }: { storeId: string; domain: string }) {
  const pathname = usePathname() || '';
  const [choice, setChoice] = useState<'unknown' | 'granted' | 'denied' | 'blocked'>('unknown');
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);
  const send = useRef<(eventType: EventType, pageKind: PageKind, productId?: string) => void>(() => {});

  useEffect(() => {
    try {
      const blocked = new URLSearchParams(window.location.search).get('forgepilot-audit') === '1' || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
      setChoice(blocked ? 'blocked' : (localStorage.getItem(choiceKey(storeId)) === 'granted' ? 'granted' : localStorage.getItem(choiceKey(storeId)) === 'denied' ? 'denied' : 'unknown'));
    } catch { setChoice('blocked'); }
    setReady(true);
    lastTrackedPath.current = null;
  }, [storeId]);

  send.current = (eventType: EventType, pageKind: PageKind, productId?: string) => {
    if (choice !== 'granted') return;
    try {
      const { visitorId, sessionId } = getIdentifiers(storeId);
      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        keepalive: true,
        body: JSON.stringify({ domain, visitorId, sessionId, eventId: uuid(), eventType, pageKind, productId: productId || null }),
      }).catch(() => {}); // O acompanhamento nunca pode bloquear a compra.
    } catch { /* Armazenamento bloqueado: não acompanhar */ }
  };

  useEffect(() => {
    if (choice !== 'granted') return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    const { pageKind, productId } = classify(pathname, domain);
    send.current('page_view', pageKind);
    if (pageKind === 'product' && productId) send.current('product_view', pageKind, productId);
  }, [choice, pathname, domain]);

  useEffect(() => {
    if (choice !== 'granted') return;
    const onAction = (event: Event) => {
      const detail = (event as CustomEvent<StorefrontEvent>).detail;
      if (!detail || detail.storeId !== storeId) return;
      const page = classify(window.location.pathname, domain);
      send.current(detail.eventType, page.pageKind, detail.productId);
    };
    const heartbeat = () => {
      if (document.visibilityState === 'visible') send.current('heartbeat', classify(window.location.pathname, domain).pageKind);
    };
    window.addEventListener(EVENT_NAME, onAction);
    document.addEventListener('visibilitychange', heartbeat);
    const timer = window.setInterval(heartbeat, 45_000);
    return () => {
      window.removeEventListener(EVENT_NAME, onAction);
      document.removeEventListener('visibilitychange', heartbeat);
      window.clearInterval(timer);
    };
  }, [choice, storeId, domain]);

  useEffect(() => {
    const open = () => setShowSettings(true);
    window.addEventListener(OPEN_SETTINGS, open);
    return () => window.removeEventListener(OPEN_SETTINGS, open);
  }, []);

  const updateChoice = (next: 'granted' | 'denied') => {
    try {
      localStorage.setItem(choiceKey(storeId), next);
      if (next === 'denied') {
        localStorage.removeItem(tokenKey(storeId));
        sessionStorage.removeItem(sessionKey(storeId));
      }
    } catch { setChoice('blocked'); setShowSettings(false); return; }
    lastTrackedPath.current = null;
    setChoice(next);
    window.dispatchEvent(new Event('shopforge:traffic-consent-changed'));
    setShowSettings(false);
  };

  if (!ready || choice === 'blocked') return null;
  if (choice !== 'unknown' && !showSettings) return null;
  return (
    <aside className="fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-lg rounded-[1.5rem] border border-white/10 bg-slate-950 p-5 text-white shadow-[0_25px_80px_rgba(0,0,0,.35)] sm:bottom-6" aria-label="Preferências de estatísticas">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-300"><ChartNoAxesCombined className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">Ajuda-nos a melhorar a tua experiência</h3>
          <p className="mt-1 text-xs leading-5 text-slate-300">Podemos medir visitas e interações de forma pseudónima e testar pequenas variantes de apresentação? Não recolhemos dados de identificação neste sistema. Podes alterar a opção a qualquer momento.</p>
        </div>
        {showSettings && <button aria-label="Fechar preferências" onClick={() => setShowSettings(false)} className="p-1 text-slate-300 hover:text-white"><X className="h-4 w-4" /></button>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => updateChoice('granted')} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-300">Aceitar estatísticas</button>
        <button onClick={() => updateChoice('denied')} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">Recusar</button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> A compra funciona da mesma forma, independentemente da tua escolha.</p>
    </aside>
  );
}
export function openStoreTrafficPreferences() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_SETTINGS));
}
