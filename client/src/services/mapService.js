import api from './api';

export const getMapMarkers = (params) => api.get('/map/markers', { params });
export const getNearbyDonations = (params) => api.get('/map/donations', { params });
export const getNearbyProducts = (params) => api.get('/map/products', { params });
