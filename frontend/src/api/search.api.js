import api from "./axios.js";

export const globalSearch = (q) => api.get(`/search?q=${q}`);
export const searchRepos = (q) => api.get(`/search/repos?q=${q}`);
export const searchUsers = (q) => api.get(`/search/users?q=${q}`);
export const searchFiles = (q, repoId) => api.get(`/search/files?q=${q}${repoId ? `&repoId=${repoId}` : ""}`);
export const searchPRs = (q, status, repoId) => api.get(`/search/prs?${q ? `q=${q}` : ""}${status ? `&status=${status}` : ""}${repoId ? `&repoId=${repoId}` : ""}`);