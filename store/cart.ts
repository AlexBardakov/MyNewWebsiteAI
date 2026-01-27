import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  variant?: string;
  priceRub: number;
  quantity: number;
  unit: string;
  image?: string;
  step?: number;
}

interface CartState {
  items: CartItem[];
  total: number;

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        let newItems;
        if (existingItem) {
          // Если товар уже есть, увеличиваем количество
          // Округляем до 3 знаков, чтобы не было 0.30000004
          const newQty = Number((existingItem.quantity + item.quantity).toFixed(3));
          newItems = currentItems.map((i) =>
            i.id === item.id ? { ...i, quantity: newQty } : i
          );
        } else {
          newItems = [...currentItems, item];
        }

        // ПЕРЕСЧЕТ СУММЫ
        const total = newItems.reduce((sum, i) => sum + i.priceRub * i.quantity, 0);

        set({ items: newItems, total });
      },

      removeItem: (id) => {
        const newItems = get().items.filter((i) => i.id !== id);
        // ПЕРЕСЧЕТ СУММЫ
        const total = newItems.reduce((sum, i) => sum + i.priceRub * i.quantity, 0);
        set({ items: newItems, total });
      },

      updateQuantity: (id, quantity) => {
        const newItems = get().items.map((i) =>
          i.id === id ? { ...i, quantity: quantity } : i
        );
        // ПЕРЕСЧЕТ СУММЫ
        const total = newItems.reduce((sum, i) => sum + i.priceRub * i.quantity, 0);
        set({ items: newItems, total });
      },

      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);