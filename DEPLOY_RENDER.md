# Deploy lên Render.com

## Yêu cầu
- Tài khoản GitHub
- Tài khoản Render (miễn phí): https://dashboard.render.com/register

## Bước 1: Push code lên GitHub

```bash
cd D:\workspce\WORK02
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Bước 2: Tạo Render Blueprint

1. Đăng nhập Render: https://dashboard.render.com
2. Click **New +** → **Blueprint**
3. Chọn repository vừa push
4. Render sẽ tự đọc `render.yaml` và tạo:
   - **hungdv-backend** (Web Service)
   - **hungdv-frontend** (Static Site)
   - **hungdv-db** (PostgreSQL Database)

## Bước 3: Cấu hình Environment Variables

Vào **hungdv-backend** → **Environment** → thêm:

| Key | Value |
|-----|-------|
| `ADMIN_PASSWORD` | Mật khẩu admin (VD: `admin123`) |
| `CORS_ORIGIN` | URL frontend (VD: `https://hungdv-frontend.onrender.com`) |

## Bước 4: Deploy

- Render tự deploy khi push code
- Lần đầu deploy mất ~3-5 phút
- Link frontend: `https://hungdv-frontend.onrender.com`
- Link backend: `https://hungdv-backend.onrender.com`

## ⚠️ Lưu ý quan trọng

### File upload
Render dùng filesystem ephemeral. File upload sẽ mất khi deploy lại.
Nếu cần giữ file, cần tích hợp cloud storage (Cloudflare R2, S3...).

### Free tier
- Backend sleep sau 15 phút không có request
- First request sau sleep mất ~30 giây
- RAM: 512MB

### Local development
Giữ nguyên cách dùng `start.bat` và `start-production.bat` như cũ.
