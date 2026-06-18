import { query } from '../config/database.js';

const Document = {
  async findAll({ search, nguon_van_ban, page = 1, limit = 10 } = {}) {
    let sql = `SELECT * FROM documents WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (so_van_ban ILIKE $${paramIndex} OR trich_yeu ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (nguon_van_ban) {
      sql += ` AND nguon_van_ban = $${paramIndex}`;
      params.push(nguon_van_ban);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as count_query`, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY ngay DESC, created_at DESC`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await query(sql, params);
    return { data: result.rows, total, page, limit };
  },

  async findById(id) {
    const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ so_van_ban, ngay, nguon_van_ban, trich_yeu, file_name, file_path, file_size, ghi_chu }) {
    const result = await query(
      `INSERT INTO documents (so_van_ban, ngay, nguon_van_ban, trich_yeu, file_name, file_path, file_size, ghi_chu)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [so_van_ban, ngay, nguon_van_ban, trich_yeu, file_name || null, file_path || null, file_size || null, ghi_chu || null]
    );
    return result.rows[0];
  },

  async update(id, { so_van_ban, ngay, nguon_van_ban, trich_yeu, file_name, file_path, file_size, ghi_chu }) {
    const result = await query(
      `UPDATE documents
       SET so_van_ban = $1, ngay = $2, nguon_van_ban = $3, trich_yeu = $4,
           file_name = $5, file_path = $6, file_size = $7, ghi_chu = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [so_van_ban, ngay, nguon_van_ban, trich_yeu, file_name || null, file_path || null, file_size || null, ghi_chu || null, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};

export default Document;
