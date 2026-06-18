import { query } from '../config/database.js';

const TaskReminder = {
  async findByTaskId(taskId) {
    const result = await query(
      `SELECT tr.*, d.so_van_ban as van_ban_so, d.nguon_van_ban as van_ban_nguon,
              d.trich_yeu as van_ban_trich_yeu
       FROM task_reminders tr
       LEFT JOIN documents d ON tr.van_ban_goc_id = d.id
       WHERE tr.task_id = $1
       ORDER BY tr.created_at DESC`,
      [taskId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query('SELECT * FROM task_reminders WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(taskId, { van_ban_goc_id, noi_dung_nho_lai }) {
    const result = await query(
      `INSERT INTO task_reminders (task_id, van_ban_goc_id, noi_dung_nho_lai)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, van_ban_goc_id || null, noi_dung_nho_lai]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM task_reminders WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};

export default TaskReminder;
