const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function apiRequest(path, { method = 'GET', data, token, headers = {} } = {}) {
  const config = {
    method,
    headers: { ...headers },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data instanceof FormData) {
    config.body = data;
  } else if (data !== undefined) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  const contentType = response.headers.get('Content-Type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export { API_BASE };
