import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  verify: (email: string, code: string) => api.post('/auth/verify', { email, code }),
  resendCode: (email: string) => api.post('/auth/resend-code', { email }),
  login: (data: any) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
  deleteAccount: () => api.delete('/auth/account'),
};

// Products
export const productsApi = {
  getAll: (category?: string) => api.get('/products', { params: category ? { category } : {} }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Stock
export const stockApi = {
  get: (productId: string) => api.get(`/stock/${productId}`),
  update: (productId: string, quantity: number) => api.put(`/stock/${productId}`, { quantity }),
  getLow: (threshold?: number) => api.get('/stock/low', { params: threshold ? { threshold } : {} }),
};

// Orders
export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// Product Listings
export const productListingsApi = {
  getAll: () => api.get('/product-listings'),
  getForProduct: (productId: string) => api.get(`/product-listings/product/${productId}`),
  getSellerListings: (sellerId: string) => api.get(`/product-listings/seller/${sellerId}`),
  getFeatured: (limit?: number) => api.get('/product-listings/featured', { params: limit ? { limit } : {} }),
  create: (data: any) => api.post('/product-listings', data),
  update: (id: string, data: any) => api.put(`/product-listings/${id}`, data),
  updateStock: (id: string, quantityChange: number) => api.put(`/product-listings/${id}/stock`, { quantityChange }),
  delete: (id: string) => api.delete(`/product-listings/${id}`),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// KYC
export const kycApi = {
  submit: (documentType: string, documentUrl: string) =>
    api.post('/kyc/submit', { documentType, documentUrl }),
  getMe: () => api.get('/kyc/me'),
  getAll: () => api.get('/kyc'),
  review: (id: string, status: string) => api.put(`/kyc/${id}/review`, { status }),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getCommissions: () => api.get('/admin/commissions'),
  broadcastNotification: (title: string, message: string, role?: string) =>
    api.post('/admin/broadcast/notification', { title, message, role }),
  broadcastMessage: (content: string, role?: string) =>
    api.post('/admin/broadcast/message', { content, role }),
};

// Payments
export const paymentsApi = {
  initiate: (orderId: string, provider: string, phone: string) =>
    api.post('/payments/initiate', { orderId, provider, phone }),
  getStatus: (orderId: string) => api.get(`/payments/status/${orderId}`),
  verify: (reference: string) => api.get(`/payments/verify/${reference}`),
  confirm: (orderId: string, status: string) => api.put(`/payments/${orderId}/confirm`, { status }),
};

// Invoices
export const invoicesApi = {
  download: (orderId: string) => {
    // Pour les PDF, on appelle directement le backend sans passer par le proxy Next.js
    // Le proxy Vercel ne gère pas bien les réponses binaires (blob)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    if (backendUrl) {
      // En production : appel direct au backend Railway
      return axios.get(`${backendUrl}/invoices/${orderId}`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      });
    }

    // En local / fallback : via le proxy
    return api.get(`/invoices/${orderId}`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });
  },
};

// Advance Orders
export const advanceOrdersApi = {
  create: (data: any) => api.post('/advance-orders', data),
  updateStatus: (id: string, status: string) => api.put(`/advance-orders/${id}/status`, { status }),
  createBuyerRequest: (data: any) => api.post('/advance-orders/buyer-request', data),
  createSellerOffer: (data: any) => api.post('/advance-orders/seller-offer', data),
  getBuyerOrders: () => api.get('/advance-orders/buyer'),
  getSellerOrders: () => api.get('/advance-orders/seller'),
  getDetail: (id: string) => api.get(`/advance-orders/${id}`),
  accept: (id: string) => api.put(`/advance-orders/${id}/accept`),
  reject: (id: string, reason?: string) => api.put(`/advance-orders/${id}/reject`, { reason }),
};

// Messages
export const messagesApi = {
  createConversation: (participantId: string, title?: string, orderId?: string) =>
    api.post('/messaging/conversations', { participantId, title, orderId }),
  getConversations: () => api.get('/messaging/conversations'),
  getConversationMessages: (conversationId: string) => api.get(`/messaging/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string, receiverId?: string, attachments?: string[]) =>
    api.post('/messaging/messages', { conversationId, receiverId, content, attachments }),
  getUnreadCount: () => api.get('/messaging/unread-count'),
};

// Transport
export const transportApi = {
  getAllRates: (filters?: { origin?: string; destination?: string; productCategory?: string }) =>
    api.get('/transport/rates', { params: filters }),
  getRateById: (id: string) => api.get(`/transport/rates/${id}`),
  getMyRates: () => api.get('/transport/my-rates'),
  createRate: (data: any) => api.post('/transport/rates', data),
  updateRate: (id: string, data: any) => api.put(`/transport/rates/${id}`, data),
  deleteRate: (id: string) => api.delete(`/transport/rates/${id}`),
};

// Negotiations (Négociation de prix)
export const negotiationsApi = {
  create: (data: { productId: string; proposedPrice: number; quantity: number; message?: string }) =>
    api.post('/negotiations', data),
  getAll: () => api.get('/negotiations'),
  getOne: (id: string) => api.get(`/negotiations/${id}`),
  respond: (id: string, data: { action: string; counterPrice?: number; message?: string }) =>
    api.put(`/negotiations/${id}/respond`, data),
};

// Reviews (Notes et avis)
export const reviewsApi = {
  create: (data: { orderId: string; targetId: string; rating: number; comment?: string; type: string }) =>
    api.post('/reviews', data),
  getUserReviews: (userId: string) => api.get(`/reviews/user/${userId}`),
  getOrderReviews: (orderId: string) => api.get(`/reviews/order/${orderId}`),
};

// Seasons (Calendrier agricole)
export const seasonsApi = {
  get: (month?: number, region?: string) =>
    api.get('/products/seasons', { params: { month, region } }),
};

// Installments (Paiement échelonné)
export const installmentsApi = {
  create: (orderId: string, installments: number) =>
    api.post('/installments', { orderId, installments }),
  getPlan: (orderId: string) => api.get(`/installments/${orderId}`),
  markPaid: (paymentId: string) => api.put(`/installments/${paymentId}/pay`),
};

// Upload (Images)
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Delivery (Livraison)
export const deliveryApi = {
  getServiceOptions: () => api.get('/delivery/service-options'),
  calculateCost: (data: { transportRateId: string; weight: number; serviceType: string }) =>
    api.post('/delivery/calculate', data),
  create: (data: {
    orderId: string;
    transportRateId: string;
    weight: number;
    serviceType: string;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
  }) => api.post('/delivery/create', data),
  getTracking: (orderId: string) => api.get(`/delivery/tracking/${orderId}`),
  updateStatus: (deliveryId: string, data: { status: string; location?: string; description?: string; photoUrl?: string }) =>
    api.put(`/delivery/${deliveryId}/status`, data),
  getMyDeliveries: () => api.get('/delivery/my-deliveries'),
};

// Journal Agricole (Prix & Articles)
export const journalApi = {
  getPrices: () => api.get('/journal/prices'),
  refreshPrices: () => api.post('/journal/prices/refresh'),
  getArticles: () => api.get('/journal/articles'),
  createArticle: (data: {
    title: string;
    summary: string;
    content?: string;
    category: string;
    source?: string;
    sourceUrl?: string;
    imageUrl?: string;
  }) => api.post('/journal/articles', data),
  deleteArticle: (id: string) => api.delete(`/journal/articles/${id}`),
};
