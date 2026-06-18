import { query } from '../config/database.js';

const Category = {
  async findAll({ search, parent_id, is_active, page = 1, limit = 50 } = {}) {
    let sql = `
      SELECT c.*, 
        p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (parent_id !== undefined) {
      sql += ` AND c.parent_id = $${paramIndex}`;
      params.push(parent_id === 'null' ? null : parent_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      sql += ` AND c.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    // Count total
    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as count_query`, params);
    const total = parseInt(countResult.rows[0].count);

    // Paginate
    sql += ` ORDER BY c.sort_order ASC, c.name ASC`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await query(sql, params);
    return { data: result.rows, total, page, limit };
  },

  async findById(id) {
    const result = await query(
      `SELECT c.*, p.name as parent_name 
       FROM categories c 
       LEFT JOIN categories p ON c.parent_id = p.id 
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ name, description, color, icon, parent_id, sort_order }) {
    const result = await query(
      `INSERT INTO categories (name, description, color, icon, parent_id, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description || null, color || '#06b6d4', icon || 'folder', parent_id || null, sort_order || 0]
    );
    return result.rows[0];
  },

  async update(id, { name, description, color, icon, parent_id, sort_order, is_active }) {
    const result = await query(
      `UPDATE categories 
       SET name = $1, description = $2, color = $3, icon = $4, 
           parent_id = $5, sort_order = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, description, color, icon, parent_id, sort_order, is_active, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    // Check if has children
    const children = await query('SELECT COUNT(*) FROM categories WHERE parent_id = $1', [id]);
    if (parseInt(children.rows[0].count) > 0) {
      throw new Error('Cannot delete category with children. Remove children first.');
    }
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },

  async findTree() {
    const result = await query(
      `SELECT * FROM categories ORDER BY sort_order ASC, name ASC`
    );
    const categories = result.rows;
    return buildTree(categories, null);
  }
};

function buildTree(categories, parentId) {
  return categories
    .filter(c => c.parent_id === parentId)
    .map(c => ({
      ...c,
      children: buildTree(categories, c.id)
    }));
}

export default Category;
