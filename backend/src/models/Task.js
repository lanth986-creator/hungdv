import { query } from '../config/database.js';

const Task = {
  async findAll({ search, nguon_nhiem_vu, trang_thai, muc_do_quan_trong, loai_xu_ly, page = 1, limit = 10 } = {}) {
    let sql = `
      SELECT t.*,
        d.so_van_ban as van_ban_so,
        d.ngay as van_ban_ngay,
        d.nguon_van_ban as van_ban_nguon,
        d.trich_yeu as van_ban_trich_yeu,
        lv.name as linh_vuc_name,
        COALESCE(leader_names.names, ld.name) as lanh_dao_name,
        pt.noi_dung_nhiem_vu as parent_noi_dung,
        pt.nguon_nhiem_vu as parent_nguon,
        lk.noi_dung_nhiem_vu as cv_lien_ket_noi_dung
      FROM tasks t
      LEFT JOIN documents d ON t.van_ban_goc_id = d.id
      LEFT JOIN categories lv ON t.linh_vuc_id = lv.id
      LEFT JOIN categories ld ON t.lanh_dao_pvep_id = ld.id
      LEFT JOIN (
        SELECT tla.task_id, string_agg(c.name, ', ' ORDER BY c.name) as names
        FROM task_leader_assignments tla
        LEFT JOIN categories c ON tla.lanh_dao_id = c.id
        GROUP BY tla.task_id
      ) leader_names ON leader_names.task_id = t.id
      LEFT JOIN tasks pt ON t.parent_id = pt.id
      LEFT JOIN tasks lk ON t.cv_lien_ket_id = lk.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (t.noi_dung_nhiem_vu ILIKE $${paramIndex} OR d.so_van_ban ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (nguon_nhiem_vu) {
      sql += ` AND t.nguon_nhiem_vu = $${paramIndex}`;
      params.push(nguon_nhiem_vu);
      paramIndex++;
    }

    if (loai_xu_ly) {
      sql += ` AND t.loai_xu_ly = $${paramIndex}`;
      params.push(loai_xu_ly);
      paramIndex++;
    }

    if (muc_do_quan_trong) {
      sql += ` AND t.muc_do_quan_trong = $${paramIndex}`;
      params.push(muc_do_quan_trong);
      paramIndex++;
    }

    // For trang_thai filter, compute actual status
    if (trang_thai) {
      if (trang_thai === 'qua_han') {
        sql += ` AND (t.ngay_hoan_thanh IS NULL AND t.thoi_han_hoan_thanh < CURRENT_DATE)`;
      } else if (trang_thai === 'hoan_thanh') {
        sql += ` AND t.ngay_hoan_thanh IS NOT NULL`;
      } else if (trang_thai === 'dang_trien_khai') {
        sql += ` AND (t.ngay_hoan_thanh IS NULL AND (t.thoi_han_hoan_thanh IS NULL OR t.thoi_han_hoan_thanh >= CURRENT_DATE))`;
      }
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as count_query`, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY t.created_at DESC`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await query(sql, params);

    // Compute actual trang_thai for each row
    const data = result.rows.map(row => ({
      ...row,
      trang_thai: computeStatus(row),
    }));

    return { data, total, page, limit };
  },

  async findById(id) {
    const result = await query(
      `SELECT t.*,
        d.so_van_ban as van_ban_so,
        d.ngay as van_ban_ngay,
        d.nguon_van_ban as van_ban_nguon,
        d.trich_yeu as van_ban_trich_yeu,
        d.file_name as van_ban_file_name,
        d.file_path as van_ban_file_path,
        lv.name as linh_vuc_name,
        COALESCE(leader_names.names, ld.name) as lanh_dao_name,
        pt.noi_dung_nhiem_vu as parent_noi_dung,
        pt.nguon_nhiem_vu as parent_nguon,
        pt.loai_xu_ly as parent_loai_xu_ly,
        lk.noi_dung_nhiem_vu as cv_lien_ket_noi_dung,
        lk.nguon_nhiem_vu as cv_lien_ket_nguon
      FROM tasks t
      LEFT JOIN documents d ON t.van_ban_goc_id = d.id
      LEFT JOIN categories lv ON t.linh_vuc_id = lv.id
      LEFT JOIN categories ld ON t.lanh_dao_pvep_id = ld.id
      LEFT JOIN (
        SELECT tla.task_id, string_agg(c.name, ', ' ORDER BY c.name) as names
        FROM task_leader_assignments tla
        LEFT JOIN categories c ON tla.lanh_dao_id = c.id
        GROUP BY tla.task_id
      ) leader_names ON leader_names.task_id = t.id
      LEFT JOIN tasks pt ON t.parent_id = pt.id
      LEFT JOIN tasks lk ON t.cv_lien_ket_id = lk.id
      WHERE t.id = $1`,
      [id]
    );
    const task = result.rows[0];
    if (!task) return null;

    // Compute status
    task.trang_thai = computeStatus(task);

    // Get assigned units
    const unitsResult = await query(
      `SELECT tua.don_vi_id, c.name as don_vi_name
       FROM task_unit_assignments tua
       LEFT JOIN categories c ON tua.don_vi_id = c.id
       WHERE tua.task_id = $1`,
      [id]
    );
    task.don_vi_chu_tri = unitsResult.rows;

    const leadersResult = await query(
      `SELECT tla.lanh_dao_id, c.name as lanh_dao_name
       FROM task_leader_assignments tla
       LEFT JOIN categories c ON tla.lanh_dao_id = c.id
       WHERE tla.task_id = $1`,
      [id]
    );
    task.lanh_dao_pvep = leadersResult.rows;

    // Get child tasks
    const childrenResult = await query(
      `SELECT t.id, t.loai_xu_ly, t.noi_dung_nhiem_vu, t.trang_thai, t.nguon_nhiem_vu,
              t.muc_do_quan_trong, t.thoi_han_hoan_thanh, t.ngay_hoan_thanh
       FROM tasks t WHERE t.parent_id = $1 ORDER BY t.created_at ASC`,
      [id]
    );
    task.children = childrenResult.rows.map(c => ({ ...c, trang_thai: computeStatus(c) }));

    // Get reminders from task_reminders table
    const remindersResult = await query(
      `SELECT tr.*, d.so_van_ban as van_ban_so, d.nguon_van_ban as van_ban_nguon,
              d.trich_yeu as van_ban_trich_yeu
       FROM task_reminders tr
       LEFT JOIN documents d ON tr.van_ban_goc_id = d.id
       WHERE tr.task_id = $1
       ORDER BY tr.created_at DESC`,
      [id]
    );
    task.reminders = remindersResult.rows;

    // Get monthly reports
    const reportsResult = await query(
      `SELECT tr.*,
        d.so_van_ban as van_ban_hoan_thanh_so,
        d.nguon_van_ban as van_ban_hoan_thanh_nguon,
        d.trich_yeu as van_ban_hoan_thanh_trich_yeu
       FROM task_reports tr
       LEFT JOIN documents d ON tr.van_ban_hoan_thanh_id = d.id
       WHERE tr.task_id = $1
       ORDER BY tr.nam DESC, tr.thang DESC`,
      [id]
    );
    task.reports = reportsResult.rows;

    return task;
  },

  async create({ loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
    muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
    ngay_duoc_giao, thoi_han_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office,
    don_vi_chu_tri_ids, lanh_dao_pvep_ids }) {
    const result = await query(
      `INSERT INTO tasks (loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
         muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
         ngay_duoc_giao, thoi_han_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        loai_xu_ly,
        van_ban_goc_id || null,
        nguon_nhiem_vu,
        linh_vuc_id || null,
        noi_dung_nhiem_vu,
        muc_do_quan_trong || 'trung_binh',
        vai_tro_pvep || null,
        lanh_dao_pvep_id || null,
        parent_id || null,
        cv_lien_ket_id || null,
        ngay_duoc_giao,
        thoi_han_hoan_thanh || null,
        nhiem_vu_thuong_xuyen || false,
        link_1office || null,
      ]
    );
    const task = result.rows[0];

    const leaderIds = lanh_dao_pvep_ids || (lanh_dao_pvep_id ? [lanh_dao_pvep_id] : []);
    if (leaderIds.length > 0) {
      for (const lanhDaoId of leaderIds) {
        await query(
          `INSERT INTO task_leader_assignments (task_id, lanh_dao_id) VALUES ($1, $2)
           ON CONFLICT (task_id, lanh_dao_id) DO NOTHING`,
          [task.id, lanhDaoId]
        );
      }
    }

    // Insert unit assignments
    if (don_vi_chu_tri_ids && don_vi_chu_tri_ids.length > 0) {
      for (const donViId of don_vi_chu_tri_ids) {
        await query(
          `INSERT INTO task_unit_assignments (task_id, don_vi_id) VALUES ($1, $2)`,
          [task.id, donViId]
        );
      }
    }

    return task;
  },

  async update(id, { loai_xu_ly, van_ban_goc_id, nguon_nhiem_vu, linh_vuc_id, noi_dung_nhiem_vu,
    muc_do_quan_trong, vai_tro_pvep, lanh_dao_pvep_id, parent_id, cv_lien_ket_id,
    ngay_duoc_giao, thoi_han_hoan_thanh, ngay_hoan_thanh, nhiem_vu_thuong_xuyen, link_1office,
    don_vi_chu_tri_ids, lanh_dao_pvep_ids }) {
    const result = await query(
      `UPDATE tasks
       SET loai_xu_ly = $1, van_ban_goc_id = $2, nguon_nhiem_vu = $3, linh_vuc_id = $4,
           noi_dung_nhiem_vu = $5, muc_do_quan_trong = $6, vai_tro_pvep = $7,
           lanh_dao_pvep_id = $8, parent_id = $9, cv_lien_ket_id = $10,
           ngay_duoc_giao = $11, thoi_han_hoan_thanh = $12, ngay_hoan_thanh = $13,
           nhiem_vu_thuong_xuyen = $14, link_1office = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        loai_xu_ly,
        van_ban_goc_id || null,
        nguon_nhiem_vu,
        linh_vuc_id || null,
        noi_dung_nhiem_vu,
        muc_do_quan_trong || 'trung_binh',
        vai_tro_pvep || null,
        lanh_dao_pvep_id || null,
        parent_id || null,
        cv_lien_ket_id || null,
        ngay_duoc_giao,
        thoi_han_hoan_thanh || null,
        ngay_hoan_thanh || null,
        nhiem_vu_thuong_xuyen || false,
        link_1office || null,
        id,
      ]
    );
    const task = result.rows[0];
    if (!task) return null;

    if (lanh_dao_pvep_ids !== undefined) {
      await query('DELETE FROM task_leader_assignments WHERE task_id = $1', [id]);
      if (lanh_dao_pvep_ids && lanh_dao_pvep_ids.length > 0) {
        for (const lanhDaoId of lanh_dao_pvep_ids) {
          await query(
            `INSERT INTO task_leader_assignments (task_id, lanh_dao_id) VALUES ($1, $2)
             ON CONFLICT (task_id, lanh_dao_id) DO NOTHING`,
            [id, lanhDaoId]
          );
        }
      }
    }

    // Re-sync unit assignments
    if (don_vi_chu_tri_ids !== undefined) {
      await query('DELETE FROM task_unit_assignments WHERE task_id = $1', [id]);
      if (don_vi_chu_tri_ids && don_vi_chu_tri_ids.length > 0) {
        for (const donViId of don_vi_chu_tri_ids) {
          await query(
            `INSERT INTO task_unit_assignments (task_id, don_vi_id) VALUES ($1, $2)`,
            [id, donViId]
          );
        }
      }
    }

    return task;
  },

  async delete(id) {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },

  async markCompleted(id, ngay_hoan_thanh) {
    const result = await query(
      `UPDATE tasks
       SET ngay_hoan_thanh = $1, trang_thai = 'hoan_thanh', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [ngay_hoan_thanh, id]
    );
    return result.rows[0] || null;
  },

  async findTree() {
    const result = await query(
      `SELECT t.*,
        d.so_van_ban as van_ban_so,
        lv.name as linh_vuc_name,
        ld.name as lanh_dao_name
       FROM tasks t
       LEFT JOIN documents d ON t.van_ban_goc_id = d.id
       LEFT JOIN categories lv ON t.linh_vuc_id = lv.id
       LEFT JOIN categories ld ON t.lanh_dao_pvep_id = ld.id
       ORDER BY t.ngay_duoc_giao DESC, t.created_at DESC`
    );
    const tasks = result.rows.map(t => ({ ...t, trang_thai: computeStatus(t) }));
    return buildTree(tasks, null);
  },

  async findPetrovietnamTasks() {
    const result = await query(
      `SELECT t.id, t.noi_dung_nhiem_vu, t.nguon_nhiem_vu, t.loai_xu_ly, t.ngay_duoc_giao,
              t.linh_vuc_id, t.thoi_han_hoan_thanh, d.so_van_ban
       FROM tasks t
       LEFT JOIN documents d ON t.van_ban_goc_id = d.id
       WHERE t.nguon_nhiem_vu = 'Petrovietnam'
       ORDER BY t.ngay_duoc_giao DESC`
    );
    return result.rows;
  },

  async findPvnMonthlyReport({ thang, nam }) {
    // Get all PVN parent tasks (no parent_id) with their reports for the given period
    const parentResult = await query(
      `SELECT t.*,
        d.so_van_ban as van_ban_so,
        lv.name as linh_vuc_name,
        COALESCE(leader_names.names, ld.name) as lanh_dao_name,
        (
          SELECT string_agg(c.name, ', ' ORDER BY c.name)
          FROM task_unit_assignments tua
          LEFT JOIN categories c ON tua.don_vi_id = c.id
          WHERE tua.task_id = t.id
        ) as don_vi_chu_tri_names,
        tr.id as report_id,
        tr.tinh_hinh_thuc_hien,
        tr.hoan_thanh_trong_thang,
        tr.ngay_hoan_thanh as report_ngay_hoan_thanh,
        tr.van_ban_hoan_thanh_id,
        vbdone.so_van_ban as van_ban_hoan_thanh_so,
        vbdone.nguon_van_ban as van_ban_hoan_thanh_nguon,
        vbdone.trich_yeu as van_ban_hoan_thanh_trich_yeu,
        tr.ke_hoach_tiep_theo,
        tr.de_xuat_kien_nghi,
        tr.anh_huong_kh,
        tr.danh_gia_nguyen_nhan_cham
       FROM tasks t
       LEFT JOIN documents d ON t.van_ban_goc_id = d.id
       LEFT JOIN categories lv ON t.linh_vuc_id = lv.id
       LEFT JOIN categories ld ON t.lanh_dao_pvep_id = ld.id
       LEFT JOIN (
         SELECT tla.task_id, string_agg(c.name, ', ' ORDER BY c.name) as names
         FROM task_leader_assignments tla
         LEFT JOIN categories c ON tla.lanh_dao_id = c.id
         GROUP BY tla.task_id
       ) leader_names ON leader_names.task_id = t.id
       LEFT JOIN task_reports tr ON t.id = tr.task_id AND tr.thang = $1 AND tr.nam = $2
       LEFT JOIN documents vbdone ON tr.van_ban_hoan_thanh_id = vbdone.id
       WHERE t.nguon_nhiem_vu = 'Petrovietnam' AND (t.parent_id IS NULL)
       ORDER BY t.ngay_duoc_giao ASC, t.created_at ASC`,
      [thang, nam]
    );

    const parents = parentResult.rows.map(r => ({
      ...r,
      trang_thai: computeStatus(r),
    }));

    // Get all child tasks for these parent tasks
    const parentIds = parents.map(p => p.id);
    if (parentIds.length === 0) return [];

    const childResult = await query(
      `SELECT t.*,
        d.so_van_ban as van_ban_so,
        lv.name as linh_vuc_name,
        COALESCE(leader_names.names, ld.name) as lanh_dao_name,
        (
          SELECT string_agg(c.name, ', ' ORDER BY c.name)
          FROM task_unit_assignments tua
          LEFT JOIN categories c ON tua.don_vi_id = c.id
          WHERE tua.task_id = t.id
        ) as don_vi_chu_tri_names,
        tr.id as report_id,
        tr.tinh_hinh_thuc_hien,
        tr.hoan_thanh_trong_thang,
        tr.ngay_hoan_thanh as report_ngay_hoan_thanh,
        tr.van_ban_hoan_thanh_id,
        vbdone.so_van_ban as van_ban_hoan_thanh_so,
        vbdone.nguon_van_ban as van_ban_hoan_thanh_nguon,
        vbdone.trich_yeu as van_ban_hoan_thanh_trich_yeu,
        tr.ke_hoach_tiep_theo,
        tr.de_xuat_kien_nghi,
        tr.anh_huong_kh,
        tr.danh_gia_nguyen_nhan_cham
       FROM tasks t
       LEFT JOIN documents d ON t.van_ban_goc_id = d.id
       LEFT JOIN categories lv ON t.linh_vuc_id = lv.id
       LEFT JOIN categories ld ON t.lanh_dao_pvep_id = ld.id
       LEFT JOIN (
         SELECT tla.task_id, string_agg(c.name, ', ' ORDER BY c.name) as names
         FROM task_leader_assignments tla
         LEFT JOIN categories c ON tla.lanh_dao_id = c.id
         GROUP BY tla.task_id
       ) leader_names ON leader_names.task_id = t.id
       LEFT JOIN task_reports tr ON t.id = tr.task_id AND tr.thang = $1 AND tr.nam = $2
       LEFT JOIN documents vbdone ON tr.van_ban_hoan_thanh_id = vbdone.id
       WHERE t.parent_id = ANY($3)
       ORDER BY t.parent_id, t.created_at ASC`,
      [thang, nam, parentIds]
    );

    const children = childResult.rows.map(r => ({
      ...r,
      trang_thai: computeStatus(r),
    }));

    // Group children under parents
    const childMap = {};
    for (const child of children) {
      if (!childMap[child.parent_id]) childMap[child.parent_id] = [];
      childMap[child.parent_id].push(child);
    }

    return parents.map(p => ({
      ...p,
      children: childMap[p.id] || [],
    }));
  },
};

