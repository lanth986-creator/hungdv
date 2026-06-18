import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('hungdv:unauthorized'));
    }

    const message = error.response?.data?.error || error.message || 'Loi ket noi';
    return Promise.reject(new Error(message));
  },
);

export default api;
