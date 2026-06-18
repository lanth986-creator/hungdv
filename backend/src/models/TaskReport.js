import { query } from '../config/database.js';

const TaskReport = {
  async findByTaskId(taskId) {
    const result = await query(
      `SELECT tr.*,
        d.so_van_ban as van_ban_hoan_thanh_so,
        d.nguon_van_ban as van_ban_hoan_thanh_nguon,
        d.trich_yeu as van_ban_hoan_thanh_trich_yeu
       FROM task_reports tr
       LEFT JOIN documents d ON tr.van_ban_hoan_thanh_id = d.id
       WHERE tr.task_id = $1
       ORDER BY tr.nam DESC, tr.thang DESC`,
      [taskId]
    );
    return result.rows;
  },

  async findByTaskAndPeriod(taskId, thang, nam) {
    const result = await query(
      `SELECT * FROM task_reports WHERE task_id = $1 AND thang = $2 AND nam = $3`,
      [taskId, thang, nam]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query('SELECT * FROM task_reports WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(taskId, { thang, nam, tinh_hinh_thuc_hien, hoan_thanh_trong_thang,
    ngay_hoan_thanh, van_ban_hoan_thanh_id, ke_hoach_tiep_theo, de_xuat_kien_nghi, anh_huong_kh,
    danh_gia_nguyen_nhan_cham }) {
    const result = await query(
      `INSERT INTO task_reports (task_id, thang, nam, tinh_hinh_thuc_hien, hoan_thanh_trong_thang,
         ngay_hoan_thanh, van_ban_hoan_thanh_id, ke_hoach_tiep_theo, de_xuat_kien_nghi, anh_huong_kh,
         danh_gia_nguyen_nhan_cham)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        taskId, thang, nam, tinh_hinh_thuc_hien,
        hoan_thanh_trong_thang || false,
        ngay_hoan_thanh || null,
        van_ban_hoan_thanh_id || null,
        ke_hoach_tiep_theo || null,
        de_xuat_kien_nghi || null,
        anh_huong_kh || 'khong',
        danh_gia_nguyen_nhan_cham || null,
      ]
    );
    return result.rows[0];
  },

  async update(id, { thang, nam, tinh_hinh_thuc_hien, hoan_thanh_trong_thang,
    ngay_hoan_thanh, van_ban_hoan_thanh_id, ke_hoach_tiep_theo, de_xuat_kien_nghi, anh_huong_kh,
    danh_gia_nguyen_nhan_cham }) {
    const result = await query(
      `UPDATE task_reports
       SET thang = $1, nam = $2, tinh_hinh_thuc_hien = $3, hoan_thanh_trong_thang = $4,
           ngay_hoan_thanh = $5, van_ban_hoan_thanh_id = $6, ke_hoach_tiep_theo = $7, de_xuat_kien_nghi = $8,
           anh_huong_kh = $9, danh_gia_nguyen_nhan_cham = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        thang, nam, tinh_hinh_thuc_hien,
        hoan_thanh_trong_thang || false,
        ngay_hoan_thanh || null,
        van_ban_hoan_thanh_id || null,
        ke_hoach_tiep_theo || null,
        de_xuat_kien_nghi || null,
        anh_huong_kh || 'khong',
        danh_gia_nguyen_nhan_cham || null,
        id,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM task_reports WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};

export default TaskReport;
