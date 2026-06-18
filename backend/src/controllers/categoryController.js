import Category from '../models/Category.js';

export const getCategories = async (req, res, next) => {
  try {
    const { search, parent_id, is_active, page, limit } = req.query;
    const result = await Category.findAll({
      search,
      parent_id,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon, parent_id, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = await Category.create({
      name: name.trim(),
      description,
      color,
      icon,
      parent_id: parent_id || null,
      sort_order: sort_order ? parseInt(sort_order) : 0,
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon, parent_id, sort_order, is_active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Prevent setting parent to self
    if (parent_id && parseInt(parent_id) === parseInt(req.params.id)) {
      return res.status(400).json({ error: 'Category cannot be its own parent' });
    }

    const category = await Category.update(req.params.id, {
      name: name.trim(),
      description,
      color,
      icon,
      parent_id: parent_id || null,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
      is_active: is_active !== undefined ? is_active : true,
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.delete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully', category });
  } catch (err) {
    if (err.message.includes('Cannot delete')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const getCategoryTree = async (req, res, next) => {
  try {
    const tree = await Category.findTree();
    res.json(tree);
  } catch (err) {
    next(err);
  }
};
