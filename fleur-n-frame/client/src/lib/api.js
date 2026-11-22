const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export function templateImageUrl(original_path) {
  if (!original_path) return "";
  if (original_path.startsWith("http")) return original_path;
  const p = String(original_path).replace(/^uploads\//, "");
  return `${API_BASE}/uploads/${p}`;
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); } catch (e) { errBody = { error: `Request failed (${res.status})` }; }
    throw new Error(errBody.error || errBody.message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listTemplates: (published) => request(`/templates?published=${published === "true"}`),
  getTemplate: (id) => request(`/templates/${id}`),
  createTemplate: (formData) => request("/templates", { method: "POST", body: formData }),
  updateTemplate: (id, body) => request(`/templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  publishTemplate: (id) => request(`/templates/${id}/publish`, { method: "POST" }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: "DELETE" }),
  savePhotoSession: (sessionId, photos) => request("/photos", { method: "POST", body: JSON.stringify({ sessionId, photos }) }),
  getPhotoSession: (sessionId) => request(`/photos/${sessionId}`),
  deletePhotoSession: (sessionId) => request(`/photos/${sessionId}`, { method: "DELETE" }),
  shareUpload: (imageDataUrl) => request("/share/upload", { method: "POST", body: JSON.stringify({ image: imageDataUrl }) }),
  getSharePhoto: (photoId) => request(`/share/${photoId}`),
  deleteSharePhoto: (photoId) => request(`/share/${photoId}`, { method: "DELETE" }),
};
