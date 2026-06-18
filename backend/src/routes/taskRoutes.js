import { Router } from 'express';
import {
  getTasks, getTaskById, createTask, updateTask, deleteTask,
  getTaskTree, getPetrovietnamTasks, getPvnMonthlyReport, getPvnDashboard,
} from '../controllers/taskController.js';
import {
  getTaskReports, createTaskReport, updateTaskReport, deleteTaskReport,
} from '../controllers/taskReportController.js';
import {
  getTaskReminders, createTaskReminder, deleteTaskReminder,
} from '../controllers/taskReminderController.js';

const router = Router();

// Task routes
router.get('/tree', getTaskTree);
router.get('/petrovietnam', getPetrovietnamTasks);
router.get('/pvn-monthly-report', getPvnMonthlyReport);
router.get('/pvn-dashboard', getPvnDashboard);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Nested report routes
router.get('/:taskId/reports', getTaskReports);
router.post('/:taskId/reports', createTaskReport);
router.put('/:taskId/reports/:id', updateTaskReport);
router.delete('/:taskId/reports/:id', deleteTaskReport);

// Nested reminder routes
router.get('/:taskId/reminders', getTaskReminders);
router.post('/:taskId/reminders', createTaskReminder);
router.delete('/:taskId/reminders/:id', deleteTaskReminder);

export default router;
