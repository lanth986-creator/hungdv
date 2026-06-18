import TaskReminder from '../models/TaskReminder.js';
import Task from '../models/Task.js';

export const getTaskReminders = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    const reminders = await TaskReminder.findByTaskId(req.params.taskId);
    res.json(reminders);
  } catch (err) {
    next(err);
  }
};

export const createTaskReminder = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }

    const { noi_dung_nho_lai } = req.body;
    if (!noi_dung_nho_lai) {
      return res.status(400).json({ error: 'Thiếu nội dung nhắc lại' });
    }

    const reminder = await TaskReminder.create(taskId, req.body);
    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
};

export const deleteTaskReminder = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;
    const existing = await TaskReminder.findById(id);
    if (!existing || existing.task_id !== parseInt(taskId)) {
      return res.status(404).json({ error: 'Không tìm thấy lưu ý' });
    }

    const reminder = await TaskReminder.delete(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Không tìm thấy lưu ý' });
    }
    res.json({ message: 'Xóa lưu ý thành công', reminder });
  } catch (err) {
    next(err);
  }
};