function computeStatus(row) {
  if (row.ngay_hoan_thanh || row.report_ngay_hoan_thanh) return 'hoan_thanh';
  if (row.thoi_han_hoan_thanh) {
    const deadline = new Date(row.thoi_han_hoan_thanh);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) return 'qua_han';
  }
  return 'dang_trien_khai';
}

function buildTree(tasks, parentId) {
  return tasks
    .filter(t => t.parent_id === parentId)
    .map(t => ({
      ...t,
      children: buildTree(tasks, t.id),
    }));
}

async function findPvnDashboard({ thang, nam }) {
  // 1. Get all PVN tasks (parents + children) with reports for the period
  const taskResult = await query(
    `SELECT t.*,
      d.so_van_ban as van_ban_so,
      lv.name as linh_vuc_name,
      COALESCE(leader_names.names, ld.name) as lanh_dao_name,
      (
        SELECT string_agg(c.name, ', ' ORDER BY c.name)
        FROM task_unit_assignments tua
        LEFT JOIN categories c ON tua.don_vi_id = c.id
        WHERE tua.task_id = t.id
      ) as don_vi_names,
      tr.id as report_id,
      tr.tinh_hinh_thuc_hien,
      tr.hoan_thanh_trong_thang,
      tr.ngay_hoan_thanh as report_ngay_hoan_thanh,
      tr.ke_hoach_tiep_theo,
      tr.anh_huong_kh,
      tr.danh_gia_nguyen_nhan_cham
     FROM tasks t
     LEFT JOIN documents d ON t.van_ban_goc_id = d.id
     LEFT JOIN categories lv ON t.linh_vuc_id = lv.id
     LEFT JOIN categories ld ON t.lanh_dao_pvep_id = ld.id
     LEFT JOIN (
       SELECT tla.task_id, string_agg(c.name, ', ' ORDER BY c.name) as names
       FROM task_leader_assignments tla
       LEFT JOIN categories c ON tla.lanh_dao_id = c.id
       GROUP BY tla.task_id
     ) leader_names ON leader_names.task_id = t.id
     LEFT JOIN task_reports tr ON t.id = tr.task_id AND tr.thang = $1 AND tr.nam = $2
     WHERE t.nguon_nhiem_vu = 'Petrovietnam'
     ORDER BY t.parent_id NULLS FIRST, t.created_at ASC`,
    [thang, nam]
  );

  // 2. Get unit assignments for all these tasks
  const taskIds = taskResult.rows.map(t => t.id)
  let unitMap = {}
  if (taskIds.length > 0) {
    const unitResult = await query(
      `SELECT tua.task_id, c.name as don_vi_name
       FROM task_unit_assignments tua
       LEFT JOIN categories c ON tua.don_vi_id = c.id
       WHERE tua.task_id = ANY($1)`,
      [taskIds]
    )
    for (const row of unitResult.rows) {
      if (!unitMap[row.task_id]) unitMap[row.task_id] = []
      unitMap[row.task_id].push(row.don_vi_name)
    }
  }

  // 3. Compute status and classify tasks
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentMonth = thang
  const currentYear = nam
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

  const allTasks = taskResult.rows.map(t => {
    const status = computeStatus(t)
    const deadline = t.thoi_han_hoan_thanh ? new Date(t.thoi_han_hoan_thanh) : null
    const deadlineMonth = deadline ? deadline.getMonth() + 1 : null
    const deadlineYear = deadline ? deadline.getFullYear() : null
    const report = t.tinh_hinh_thuc_hien ? true : false
    const anhHuong = t.anh_huong_kh === 'co'

    return {
      ...t,
      trang_thai: status,
      don_vi_names: unitMap[t.id] || (t.don_vi_names ? t.don_vi_names.split(', ') : []),
      deadline_month: deadlineMonth,
      deadline_year: deadlineYear,
      has_report: report,
      anh_huong_kh: anhHuong,
      is_parent: !t.parent_id,
    }
  })

  // 4. Compute KPIs
  const parents = allTasks.filter(t => t.is_parent)
  const children = allTasks.filter(t => !t.is_parent)

  const denHanKyNay = allTasks.filter(t =>
    t.deadline_month === currentMonth && t.deadline_year === currentYear && t.trang_thai !== 'hoan_thanh'
  ).length

  const denHanKySau = allTasks.filter(t =>
    t.deadline_month === nextMonth && t.deadline_year === nextYear && t.trang_thai !== 'hoan_thanh'
  ).length

  const hoanThanhTrongThang = allTasks.filter(t =>
    t.hoan_thanh_trong_thang === true
  ).length

  const dangTrienKhai = allTasks.filter(t =>
    t.trang_thai === 'dang_trien_khai'
  ).length

  const quaHan = allTasks.filter(t =>
    t.trang_thai === 'qua_han'
  ).length

  const anhHuongKH = allTasks.filter(t =>
    t.anh_huong_kh === true
  ).length

  const coBaoCao = allTasks.filter(t => t.has_report).length

  // 5. Breakdown by leader (split comma-separated names, count each leader individually)
  const byLeader = {}
  allTasks.forEach(t => {
    const leaderStr = t.lanh_dao_name || 'Chưa phân công'
    const leaders = leaderStr.split(', ').map(s => s.trim()).filter(Boolean)
    leaders.forEach(leader => {
      if (!byLeader[leader]) {
        byLeader[leader] = { name: leader, total: 0, cha: 0, con: 0, dang_tri: 0, qua_han: 0, hoan_thanh: 0, den_han_nay: 0, den_han_sau: 0, co_bao_cao: 0 }
      }
      const g = byLeader[leader]
      g.total++
      if (t.is_parent) g.cha++
      else g.con++
      if (t.trang_thai === 'dang_trien_khai') g.dang_tri++
      if (t.trang_thai === 'qua_han') g.qua_han++
      if (t.trang_thai === 'hoan_thanh') g.hoan_thanh++
      if (t.deadline_month === currentMonth && t.deadline_year === currentYear && t.trang_thai !== 'hoan_thanh') g.den_han_nay++
      if (t.deadline_month === nextMonth && t.deadline_year === nextYear && t.trang_thai !== 'hoan_thanh') g.den_han_sau++
      if (t.has_report) g.co_bao_cao++
    })
  })

  // 6. Breakdown by unit
  const byUnit = {}
  allTasks.forEach(t => {
    const units = t.don_vi_names.length > 0 ? t.don_vi_names : ['Chưa phân công']
    units.forEach(unit => {
      if (!byUnit[unit]) {
        byUnit[unit] = { name: unit, total: 0, cha: 0, con: 0, dang_tri: 0, qua_han: 0, hoan_thanh: 0, den_han_nay: 0, den_han_sau: 0, co_bao_cao: 0 }
      }
      const g = byUnit[unit]
      g.total++
      if (t.is_parent) g.cha++
      else g.con++
      if (t.trang_thai === 'dang_trien_khai') g.dang_tri++
      if (t.trang_thai === 'qua_han') g.qua_han++
      if (t.trang_thai === 'hoan_thanh') g.hoan_thanh++
      if (t.deadline_month === currentMonth && t.deadline_year === currentYear && t.trang_thai !== 'hoan_thanh') g.den_han_nay++
      if (t.deadline_month === nextMonth && t.deadline_year === nextYear && t.trang_thai !== 'hoan_thanh') g.den_han_sau++
      if (t.has_report) g.co_bao_cao++
    })
  })

  // 7. Breakdown by field
  const byField = {}
  allTasks.forEach(t => {
    const field = t.linh_vuc_name || 'Chưa phân loại'
    if (!byField[field]) {
      byField[field] = { name: field, total: 0, dang_tri: 0, qua_han: 0, hoan_thanh: 0 }
    }
    const g = byField[field]
    g.total++
    if (t.trang_thai === 'dang_trien_khai') g.dang_tri++
    if (t.trang_thai === 'qua_han') g.qua_han++
    if (t.trang_thai === 'hoan_thanh') g.hoan_thanh++
  })

  // 8. Breakdown by importance
  const byMucDo = {}
  allTasks.forEach(t => {
    const md = t.muc_do_quan_trong || 'chua_phan_loai'
    if (!byMucDo[md]) {
      byMucDo[md] = { name: md, total: 0, dang_tri: 0, qua_han: 0, hoan_thanh: 0 }
    }
    const g = byMucDo[md]
    g.total++
    if (t.trang_thai === 'dang_trien_khai') g.dang_tri++
    if (t.trang_thai === 'qua_han') g.qua_han++
    if (t.trang_thai === 'hoan_thanh') g.hoan_thanh++
  })

  return {
    kpi: {
      totalParents: parents.length,
      totalChildren: children.length,
      totalAll: allTasks.length,
      denHanKyNay,
      denHanKySau,
      hoanThanhTrongThang,
      dangTrienKhai: dangTrienKhai,
      quaHan,
      anhHuongKH,
      coBaoCao,
    },
    byLeader: Object.values(byLeader).sort((a, b) => b.total - a.total),
    byUnit: Object.values(byUnit).sort((a, b) => b.total - a.total),
    byField: Object.values(byField).sort((a, b) => b.total - a.total),
    byMucDo: Object.values(byMucDo),
  }
}

export { findPvnDashboard }
export default Task;
