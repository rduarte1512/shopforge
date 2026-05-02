'use client';

import { useState, useEffect } from 'react';
import { useMockDB } from '@/lib/store';

const EXCHANGE_RATES: Record<string, number> = {
  'EUR': 1,
  'USD': 1.08,
  'GBP': 0.84,
  'BRL': 5.50,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'BRL': 'R$',
};

export function useCurrency() {
  const { stores, selectedStoreId } = useMockDB();
  const currentStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const [currency, setCurrency] = useState(currentStore?.currency || 'EUR');

  // Detect location-based currency (simulated for demo)
  useEffect(() => {
    const userLocale = navigator.language;
    if (userLocale.includes('US')) setCurrency('USD');
    else if (userLocale.includes('GB')) setCurrency('GBP');
    else if (userLocale.includes('BR')) setCurrency('BRL');
    else setCurrency('EUR');
  }, []);

  const formatPrice = (amount: number, targetCurrency = currency) => {
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[currentStore?.baseCurrency || 'EUR'] || 1;
    const converted = (amount / baseRate) * rate;
    
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: targetCurrency,
    }).format(converted);
  };

  const convertPrice = (amount: number, targetCurrency = currency) => {
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[currentStore?.baseCurrency || 'EUR'] || 1;
    return (amount / baseRate) * rate;
  };

  return {
    currency,
    setCurrency,
    formatPrice,
    convertPrice,
    symbol: CURRENCY_SYMBOLS[currency] || '€',
    availableCurrencies: Object.keys(EXCHANGE_RATES),
  };
}
