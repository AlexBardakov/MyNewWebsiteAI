import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Тип товара в корзине (упрощенный, только то, что нужно для чекаута)
export type CartItem = {
  id: string;
  name: string;
  priceRub: number;
  image?: string | null;
  unit: string; // 'kg' | 'pcs'
  quantity: number; // кол-во штук или грамм
  step: number; // шаг изменения кол-ва (например, 1 шт или 100 гр)
};

interface CartState {
  items: CartItem[];
  addItem: (product: any) => void; // any заменим на тип Product из Prisma позже
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          // Определяем шаг и начальное кол-во в зависимости от ед. измерения
          const step = product.unit === 'pcs' ? 1 : 100; 
          
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id
                  ? { ...i, quantity: i.quantity + step }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                priceRub: product.priceRub,
                image: product.imageUrl,
                unit: product.unit,
                quantity: step, // Начальное кол-во
                step: step,
              },
            ],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          // Если цена за кг, а количество в граммах (100, 200...), нужно делить
          if (item.unit === 'kg') {
            return total + (item.priceRub * item.quantity) / 1000;
          }
          return total + item.priceRub * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'cheese-cart-storage', // имя ключа в localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);