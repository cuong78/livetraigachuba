---
name: setup-livestream-brand
description: >-
  Tự động hóa toàn bộ quy trình thiết lập thương hiệu, tên miền, thông tin liên hệ, ngân hàng,
  SEO metadata và triển khai hệ thống livestream cho một trại gà mới. Kích hoạt khi người dùng
  muốn clone/setup repo này cho một khách hàng hoặc trại gà mới (ví dụ: "setup cho trại gà mới",
  "đổi sang trại khác", "cấu hình cho khách hàng mới").
---

# Skill: Setup Livestream Cho Trại Gà Mới (Brand Setup Automation)

Khi người dùng muốn nhân bản (clone) mã nguồn này để triển khai cho một trại gà mới hoặc thương hiệu mới, AI hãy tuân thủ quy trình 3 giai đoạn dưới đây:

---

## GIAI ĐOẠN 1: KHẢO SÁT THÔNG TIN (HỎI NGƯỜI DÙNG)

Trước khi chỉnh sửa bất kỳ file nào, AI PHẢI chào hỏi và yêu cầu người dùng cung cấp các thông tin sau (nếu người dùng chưa cung cấp):

```text
Chào bạn! Để thiết lập hệ thống livestream cho trại gà mới, bạn vui lòng cung cấp các thông tin sau:

1. Tên thương hiệu / Tên trại: (VD: Trại Gà Năm Hổ, Trại Gà Ba Anh Em, ...)
2. Tên miền chính thức: (VD: traiganamho.com - đã trỏ DNS Cloudflare về VPS)
3. Hotline & Số Zalo liên hệ: (VD: 0912 345 678)
4. Lịch live trực tiếp hàng ngày: (Mặc định: 18h30 hàng ngày, hoặc giờ bạn muốn)
5. Thông tin tài khoản ngân hàng nhận cọc / chốt gà:
   - Tên ngân hàng: (VD: VietinBank, MB Bank, Vietcombank, ...)
   - Số tài khoản: (VD: 0799 478 478)
   - Tên chủ tài khoản: (VD: NGUYEN VAN A)
6. Địa chỉ trại gà thực tế: (VD: Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk)
   - Link Google Maps (nếu có): 
7. Nhóm từ khóa SEO mong muốn: (VD: trai ga nam ho, trại gà năm hổ, ...)
8. Hình ảnh (nếu có link): Logo, Banner đầu trang, Ảnh QR Zalo (nếu chưa có thì hệ thống sẽ dùng ảnh mặc định)
```

> **Quy tắc:** Nếu người dùng thiếu thông tin nào (ví dụ chưa có link ảnh), AI hãy tự động dùng giá trị mặc định hợp lý và thông báo cho người dùng biết.

---

## GIAI ĐOẠN 2: CÁC FILE CẦN TỰ ĐỘNG CẬP NHẬT TRONG CODEBASE

Sau khi có đủ thông tin, AI sẽ tự động cập nhật các file sau theo đúng danh sách:

### 1. File `.env` (Biến môi trường)
Cập nhật:
```env
DOMAIN=traiganamho.com
SITE_TITLE="Trại Gà Năm Hổ - Xổ Gà Trực Tiếp 18h30 Hàng Ngày"
HOTLINE=0912345678
ZALO_URL=https://zalo.me/0912345678
STREAM_URL=https://traiganamho.com/live/stream/index.m3u8
```

### 2. File `livestream-frontend-next/app/layout.tsx` (SEO & Metadata)
Cập nhật các mục:
- `title`: `"{Tên Trại} - Xổ Gà Trực Tiếp {Giờ Live} Hàng Ngày | {Domain}"`
- `description`: Mô tả chuẩn SEO 150–160 ký tự chứa Tên trại, địa chỉ, giờ phát sóng.
- `metadataBase`: `new URL("https://{Domain}")`
- `keywords`: Tạo đủ 5 nhóm từ khóa tự động:
  1. Tên có dấu: `["trại gà năm hổ", "gà đòn năm hổ", ...]`
  2. Tên không dấu: `["trai ga nam ho", "ga don nam ho", ...]`
  3. Viết liền & domain: `["traiganamho", "traiganamho.com", "www.traiganamho.com"]`
  4. Từ khóa ngành: `["xổ gà trực tiếp", "vần xổ gà đòn", "gà đòn {Tỉnh/Thành}"]`
  5. Tên chủ trại & địa chỉ.
