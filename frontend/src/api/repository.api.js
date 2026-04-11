import api from "./axios.js";

export const createRepo = (data) => api.post("/repos", data);
export const getRepos = () => api.get("/repos");
export const getRepoById = (repoId) => api.get(`/repos/${repoId}`);
export const updateRepo = (repoId, data) => api.patch(`/repos/${repoId}`, data);
export const deleteRepo = (repoId) => api.delete(`/repos/${repoId}`);
export const getRepoRules = (repoId) => api.get(`/repos/${repoId}/rules`);