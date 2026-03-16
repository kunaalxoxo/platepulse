import api from './api';

export const getImpactStats = () => api.get('/impact/stats');
export const getUserImpact = () => api.get('/impact/user');
export const getGlobalImpact = () => api.get('/impact/global');
