import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  priceRub: number; // Вернул priceRub как у вас было
  quantity: number;
  image?: string;
  unit: string;
  step: number;     // <-- Это поле ОБЯЗАТЕЛЬНО нужно для калькуляции
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === item.id
                // Используем сохраненный шаг или тот, что пришел
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        ),
      })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, item) => acc + (item.unit === 'pcs' ? item.quantity : 1), 0),

      totalPrice: () => get().items.reduce((acc, item) => {
        if (item.unit === 'kg') {
           // Цена за кг * граммы / 1000
           return acc + (item.priceRub * item.quantity) / 1000;
        }
        return acc + item.priceRub * item.quantity;
      }, 0),
    }),
    {
      name: 'cheese-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);