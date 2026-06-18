import api from './axios';

export const getTasks = (params) => api.get('/tasks', { params });
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const getTaskTree = () => api.get('/tasks/tree');
export const getPetrovietnamTasks = () => api.get('/tasks/petrovietnam');
export const getPvnMonthlyReport = (params) => api.get('/tasks/pvn-monthly-report', { params });
export const getPvnDashboard = (params) => api.get('/tasks/pvn-dashboard', { params });
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export const getTaskReports = (taskId) => api.get(`/tasks/${taskId}/reports`);
export const createTaskReport = (taskId, data) => api.post(`/tasks/${taskId}/reports`, data);
export const updateTaskReport = (taskId, reportId, data) => api.put(`/tasks/${taskId}/reports/${reportId}`, data);
export const deleteTaskReport = (taskId, reportId) => api.delete(`/tasks/${taskId}/reports/${reportId}`);

export const getTaskReminders = (taskId) => api.get(`/tasks/${taskId}/reminders`);
export const createTaskReminder = (taskId, data) => api.post(`/tasks/${taskId}/reminders`, data);
export const deleteTaskReminder = (taskId, reminderId) => api.delete(`/tasks/${taskId}/reminders/${reminderId}`);
