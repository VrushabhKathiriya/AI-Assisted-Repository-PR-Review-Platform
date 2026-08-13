import api from "./axios.js";

export const createPR = (fileId, data) => api.post(`/pr/file/${fileId}`, data);
export const reviewPR = (prId, data) => api.patch(`/pr/${prId}/review`, data);
export const getPRsByRepo = (repoId) => api.get(`/pr/repo/${repoId}`);

/*
  WHY this function exists:
  The frontend needs a way to ask the backend:
  "What is the current status of the AI review for this PR?"

  This is a lightweight GET request. It does NOT trigger any AI work.
  The backend simply reads MongoDB and returns the current aiReviewStatus.

  The frontend will call this function repeatedly (polling) every few
  seconds until the status becomes "completed" or "failed".
*/
export const getAIReviewStatus = (prId) => api.get(`/pr/${prId}/ai-review`);