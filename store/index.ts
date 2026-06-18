import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string | null;
  emailVerified?: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User, token: string) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      setUser: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("isAdmin", user.role === "ADMIN" ? "true" : "false");
        }
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: user.role === "ADMIN",
        });
      },
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("isAdmin");
        }
        set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);

// ==================== CART STORE ====================
interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  image?: string;
  price: number;
  quantity: number;
  stock: number;
  attributes?: Record<string, string>;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncWithServer: (items: CartItem[]) => void;
}

const calculateTotals = (items: CartItem[]) => ({
  itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      itemCount: 0,
      subtotal: 0,
      addItem: (item) => {
        set((state) => {
          const key = `${item.productId}-${item.variantId || "default"}`;
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );

          if (existing) {
            const newItems = state.items.map((i) =>
              i.productId === item.productId && i.variantId === item.variantId
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                : i
            );
            return { items: newItems, ...calculateTotals(newItems), isOpen: true };
          }

          const newItems = [...state.items, { ...item, id: item.id || key }];
          return { items: newItems, ...calculateTotals(newItems), isOpen: true };
        });
      },
      updateQuantity: (id, quantity) =>
        set((state) => {
          const newItems = quantity <= 0
            ? state.items.filter((i) => i.id !== id)
            : state.items.map((i) => (i.id === id ? { ...i, quantity } : i));
          return { items: newItems, ...calculateTotals(newItems) };
        }),
      removeItem: (id) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== id);
          return { items: newItems, ...calculateTotals(newItems) };
        }),
      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      syncWithServer: (items) => set({ items, ...calculateTotals(items) }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ==================== WISHLIST STORE ====================
interface WishlistStore {
  productIds: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isWishlisted: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
