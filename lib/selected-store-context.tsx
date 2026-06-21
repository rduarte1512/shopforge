'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setSelectedStoreCookie } from '@/lib/dashboard-actions';

export const SELECTED_STORE_CHANGED_EVENT = 'shopforge-selected-store-changed';

type StoreSummary = {
  id: string;
  name?: string;
  domain?: string;
  [key: string]: any;
};

interface SelectedStoreContextValue {
  stores: StoreSummary[];
  selectedStoreId: string | null;
  currentStore: StoreSummary | null;
  selectStore: (storeId: string | null) => Promise<void>;
  setStores: (stores: StoreSummary[]) => void;
}

const SelectedStoreContext = createContext<SelectedStoreContextValue | undefined>(undefined);

function getValidStoreId(stores: StoreSummary[], requestedId?: string | null) {
  if (requestedId && stores.some((store) => store.id === requestedId)) return requestedId;
  return stores[0]?.id ?? null;
}

export function SelectedStoreProvider({
  children,
  initialStores,
  initialSelectedStoreId,
}: {
  children: ReactNode;
  initialStores: StoreSummary[];
  initialSelectedStoreId?: string | null;
}) {
  const [stores, setStoresState] = useState<StoreSummary[]>(initialStores || []);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => getValidStoreId(initialStores || [], initialSelectedStoreId));

  const persistSelectedStore = useCallback(async (storeId: string | null) => {
    setSelectedStoreId(storeId);

    if (typeof window !== 'undefined') {
      if (storeId) localStorage.setItem('selectedStoreId', storeId);
      else localStorage.removeItem('selectedStoreId');

      window.dispatchEvent(new CustomEvent(SELECTED_STORE_CHANGED_EVENT, { detail: { storeId } }));
    }

    if (storeId) {
      await setSelectedStoreCookie(storeId);
    }
  }, []);

  useEffect(() => {
    setStoresState(initialStores || []);

    const localStoreId = typeof window !== 'undefined' ? localStorage.getItem('selectedStoreId') : null;
    const nextStoreId = getValidStoreId(initialStores || [], initialSelectedStoreId || localStoreId);

    if (nextStoreId !== selectedStoreId) {
      void persistSelectedStore(nextStoreId);
    }
  }, [initialStores, initialSelectedStoreId, persistSelectedStore, selectedStoreId]);

  useEffect(() => {
    const onSelectedStoreChanged = (event: Event) => {
      const storeId = (event as CustomEvent<{ storeId?: string | null }>).detail?.storeId;
      setSelectedStoreId(getValidStoreId(stores, storeId ?? null));
    };

    window.addEventListener(SELECTED_STORE_CHANGED_EVENT, onSelectedStoreChanged);
    return () => window.removeEventListener(SELECTED_STORE_CHANGED_EVENT, onSelectedStoreChanged);
  }, [stores]);

  const setStores = useCallback((nextStores: StoreSummary[]) => {
    setStoresState(nextStores || []);
    setSelectedStoreId((current) => getValidStoreId(nextStores || [], current));
  }, []);

  const currentStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null,
    [selectedStoreId, stores]
  );

  const value = useMemo<SelectedStoreContextValue>(() => ({
    stores,
    selectedStoreId: currentStore?.id ?? selectedStoreId,
    currentStore,
    selectStore: persistSelectedStore,
    setStores,
  }), [currentStore, persistSelectedStore, selectedStoreId, setStores, stores]);

  return <SelectedStoreContext.Provider value={value}>{children}</SelectedStoreContext.Provider>;
}

export function useSelectedStore() {
  const context = useContext(SelectedStoreContext);
  if (!context) {
    throw new Error('useSelectedStore must be used inside SelectedStoreProvider');
  }
  return context;
}
