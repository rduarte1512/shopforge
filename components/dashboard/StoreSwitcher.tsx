'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, LoaderCircle, Search, Store as StoreIcon, ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface StoreOption {
  id: string;
  name: string;
  domain?: string | null;
}

interface StoreSwitcherProps {
  stores: StoreOption[];
  selectedStoreId: string | null;
  isSwitchingStore: boolean;
  onSelectStore: (storeId: string) => Promise<void>;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('pt-PT').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export default function StoreSwitcher({ stores, selectedStoreId, isSwitchingStore, onSelectStore }: StoreSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownId = useId();
  const pathname = usePathname();
  const activeStore = stores.find(store => store.id === selectedStoreId) || stores[0];

  const filteredStores = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return stores;
    return stores.filter(store => normalizeSearch(store.name + ' ' + (store.domain || '')).includes(needle));
  }, [query, stores]);

  // Close the popup on navigation, click outside or Escape.
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setHighlighted(0);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        event.stopPropagation();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  useEffect(() => {
    if (isSwitchingStore) setOpen(false);
  }, [isSwitchingStore]);

  const choose = (storeId: string) => {
    setOpen(false);
    setQuery('');
    setHighlighted(0);
    if (!isSwitchingStore && storeId !== selectedStoreId) void onSelectStore(storeId);
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted(index => filteredStores.length ? Math.min(index + 1, filteredStores.length - 1) : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted(index => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && filteredStores[highlighted]) {
      event.preventDefault();
      choose(filteredStores[highlighted].id);
    }
  };

  if (!activeStore) return null;

  return (
    <div ref={containerRef} className="relative z-50 mx-2 mb-5">
      <button
        type="button"
        aria-label={'Loja ativa: ' + activeStore.name + '. Selecionar outra loja'}
        aria-expanded={open}
        aria-controls={dropdownId}
        aria-haspopup="listbox"
        disabled={isSwitchingStore}
        onClick={() => { setOpen(wasOpen => !wasOpen); setQuery(''); setHighlighted(0); }}
        className={'group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-wait disabled:opacity-70 ' +
          (open ? 'border-emerald-400/40 bg-white/[0.11]' : 'border-white/10 bg-white/[0.055] hover:border-white/20 hover:bg-white/[0.095]')}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
          {isSwitchingStore ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <StoreIcon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.17em] text-white/40">
            {isSwitchingStore ? 'A mudar de loja' : 'Loja ativa'}
          </span>
          <span className="mt-0.5 block truncate text-sm font-extrabold text-white">{activeStore.name}</span>
        </div>
        <ChevronDown className={'h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-hover:text-white/80 ' + (open ? 'rotate-180' : '')} />
      </button>

      {open && !isSwitchingStore && (
        <div
          id={dropdownId}
          className="absolute inset-x-0 top-[calc(100%+9px)] z-[70] origin-top overflow-hidden rounded-2xl border border-white/15 bg-[#101827] shadow-[0_24px_65px_rgba(0,0,0,0.50)] ring-1 ring-black/10 motion-safe:animate-[store-switcher-in_180ms_ease-out_both]"
        >
          <div className="border-b border-white/[0.08] px-3 pb-3 pt-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">As tuas lojas</span>
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-white/60">
                {stores.length} {stores.length === 1 ? 'loja' : 'lojas'}
              </span>
            </div>
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                ref={inputRef}
                aria-label="Pesquisar loja"
                role="combobox"
                aria-controls={dropdownId + '-options'}
                aria-expanded="true"
                aria-autocomplete="list"
                value={query}
                onChange={event => { setQuery(event.target.value); setHighlighted(0); }}
                onKeyDown={onSearchKeyDown}
                placeholder="Pesquisar loja..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.07] py-2 pl-9 pr-3 text-[13px] font-medium text-white placeholder:text-white/35 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/15"
              />
            </div>
          </div>

          <div id={dropdownId + '-options'} role="listbox" aria-label="Lojas disponíveis" className="max-h-64 space-y-1 overflow-y-auto overscroll-contain p-2 [scrollbar-color:#475569_transparent] [scrollbar-width:thin]">
            {filteredStores.map((store, index) => {
              const isActive = store.id === selectedStoreId;
              return (
                <button
                  key={store.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => choose(store.id)}
                  className={'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ' +
                    (isActive ? 'border-emerald-400/20 bg-emerald-400/[0.13]' : highlighted === index ? 'border-white/10 bg-white/[0.09]' : 'border-transparent hover:bg-white/[0.075]')}
                >
                  <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-black ' +
                    (isActive ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/[0.08] text-white/65')}
                  >
                    {store.name.trim().slice(0, 1).toUpperCase() || <StoreIcon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={'block truncate text-[13px] ' + (isActive ? 'font-extrabold text-white' : 'font-semibold text-white/85')}>{store.name}</span>
                    {store.domain && <span className="mt-0.5 block truncate text-[10px] text-white/40">{store.domain}</span>}
                  </span>
                  {isActive && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-slate-950"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>}
                </button>
              );
            })}
            {filteredStores.length === 0 && (
              <div className="px-3 py-7 text-center">
                <Search className="mx-auto mb-2 h-5 w-5 text-white/30" />
                <p className="text-xs font-semibold text-white/60">Nenhuma loja encontrada.</p>
                <p className="mt-1 text-[11px] text-white/35">Experimenta outro nome.</p>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/stores"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-white/[0.08] px-4 py-3 text-xs font-bold text-emerald-300 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Gerir as minhas lojas <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
