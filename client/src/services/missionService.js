import api from './api';

export const getMissions = (params) => api.get('/missions', { params });
export const getMission = (id) => api.get(`/missions/${id}`);
export const createMission = (data) => api.post('/missions', data);
export const completeMission = (id, data) => api.post(`/missions/${id}/complete`, data);
export const getAvailableMissions = () => api.get('/volunteers/missions');
export const acceptMission = (id) => api.post(`/volunteers/missions/${id}/accept`);
export const getLeaderboard = () => api.get('/volunteers/leaderboard');
