export type StorefrontPaymentType = 'stripe' | 'card' | 'paypal' | 'revolut' | 'multibanco' | 'mbway' | 'transfer' | 'cash';

export interface StorefrontPaymentMethod {
  id: string;
  type: StorefrontPaymentType;
  name: string;
  description: string;
  active: boolean;
  instructions?: string;
  badge?: string;
}

export const DEFAULT_STOREFRONT_PAYMENT_METHODS: StorefrontPaymentMethod[] = [
  {
    id: 'stripe-card',
    type: 'stripe',
    name: 'Cartão Bancário',
    description: 'Visa, Mastercard, Apple Pay e Google Pay com checkout seguro.',
    active: true,
    badge: 'Stripe',
    instructions: 'Pagamento seguro por cartão. A encomenda fica registada assim que confirmar o checkout.'
  },
  {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    description: 'Pague com PayPal ou cartão associado à sua conta PayPal.',
    active: true,
    badge: 'Rápido',
    instructions: 'Será redirecionado para concluir o pagamento através do PayPal quando a integração estiver ativa.'
  },
  {
    id: 'revolut',
    type: 'revolut',
    name: 'Revolut Pay',
    description: 'Pagamento rápido com Revolut ou cartão guardado.',
    active: true,
    badge: 'Novo',
    instructions: 'Use Revolut Pay para uma experiência rápida e segura quando a integração estiver ativa.'
  },
  {
    id: 'mbway',
    type: 'mbway',
    name: 'MB WAY',
    description: 'Confirme o pagamento diretamente no telemóvel.',
    active: true,
    badge: 'Portugal',
    instructions: 'Receberá uma notificação no telemóvel para confirmar o pagamento.'
  },
  {
    id: 'multibanco',
    type: 'multibanco',
    name: 'Multibanco',
    description: 'Referência Multibanco para pagamento em ATM ou homebanking.',
    active: true,
    badge: 'Seguro',
    instructions: 'Após confirmar a encomenda, receberá uma referência Multibanco por email.'
  },
  {
    id: 'transfer',
    type: 'transfer',
    name: 'Transferência Bancária',
    description: 'Transferência direta para a conta da loja.',
    active: false,
    instructions: 'Após confirmar, receberá os dados bancários por email.'
  },
  {
    id: 'cash',
    type: 'cash',
    name: 'Pagamento à Entrega',
    description: 'Pagamento em dinheiro quando receber a encomenda.',
    active: false,
    instructions: 'Pague em dinheiro ao receber a sua encomenda.'
  }
];

export function normalizeStorePaymentMethods(methods?: unknown): StorefrontPaymentMethod[] {
  if (!Array.isArray(methods) || methods.length === 0) {
    return DEFAULT_STOREFRONT_PAYMENT_METHODS;
  }

  return methods.map((method: any, index) => {
    const fallback = DEFAULT_STOREFRONT_PAYMENT_METHODS.find(item => item.id === method?.id || item.type === method?.type);

    return {
      id: method?.id || fallback?.id || `payment-${index}`,
      type: method?.type || fallback?.type || 'stripe',
      name: method?.name || fallback?.name || 'Pagamento Seguro',
      description: method?.description || fallback?.description || 'Método de pagamento disponível na loja.',
      active: method?.active !== false,
      instructions: method?.instructions ?? fallback?.instructions ?? '',
      badge: method?.badge || fallback?.badge
    } as StorefrontPaymentMethod;
  });
}

export function getEnabledPaymentMethods(methods?: unknown): StorefrontPaymentMethod[] {
  return normalizeStorePaymentMethods(methods).filter(method => method.active !== false);
}
