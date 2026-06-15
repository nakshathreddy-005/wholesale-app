import { create } from 'zustand';
import { billingService } from '../services/allServices';

export const useBillingStore = create((set) => ({
  invoices: [],
  invoice: null,
  stats: null,
  total: 0,
  isLoading: false,

  fetchStats: async () => {
    try {
      const { data } = await billingService.getDashboardStats();
      set({ stats: data.stats });
    } catch (err) { console.error(err); }
  },

  fetchInvoices: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await billingService.getAll(params);
      set({ invoices: data.invoices, total: data.total, isLoading: false });
    } catch (err) { set({ isLoading: false }); }
  },

  fetchInvoice: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await billingService.getById(id);
      set({ invoice: data.invoice, isLoading: false });
    } catch (err) { set({ isLoading: false }); }
  },

  createInvoice: async (invoiceData) => {
    const { data } = await billingService.createInvoice(invoiceData);
    set((s) => ({ invoices: [data.invoice, ...s.invoices] }));
    return data.invoice;
  },

  downloadPDF: async (id, invoiceNumber) => {
    const { data } = await billingService.downloadPDF(id);
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
}));