- `openGraph` & `twitter`: Cập nhật `title`, `description`, `url: "https://{Domain}"`.
- `schemaData` (JSON-LD): Cập nhật Schema Organization / LocalBusiness (`name`, `url`, `telephone`, `address`).

### 3. File `livestream-frontend-next/components/ViewerPageClient.tsx` (Giao Diện Xem Live)
Cập nhật các vị trí giao diện:
- **Header:** Logo & Tiêu đề `{Tên Trại}`, subtitle: `TINH HOA VIỆT`.
- **Top bar chat:** Hotline link `tel:{Hotline}` và nút Chốt Gà `https://zalo.me/{Hotline}`.
- **Card Ngân Hàng VIP (Bank Card):**
  - Tên ngân hàng, số tài khoản, tên chủ sở hữu.
- **Phần Giới Thiệu & Video Xem Lại:**
  - Tiêu đề phụ chứa tên trại và địa chỉ mới.
- **Footer:**
  - Tên trại, câu slogan, mô tả thương hiệu, Hotline, địa chỉ Google Maps, bản quyền footer `© {Year} {Tên Trại}`.

### 4. File `livestream-frontend-next/components/ChatBox.tsx` (Khung Bình Luận)
Cập nhật:
- Nút gọi hotline: `href="tel:{Hotline}"`, hiển thị `{Hotline}`.
- Nút chốt gà Zalo: `href="https://zalo.me/{Hotline}"`.

### 5. File `livestream-frontend-next/public/robots.txt` & `public/sitemap.xml`
- Cập nhật domain mới vào đường dẫn `Sitemap: https://{Domain}/sitemap.xml`.
- Cập nhật URL `<loc>https://{Domain}/</loc>` trong `sitemap.xml`.

### 6. Cấu Hình Nginx Host & Chứng Chỉ SSL
Tạo file cấu hình Nginx tại `/etc/nginx/sites-available/{Domain}`:
```nginx
server {
    server_name {Domain} www.{Domain};
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    location /live {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 60s;
    }

    location /videos {
        proxy_pass http://localhost:8081/videos;
        proxy_http_version 1.1;
        proxy_buffering off;
    }
}
```
Kích hoạt và cấp SSL Let's Encrypt:
```bash
ln -s /etc/nginx/sites-available/{Domain} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d {Domain} -d www.{Domain} --non-interactive --agree-tos -m admin@{Domain}
```

---

## GIAI ĐOẠN 3: BUILD, REDEPLOY VÀ KIỂM TRA CHẤT LƯỢNG

Sau khi apply xong code:
1. Chạy build tối ưu Next.js với BuildKit (chỉ ~4.5s):
   ```bash
   cd /root/livetraigachuba
   DOCKER_BUILDKIT=1 docker build -t livestream-frontend-next:local ./livestream-frontend-next
   ```
2. Khởi động lại container frontend:
   ```bash
   docker rm -f livestream-frontend-next
   docker run -d --name livestream-frontend-next --restart always \
     --network livetraigachuba_livestream-network -p 3001:3000 \
     -e BACKEND_API_URL=http://livestream-backend:8080 \
     livestream-frontend-next:local
   ```
3. Kiểm tra trang web:
   ```bash
   curl -I https://{Domain}
   ```
   Đảm bảo trả về `HTTP/2 200` và `x-powered-by: Next.js`.
4. Hướng dẫn người dùng cấu hình Cloudflare theo file [docs/CLOUDFLARE_OPTIMIZATION_GUIDE.md](file:///root/livetraigachuba/docs/CLOUDFLARE_OPTIMIZATION_GUIDE.md) để bật cache chunk `.ts` giảm lag.

