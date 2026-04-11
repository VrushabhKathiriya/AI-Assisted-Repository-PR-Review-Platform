import api from "./axios.js";

export const createPR = (fileId, data) => api.post(`/pr/file/${fileId}`, data);
export const reviewPR = (prId, data) => api.patch(`/pr/${prId}/review`, data);
export const getPRsByRepo = (repoId) => api.get(`/pr/repo/${repoId}`);