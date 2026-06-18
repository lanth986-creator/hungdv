-- Them danh muc cho HUNGDV
-- Chay: psql -U postgres -h localhost -d hungdv -f seed.sql

-- Xoa du lieu cu (neu muon reset)
-- TRUNCATE categories RESTART IDENTITY;

-- ===== 1. Lĩnh vực =====
INSERT INTO categories (name, description, color, sort_order) VALUES
('Lĩnh vực', 'Các lĩnh vực hoạt động', '#06b6d4', 1);

-- Lay id cua Lĩnh vực
DO $$
DECLARE
  lv_id INTEGER;
BEGIN
  SELECT id INTO lv_id FROM categories WHERE name = 'Lĩnh vực';

  INSERT INTO categories (name, color, parent_id, sort_order) VALUES
  ('Cơ chế chính sách', '#3b82f6', lv_id, 1),
  ('Mở rộng ngành nghề kinh doanh', '#3b82f6', lv_id, 2),
  ('Quản trị điều hành, đầu tư, tài chính', '#3b82f6', lv_id, 3),
  ('Tài chính', '#3b82f6', lv_id, 4),
  ('Vận hành khai thác, gia tăng sản lượng, an toàn mỏ', '#3b82f6', lv_id, 5),
  ('Nhiệm vụ khác', '#3b82f6', lv_id, 6),
  ('Lĩnh vực mới', '#3b82f6', lv_id, 7);
END $$;

-- ===== 2. Lãnh đạo PVEP chỉ đạo =====
INSERT INTO categories (name, description, color, sort_order) VALUES
('Lãnh đạo PVEP chỉ đạo', 'Các lãnh đạo chỉ đạo', '#8b5cf6', 2);

DO $$
DECLARE
  ld_id INTEGER;
BEGIN
  SELECT id INTO ld_id FROM categories WHERE name = 'Lãnh đạo PVEP chỉ đạo';

  INSERT INTO categories (name, color, parent_id, sort_order) VALUES
  ('Hoàng Xuân Dương', '#8b5cf6', ld_id, 1),
  ('Hoàng Ngọc Trung', '#8b5cf6', ld_id, 2),
  ('Đặng Ngọc Quý', '#8b5cf6', ld_id, 3),
  ('Vũ Minh Đức', '#8b5cf6', ld_id, 4),
  ('Ngô Khánh Xạ', '#8b5cf6', ld_id, 5),
  ('Nguyễn Thiện Bảo', '#8b5cf6', ld_id, 6);
END $$;

-- ===== 3. Ban, Đơn vị chủ trì thực hiện =====
INSERT INTO categories (name, description, color, sort_order) VALUES
('Ban, Đơn vị chủ trì thực hiện', 'Các ban và đơn vị thực hiện', '#ec4899', 3);

DO $$
DECLARE
  ban_id INTEGER;
BEGIN
  SELECT id INTO ban_id FROM categories WHERE name = 'Ban, Đơn vị chủ trì thực hiện';

  INSERT INTO categories (name, color, parent_id, sort_order) VALUES
  ('Tài chính đầu tư', '#ec4899', ban_id, 1),
  ('Thăm dò', '#ec4899', ban_id, 2),
  ('PVEP Sông Hồng', '#ec4899', ban_id, 3),
  ('Phát triển khai thác', '#ec4899', ban_id, 4),
  ('Chiến lược và Quản trị rủi ro', '#ec4899', ban_id, 5),
  ('PVEP - ITC', '#ec4899', ban_id, 6),
  ('Công nghệ mỏ', '#ec4899', ban_id, 7),
  ('Công nghệ - Chuyển đổi số', '#ec4899', ban_id, 8),
  ('Quản trị nguồn nhân lực', '#ec4899', ban_id, 9),
  ('Kế toán kiểm toán', '#ec4899', ban_id, 10),
  ('Quản lý dự án', '#ec4899', ban_id, 11),
  ('Văn phòng', '#ec4899', ban_id, 12),
  ('PVEP Nam Côn Sơn', '#ec4899', ban_id, 13),
  ('Kế toán & Kiểm toán', '#ec4899', ban_id, 14),
  ('PVEP Cửu Long', '#ec4899', ban_id, 15),
  ('PVEP - POC', '#ec4899', ban_id, 16),
  ('Hoàng Long – Hoàn Vũ JOCs', '#ec4899', ban_id, 17),
  ('Thăng Long - JOC', '#ec4899', ban_id, 18),
  ('PVEP - Khánh Mỹ', '#ec4899', ban_id, 19),
  ('PVEP – Algeria', '#ec4899', ban_id, 20),
  ('PVEP Hồ Chí Minh', '#ec4899', ban_id, 21);
END $$;
