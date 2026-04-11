import api from "./axios.js";

export const getRepoStats = (repoId) => api.get(`/stats/repo/${repoId}`);
export const getUserStats = () => api.get("/stats/user/me");