import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ComparisonStore {
  productIds: string[];
  addProduct: (productId: string) => void;
  removeProduct: (productId: string) => void;
  clearComparison: () => void;
  isInComparison: (productId: string) => boolean;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      addProduct: (productId) => {
        const { productIds } = get();
        if (productIds.length >= 4) {
          // Limit to 4 products for better UI
          return;
        }
        if (!productIds.includes(productId)) {
          set({ productIds: [...productIds, productId] });
        }
      },
      removeProduct: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },
      clearComparison: () => set({ productIds: [] }),
      isInComparison: (productId) => get().productIds.includes(productId),
    }),
    {
      name: 'shopforge-comparison',
    }
  )
);
