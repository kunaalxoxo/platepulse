import api from './api';

export const getCommunityPosts = (params) => api.get('/community', { params });
export const createPost = (data) => api.post('/community', data);
export const likePost = (id) => api.post(`/community/${id}/like`);
export const addComment = (id, data) => api.post(`/community/${id}/comment`, data);
