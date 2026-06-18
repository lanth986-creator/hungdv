import api from './axios';

export const getDocuments = (params) => api.get('/documents', { params });
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const createDocument = (formData) => api.post('/documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateDocument = (id, formData) => api.put(`/documents/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const getDocumentSources = () => api.get('/documents/sources');
