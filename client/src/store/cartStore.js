import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find(i => i._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) return state; // Cap at max stock
        return {
          items: state.items.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter(i => i._id !== productId)
    }));
  },

  updateQty: (productId, qty) => {
    set((state) => {
      // Find max limit safely (could inject dynamically if deeply linked)
      return {
        items: state.items.map(i => i._id === productId ? { ...i, quantity: Math.max(1, qty) } : i)
      };
    });
  },

  clearCart: () => set({ items: [] }),

  getCartTotal: () => {
    const items = get().items;
    return items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  }
}));

export default useCartStore;
