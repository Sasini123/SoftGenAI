import { apiRequest } from './api';

export const fetchProjects = (token) =>
  apiRequest('/api/projects', { token });

export const createProject = (token, payload) =>
  apiRequest('/api/projects', { method: 'POST', data: payload, token });

export const fetchProjectDetail = (token, projectId) =>
  apiRequest(`/api/projects/${projectId}`, { token });

export const addProjectMember = (token, projectId, emailOrUsername) =>
  apiRequest(`/api/projects/${projectId}/members`, {
    method: 'POST',
    data: { emailOrUsername },
    token,
  });

export const fetchPresence = (token, projectId) =>
  apiRequest(`/api/projects/${projectId}/presence`, { token });

export const updatePresence = (token, projectId, status) =>
  apiRequest(`/api/projects/${projectId}/presence`, {
    method: 'POST',
    data: { status },
    token,
  });

export const fetchDocuments = (token, projectId) =>
  apiRequest(`/api/projects/${projectId}/documents`, { token });

export const createDocument = (token, projectId, payload) =>
  apiRequest(`/api/projects/${projectId}/documents`, {
    method: 'POST',
    data: payload,
    token,
  });

export const uploadDocument = (token, projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/projects/${projectId}/documents/upload`, {
    method: 'POST',
    data: formData,
    token,
  });
};

export const fetchDocumentById = (token, documentId) =>
  apiRequest(`/api/projects/documents/${documentId}`, { token });

export const updateDocument = (token, documentId, payload) =>
  apiRequest(`/api/projects/documents/${documentId}`, {
    method: 'PUT',
    data: payload,
    token,
  });

export const fetchChatMessages = (token, projectId) =>
  apiRequest(`/api/projects/${projectId}/chat`, { token });

export const sendChatMessage = (token, projectId, message) =>
  apiRequest(`/api/projects/${projectId}/chat`, {
    method: 'POST',
    data: { message },
    token,
  });
