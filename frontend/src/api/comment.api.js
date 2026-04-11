import api from "./axios.js";

export const addComment = (prId, data) => api.post(`/pr/${prId}/comments`, data);
export const getComments = (prId) => api.get(`/pr/${prId}/comments`);
export const editComment = (commentId, data) => api.patch(`/pr/comments/${commentId}`, data);
export const deleteComment = (commentId) => api.delete(`/pr/comments/${commentId}`);