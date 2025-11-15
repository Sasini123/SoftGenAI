import { apiRequest } from './api';

export const saveDiagram = (token, source) =>
  apiRequest('/api/diagrams', {
    method: 'POST',
    data: { source },
    token,
  });

export const loadDiagram = (token, id) =>
  apiRequest(`/api/diagrams/${id}`, {
    token,
  });
