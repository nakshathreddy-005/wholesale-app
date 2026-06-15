import { create } from 'zustand';
import { productService } from '../services/productService';

export const useProductStore = create((set) => ({
  products: [],
  product: null,
  categories: [],
  lowStockProducts: [],
  total: 0,
  isLoading: false,
  error: null,

  fetchProducts: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await productService.getAll(params);
      set({ products: data.products, total: data.total, isLoading: false });
    } catch (err) { set({ error: err.message, isLoading: false }); }
  },

  fetchCategories: async () => {
    try {
      const { data } = await productService.getCategories();
      set({ categories: data.categories });
    } catch (err) { console.error(err); }
  },

  fetchLowStock: async () => {
    try {
      const { data } = await productService.getLowStock();
      set({ lowStockProducts: data.products });
    } catch (err) { console.error(err); }
  },

  createProduct: async (productData) => {
    const { data } = await productService.create(productData);
    set((s) => ({ products: [data.product, ...s.products] }));
    return data.product;
  },

  updateProduct: async (id, productData) => {
    const { data } = await productService.update(id, productData);
    set((s) => ({ products: s.products.map((p) => (p._id === id ? data.product : p)) }));
    return data.product;
  },

  deleteProduct: async (id) => {
    await productService.delete(id);
    set((s) => ({ products: s.products.filter((p) => p._id !== id) }));
  },
}));
