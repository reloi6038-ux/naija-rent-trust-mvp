/**
 * API client — thin wrapper over fetch with credentials + error handling.
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const API = {
  async request(path, opts = {}) {
    const res = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new ApiError(data.message || `Request failed (${res.status})`, res.status, data);
    return data;
  },
  get(p) { return this.request(p); },
  post(p, body) { return this.request(p, { method: 'POST', body: JSON.stringify(body) }); },
  patch(p, body) { return this.request(p, { method: 'PATCH', body: JSON.stringify(body) }); },
  del(p) { return this.request(p, { method: 'DELETE' }); },
  async upload(p, formData, method = 'POST') {
    const res = await fetch(`/api${p}`, { method, credentials: 'include', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.message || 'Upload failed', res.status, data);
    return data;
  }
};

