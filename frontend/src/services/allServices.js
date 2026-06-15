import api from './api';

export const billingService = {
  createInvoice: (data) => api.post('/billing', data),
  getAll: (params) => api.get('/billing', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  updatePayment: (id, data) => api.put(`/billing/${id}/payment`, data),
  downloadPDF: (id) => api.get(`/billing/${id}/pdf`, { responseType: 'blob' }),
  getDashboardStats: () => api.get('/billing/dashboard-stats'),
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const supplierService = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const inventoryService = {
  getLogs: (params) => api.get('/inventory/logs', { params }),
  stockIn: (data) => api.post('/inventory/stock-in', data),
  stockOut: (data) => api.post('/inventory/stock-out', data),
  adjust: (data) => api.post('/inventory/adjust', data),
};

export const reportService = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getCustomers: () => api.get('/reports/customers'),
  getSuppliers: () => api.get('/reports/suppliers'),
  exportCSV: (type) => api.get(`/reports/export/${type}`, { responseType: 'blob' }),
};

export const chatbotService = {
  chat: (message, history = []) => api.post('/bot/chat', { message, history }),
};
