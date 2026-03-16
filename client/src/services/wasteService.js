import api from './api';

export const getWasteRequests = (params) => api.get('/waste', { params });
export const createWasteRequest = (data) => api.post('/waste', data);
export const updateWasteRequest = (id, data) => api.put(`/waste/${id}`, data);
