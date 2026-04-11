import api from "./axios.js";

export const getRepoActivity = (repoId, page = 1) => api.get(`/activity/repo/${repoId}?page=${page}`);
export const getMyActivity = (page = 1) => api.get(`/activity/me?page=${page}`);