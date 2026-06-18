import Document from '../models/Document.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getDocuments = async (req, res, next) => {
  try {
    const { search, nguon_van_ban, page, limit } = req.query;
    const result = await Document.findAll({
      search,
      nguon_van_ban,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Không tìm thấy văn bản' });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const { so_van_ban, ngay, nguon_van_ban, trich_yeu, ghi_chu } = req.body;
    if (!so_van_ban || !ngay || !nguon_van_ban || !trich_yeu) {
      return res.status(400).json({ error: 'Thiếu trường bắt buộc: số văn bản, ngày, nguồn văn bản, trích yếu' });
    }

    const fileData = {};
    if (req.file) {
      fileData.file_name = req.file.originalname;
      fileData.file_path = `/uploads/documents/${req.file.filename}`;
      fileData.file_size = req.file.size;
    }

    const doc = await Document.create({
      so_van_ban,
      ngay,
      nguon_van_ban,
      trich_yeu,
      ghi_chu,
      ...fileData,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const { so_van_ban, ngay, nguon_van_ban, trich_yeu, ghi_chu } = req.body;
    if (!so_van_ban || !ngay || !nguon_van_ban || !trich_yeu) {
      return res.status(400).json({ error: 'Thiếu trường bắt buộc: số văn bản, ngày, nguồn văn bản, trích yếu' });
    }

    const existing = await Document.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy văn bản' });
    }

    const fileData = {};
    if (req.file) {
      // Delete old file
      if (existing.file_path) {
        try {
          const oldPath = join(__dirname, '..', '..', existing.file_path);
          unlinkSync(oldPath);
        } catch (e) { /* file already deleted */ }
      }
      fileData.file_name = req.file.originalname;
      fileData.file_path = `/uploads/documents/${req.file.filename}`;
      fileData.file_size = req.file.size;
    }

    const doc = await Document.update(req.params.id, {
      so_van_ban,
      ngay,
      nguon_van_ban,
      trich_yeu,
      ghi_chu,
      file_name: fileData.file_name !== undefined ? fileData.file_name : existing.file_name,
      file_path: fileData.file_path !== undefined ? fileData.file_path : existing.file_path,
      file_size: fileData.file_size !== undefined ? fileData.file_size : existing.file_size,
    });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.delete(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Không tìm thấy văn bản' });
    }
    // Delete file from disk
    if (doc.file_path) {
      try {
        const filePath = join(__dirname, '..', '..', doc.file_path);
        unlinkSync(filePath);
      } catch (e) { /* file already deleted */ }
    }
    res.json({ message: 'Xóa văn bản thành công', document: doc });
  } catch (err) {
    next(err);
  }
};

export const getDocumentSources = async (req, res) => {
  res.json(['Petrovietnam', 'HĐTV PVEP', 'TGĐ PVEP', 'Đảng ủy PVEP']);
};
