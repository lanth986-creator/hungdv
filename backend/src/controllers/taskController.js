import Task, { findPvnDashboard } from '../models/Task.js';

export const getTasks = async (req, res, next) => {
  try {
    const { search, nguon_nhiem_vu, trang_thai, muc_do_quan_trong, loai_xu_ly, page, limit } = req.query;
    const result = await Task.findAll({
      search,
      nguon_nhiem_vu,
      trang_thai,
      muc_do_quan_trong,
      loai_xu_ly,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const getTaskTree = async (req, res, next) => {
  try {
    const tree = await Task.findTree();
    res.json(tree);
  } catch (err) {
    next(err);
  }
};

export const getPetrovietnamTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findPetrovietnamTasks();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
      muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
      ngay_duoc_giao, thoi_han_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office,
      don_vi_chu_tri_ids, lanh_dao_pvep_ids } = req.body;

    // Required field validation
    if (!loai_xu_ly) {
      return res.status(400).json({ error: 'Thiếu loại xử lý' });
    }
    if (!noi_dung_nhiem_vu) {
      return res.status(400).json({ error: 'Thiếu nội dung nhiệm vụ' });
    }
    if (!nguon_nhiem_vu) {
      return res.status(400).json({ error: 'Thiếu nguồn nhiệm vụ' });
    }
    if (!ngay_duoc_giao) {
      return res.status(400).json({ error: 'Thiếu ngày được giao' });
    }
    if (!van_ban_goc_id) {
      return res.status(400).json({ error: 'Thiếu văn bản gốc' });
    }

    // Business rule validations
    if (loai_xu_ly === 'tao_phai_sinh') {
      if (!parent_id) {
        return res.status(400).json({ error: 'Tạo phái sinh bắt buộc phải chọn công việc cha' });
      }
      const parent = await Task.findById(parent_id);
      if (!parent) {
        return res.status(400).json({ error: 'Không tìm thấy công việc cha' });
      }
      if (parent.nguon_nhiem_vu !== 'Petrovietnam') {
        return res.status(400).json({ error: 'Công việc cha phải là nguồn Petrovietnam' });
      }
      if (nguon_nhiem_vu === 'Petrovietnam') {
        return res.status(400).json({ error: 'Công việc phái sinh không thể là nguồn Petrovietnam' });
      }
    }

    if (loai_xu_ly === 'nho_lai') {
      if (!cv_lien_ket_id) {
        return res.status(400).json({ error: 'Nhắc lại bắt buộc phải chọn công việc liên kết' });
      }
      const linked = await Task.findById(cv_lien_ket_id);
      if (!linked) {
        return res.status(400).json({ error: 'Không tìm thấy công việc liên kết' });
      }
    }

    const task = await Task.create({
      loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
      muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
      ngay_duoc_giao, thoi_han_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office,
      don_vi_chu_tri_ids, lanh_dao_pvep_ids,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
      muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
      ngay_duoc_giao, thoi_han_hoan_thanh, ngay_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office,
      don_vi_chu_tri_ids, lanh_dao_pvep_ids } = req.body;

    const existing = await Task.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }

    // Required field validation
    if (!loai_xu_ly) {
      return res.status(400).json({ error: 'Thiếu loại xử lý' });
    }
    if (!noi_dung_nhiem_vu) {
      return res.status(400).json({ error: 'Thiếu nội dung nhiệm vụ' });
    }
    if (!nguon_nhiem_vu) {
      return res.status(400).json({ error: 'Thiếu nguồn nhiệm vụ' });
    }
    if (!ngay_duoc_giao) {
      return res.status(400).json({ error: 'Thiếu ngày được giao' });
    }
    if (!van_ban_goc_id) {
      return res.status(400).json({ error: 'Thiếu văn bản gốc' });
    }

    // Business rule validations
    if (loai_xu_ly === 'tao_phai_sinh') {
      if (!parent_id) {
        return res.status(400).json({ error: 'Tạo phái sinh bắt buộc phải chọn công việc cha' });
      }
      const parent = await Task.findById(parent_id);
      if (!parent) {
        return res.status(400).json({ error: 'Không tìm thấy công việc cha' });
      }
      if (parent.nguon_nhiem_vu !== 'Petrovietnam') {
        return res.status(400).json({ error: 'Công việc cha phải là nguồn Petrovietnam' });
      }
    }

    if (loai_xu_ly === 'nho_lai') {
      if (!cv_lien_ket_id) {
        return res.status(400).json({ error: 'Nhắc lại bắt buộc phải chọn công việc liên kết' });
      }
    }

    const task = await Task.update(req.params.id, {
      loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
      muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
      ngay_duoc_giao, thoi_han_hoan_thanh, ngay_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office,
      don_vi_chu_tri_ids, lanh_dao_pvep_ids,
    });
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.delete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json({ message: 'Xóa công việc thành công', task });
  } catch (err) {
    next(err);
  }
};

export const getPvnMonthlyReport = async (req, res, next) => {
  try {
    const thang = parseInt(req.query.thang);
    const nam = parseInt(req.query.nam);
    if (!thang || !nam || thang < 1 || thang > 12) {
      return res.status(400).json({ error: 'Thiếu hoặc sai tháng/năm' });
    }
    const data = await Task.findPvnMonthlyReport({ thang, nam });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getPvnDashboard = async (req, res, next) => {
  try {
    const thang = parseInt(req.query.thang);
    const nam = parseInt(req.query.nam);
    if (!thang || !nam || thang < 1 || thang > 12) {
      return res.status(400).json({ error: 'Thiếu hoặc sai tháng/năm' });
    }
    const data = await findPvnDashboard({ thang, nam });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
