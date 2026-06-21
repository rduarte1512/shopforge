'use client';

import { useEffect, useState } from 'react';

const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.84,
  BRL: 5.50,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
};

export function useCurrency(baseCurrency = 'EUR') {
  const safeBaseCurrency = EXCHANGE_RATES[baseCurrency] ? baseCurrency : 'EUR';
  const [currency, setCurrency] = useState(safeBaseCurrency);

  useEffect(() => {
    const userLocale = navigator.language;
    if (userLocale.includes('US')) setCurrency('USD');
    else if (userLocale.includes('GB')) setCurrency('GBP');
    else if (userLocale.includes('BR')) setCurrency('BRL');
    else setCurrency(safeBaseCurrency);
  }, [safeBaseCurrency]);

  const formatPrice = (amount: number, targetCurrency = currency) => {
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[safeBaseCurrency] || 1;
    const converted = (amount / baseRate) * rate;
    
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: targetCurrency,
    }).format(converted);
  };

  const convertPrice = (amount: number, targetCurrency = currency) => {
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    const baseRate = EXCHANGE_RATES[safeBaseCurrency] || 1;
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
