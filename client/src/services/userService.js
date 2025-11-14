import { apiRequest } from './api';

export const updateProfile = (token, payload) =>
  apiRequest('/api/users/me', {
    method: 'PUT',
    data: payload,
    token,
  });

export const uploadAvatar = (token, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiRequest('/api/users/me/avatar', {
    method: 'POST',
    data: formData,
    token,
  });
};

export const updateStatus = (token, status) =>
  apiRequest('/api/users/me/status', {
    method: 'PATCH',
    data: { status },
    token,
  });
