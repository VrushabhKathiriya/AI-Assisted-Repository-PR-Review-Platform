import api from "./axios.js";

export const addContributor = (repoId, data) => api.post(`/repos/${repoId}/contributors`, data);
export const inviteContributor = (repoId, data) => api.post(`/repos/${repoId}/contributors/invite`, data);
export const acceptInvitation = (token) => api.post(`/repos/contributors/accept/${token}`);
export const declineInvitation = (token) => api.post(`/repos/contributors/decline/${token}`);
export const getPendingInvitations = (repoId) => api.get(`/repos/${repoId}/contributors/invitations`);
export const cancelInvitation = (invitationId) => api.delete(`/repos/contributors/invitations/${invitationId}`);
export const removeContributor = (repoId, userId) => api.delete(`/repos/${repoId}/contributors/${userId}`);
export const getContributors = (repoId) => api.get(`/repos/${repoId}/contributors`);