import api from "./axios.js";

export const createFile = (repoId, data) => api.post(`/files/${repoId}`, data);
export const getFiles = (repoId) => api.get(`/files/${repoId}`);
export const getFileById = (fileId) => api.get(`/files/file/${fileId}`);
export const updateFile = (fileId, data) => api.patch(`/files/file/${fileId}`, data);
export const deleteFile = (fileId) => api.delete(`/files/file/${fileId}`);