import TaskReport from '../models/TaskReport.js';
import Task from '../models/Task.js';

export const getTaskReports = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    const reports = await TaskReport.findByTaskId(req.params.taskId);
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const createTaskReport = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }

    const { thang, nam, tinh_hinh_thuc_hien } = req.body;
    if (!thang || !nam) {
      return res.status(400).json({ error: 'Thiếu tháng hoặc năm' });
    }
    if (!tinh_hinh_thuc_hien) {
      return res.status(400).json({ error: 'Thiếu tình hình thực hiện' });
    }

    // Check if report already exists for this period
    const existing = await TaskReport.findByTaskAndPeriod(taskId, thang, nam);
    if (existing) {
      return res.status(400).json({ error: `Báo cáo tháng ${thang}/${nam} đã tồn tại` });
    }

    const report = await TaskReport.create(taskId, req.body);
    if (report.hoan_thanh_trong_thang && report.ngay_hoan_thanh) {
      await Task.markCompleted(taskId, report.ngay_hoan_thanh);
    }
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

export const updateTaskReport = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;
    const existing = await TaskReport.findById(id);
    if (!existing || existing.task_id !== parseInt(taskId)) {
      return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
    }

    const { tinh_hinh_thuc_hien } = req.body;
    if (!tinh_hinh_thuc_hien) {
      return res.status(400).json({ error: 'Thiếu tình hình thực hiện' });
    }

    const report = await TaskReport.update(id, req.body);
    if (!report) {
      return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
    }
    if (report.hoan_thanh_trong_thang && report.ngay_hoan_thanh) {
      await Task.markCompleted(taskId, report.ngay_hoan_thanh);
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const deleteTaskReport = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;
    const existing = await TaskReport.findById(id);
    if (!existing || existing.task_id !== parseInt(taskId)) {
      return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
    }

    const report = await TaskReport.delete(id);
    if (!report) {
      return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
    }
    res.json({ message: 'Xóa báo cáo thành công', report });
  } catch (err) {
    next(err);
  }
};
