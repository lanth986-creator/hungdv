CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#06b6d4',
  icon VARCHAR(50) DEFAULT 'folder',
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ===== Documents table =====
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  so_van_ban VARCHAR(100) NOT NULL,
  ngay DATE NOT NULL,
  nguon_van_ban VARCHAR(100) NOT NULL,
  trich_yeu TEXT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,
  ghi_chu TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_so_van_ban ON documents(so_van_ban);
CREATE INDEX IF NOT EXISTS idx_documents_ngay ON documents(ngay);
CREATE INDEX IF NOT EXISTS idx_documents_nguon_van_ban ON documents(nguon_van_ban);

-- ===== Tasks table =====
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  loai_xu_ly VARCHAR(50) NOT NULL CHECK (loai_xu_ly IN ('tao_moi', 'tao_phai_sinh', 'nho_lai', 'theo_doi')),
  van_ban_goc_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  nguon_nhiem_vu VARCHAR(100) NOT NULL,
  linh_vuc_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  noi_dung_nhiem_vu TEXT NOT NULL,
  trang_thai VARCHAR(50) DEFAULT 'dang_trien_khai',
  muc_do_quan_trong VARCHAR(20) DEFAULT 'trung_binh',
  vai_tro_pvep VARCHAR(50),
  lanh_dao_pvep_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  cv_lien_ket_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  ngay_duoc_giao DATE NOT NULL,
  thoi_han_hoan_thanh DATE,
  ngay_hoan_thanh DATE,
  nhiem_vu_thuong_xuyen BOOLEAN DEFAULT false,
  link_1office VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_cv_lien_ket_id ON tasks(cv_lien_ket_id);
CREATE INDEX IF NOT EXISTS idx_tasks_van_ban_goc_id ON tasks(van_ban_goc_id);
CREATE INDEX IF NOT EXISTS idx_tasks_nguon_nhiem_vu ON tasks(nguon_nhiem_vu);
CREATE INDEX IF NOT EXISTS idx_tasks_trang_thai ON tasks(trang_thai);
CREATE INDEX IF NOT EXISTS idx_tasks_ngay_duoc_giao ON tasks(ngay_duoc_giao);

-- ===== Task-Leader assignments (many-to-many) =====
CREATE TABLE IF NOT EXISTS task_leader_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  lanh_dao_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(task_id, lanh_dao_id)
);

CREATE INDEX IF NOT EXISTS idx_task_leader_assignments_task_id ON task_leader_assignments(task_id);

-- ===== Task-Unit assignments (many-to-many) =====
CREATE TABLE IF NOT EXISTS task_unit_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  don_vi_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(task_id, don_vi_id)
);

-- ===== Task Monthly Reports =====
CREATE TABLE IF NOT EXISTS task_reports (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  thang INTEGER NOT NULL CHECK (thang >= 1 AND thang <= 12),
  nam INTEGER NOT NULL,
  tinh_hinh_thuc_hien TEXT NOT NULL,
  hoan_thanh_trong_thang BOOLEAN DEFAULT false,
  ngay_hoan_thanh DATE,
  van_ban_hoan_thanh_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  ke_hoach_tiep_theo TEXT,
  de_xuat_kien_nghi TEXT,
  anh_huong_kh VARCHAR(10) DEFAULT 'khong',
  danh_gia_nguyen_nhan_cham TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, thang, nam)
);

CREATE INDEX IF NOT EXISTS idx_task_reports_task_id ON task_reports(task_id);
ALTER TABLE task_reports ADD COLUMN IF NOT EXISTS van_ban_hoan_thanh_id INTEGER REFERENCES documents(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS task_reminders (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  van_ban_goc_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  noi_dung_nho_lai TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id ON task_reminders(task_id);

-- ===== Application users and sessions =====
CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
