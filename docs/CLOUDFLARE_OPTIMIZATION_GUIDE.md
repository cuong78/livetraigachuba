# Hướng Dẫn Cấu Hình Cloudflare Tối Ưu Giảm Lag Cho Hệ Thống Livestream

Tài liệu này hướng dẫn chi tiết cách cấu hình Cloudflare khi triển khai hệ thống Livestream cho một trại gà mới, giúp triệt tiêu giật lag, hạ độ trễ xuống mức tối thiểu (Low Latency HLS), giảm 95% tải băng thông VPS và chịu tải hàng ngàn người xem cùng lúc.

---

## 1. Nguyên Lý Hoạt Động & Cốt Lõi Giảm Lag

```
[OBS / Prism Live] 
      │ (RTMP :1935)
      ▼
   [SRS Server] ──(Tạo HLS)──► [Nginx :8081]
                                    │
                                    ▼
                    [Cloudflare Global CDN] (Proxy ON 🟠)
                       ├── *.m3u8 (Playlist) ──► KHÔNG CACHE (Bypass) ──► Cập nhật thời gian thực
                       ├── *.ts   (Video Chunks) ─► CACHE 100% (HIT)  ──► Phục vụ từ Edge Cache gần nhất
                       └── /ws    (WebSocket)    ──► Kết nối thẳng     ──► Chat & Số người xem tức thì
                                    │
                                    ▼
                          [Người Xem Trực Tiếp]
```

### Hai Nguyên Tắc Sống Còn:
1. **File `*.m3u8` (Playlist): BẮT BUỘC KHÔNG ĐƯỢC CACHE LÂU (Bypass Cache)**
   - File này chứa danh sách các chunk video mới nhất và được cập nhật liên tục mỗi 1–2 giây.
   - Nếu bị cache, người xem sẽ nhận danh sách cũ, dẫn đến trễ hình 30s–60s, đứng hình hoặc lặp lại video.
2. **File `*.ts` (Video Segments): BẮT BUỘC PHẢI CACHE TRÊN CLOUDFLARE (Cache Everything)**
   - Mỗi file `.ts` chứa 1–2 giây video nhị phân bất biến (không bao giờ thay đổi nội dung).
   - Khi 1.000 người cùng xem, chunk video chỉ cần truyền từ VPS lên Cloudflare **1 lần duy nhất**, 999 người còn lại nhận trực tiếp từ Edge CDN Cloudflare (Hồng Kông, Singapore, VN).
   - VPS không bị nghẽn mạng băng thông, CPU chỉ 2–3%, xem mượt mà không xoay vòng.

---

## 2. Bước 1: Cấu Hình DNS (Bật Proxy 🟠)

Vào **Cloudflare Dashboard** ➜ Chọn tên miền ➜ **DNS** ➜ **Records**:

| Type | Name | Content | Proxy status | TTL | Mục đích |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (hoặc domain) | `IP_VPS_CỦA_BẠN` | **Proxied (Đám mây cam 🟠)** | Auto | Web + HLS CDN |
| **A** | `www` | `IP_VPS_CỦA_BẠN` | **Proxied (Đám mây cam 🟠)** | Auto | Web alias |

> [!IMPORTANT]
> - Luồng phát RTMP (`rtmp://domain:1935/live/...`) từ OBS hoặc điện thoại Prism Live đi theo cổng TCP 1935. Cloudflare gói miễn phí chỉ proxy cổng HTTP(S) (80, 443).
> - Vì vậy, phần mềm phát (OBS/Prism) có thể nhập trực tiếp **IP VPS** hoặc cấu hình thêm 1 bản ghi DNS phụ:
>   `stream.domain.com` ➜ `IP_VPS` ➜ **DNS Only (Đám mây xám ⚪)** để chuyên dùng phát RTMP.

---

## 3. Bước 2: Cấu Hình SSL/TLS

Vào **SSL/TLS**:
1. **Overview**: Chọn chế độ **Full (Strict)**.
   *(Đảm bảo Nginx trên VPS đã được cấp chứng chỉ SSL Let's Encrypt qua Certbot).*
2. **Edge Certificates**:
   - **Always Use HTTPS**: **BẬT (ON)** (Tự động chuyển HTTP ➜ HTTPS).
   - **Minimum TLS Version**: **TLS 1.2** (hoặc TLS 1.3).
   - **Opportunistic Encryption**: **BẬT (ON)**.
   - **TLS 1.3**: **BẬT (ON)** (Tăng tốc độ bắt tay mã hóa bảo mật).
   - **Automatic HTTPS Rewrites**: **BẬT (ON)**.

---

## 4. Bước 3: Cấu Hình Cache Rules (Quan Trọng Nhất Để Giảm Lag)

Vào **Caching** ➜ **Cache Rules** ➜ Bấm **Create rule** để tạo lần lượt 3 quy tắc sau theo thứ tự ưu tiên:

### Quy Tắc 1: Cache triệt để các file phân đoạn Video (`*.ts`)
- **Rule name:** `Cache HLS TS Segments`
- **When incoming requests match:**
  - Field: `URI Path`
  - Operator: `ends with`
  - Value: `.ts`
- **Cache eligibility:** **Eligible for cache**
- **Edge TTL:**
  - Override origin: **Bật**
  - Status code: `200` ➜ TTL: **2 hours** (hoặc 1 hour)
- **Browser TTL:**
  - Override origin: **Bật** ➜ TTL: **30 minutes**
- **Bấm Save and Deploy**.

### Quy Tắc 2: Không Cache file danh sách phát (`*.m3u8`)
- **Rule name:** `Bypass Cache HLS M3U8 Playlist`
- **When incoming requests match:**
  - Field: `URI Path`
  - Operator: `ends with`
  - Value: `.m3u8`
- **Cache eligibility:** **Bypass cache**
- **Bấm Save and Deploy**.

### Quy Tắc 3: Không Cache WebSocket và API Backend
- **Rule name:** `Bypass Cache API and WebSocket`
- **When incoming requests match:**
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/api`
  - *Hoặc OR:* Field: `URI Path` ➜ Operator: `starts with` ➜ Value: `/ws`
- **Cache eligibility:** **Bypass cache**
- **Bấm Save and Deploy**.

---

## 5. Bước 4: Tối Ưu Mạng & Tốc Độ (Network & Speed)

### Mục **Network**:
1. **HTTP/3 (with QUIC): BẬT (ON)**  
   *Cực kỳ quan trọng:* Giúp người xem dùng mạng 4G/5G khi di chuyển xe máy/ô tô hoặc mạng chập chờn không bị đứt luồng phát video, chống mất gói tin UDP tốt hơn TCP truyền thống.
2. **0-RTT Connection Resumption: BẬT (ON)**  
   Giảm độ trễ khi người xem mở lại trang web hoặc chuyển tab.
3. **WebSockets: BẬT (ON)** (Mặc định Cloudflare đã bật, kiểm tra chắc chắn đang ON để chat realtime hoạt động).
4. **gRPC:** Tắt nếu không dùng.

### Mục **Speed ➜ Optimization**:
1. **Brotli: BẬT (ON)** (Nén trang web Next.js nhỏ hơn 20% so với Gzip).
2. **Early Hints: BẬT (ON)** (Báo trước cho trình duyệt tải sớm CSS và hình ảnh).
3. **Rocket Loader: TẮT (OFF)**  
   > [!WARNING]
   > Rocket Loader có thể can thiệp vào mã JavaScript của thư viện HLS.js và Socket.io/StompJS, làm chậm trễ việc khởi tạo trình phát video. Hãy chắc chắn tắt nó!
4. **Auto Minify:** Bỏ tích HTML/JS/CSS (Next.js đã tự minify tối ưu khi build).

---

## 6. Bước 5: Cấu Hình Nginx Header Trên VPS Phối Hợp Với Cloudflare

Để Cloudflare nhận biết chính xác cách cache mà không bị xung đột, file cấu hình Nginx trên VPS (`/etc/nginx/sites-available/domain.com` hoặc `nginx-hls.conf`) phải có header kiểm soát:

```nginx
# HLS live streaming (.m3u8 và .ts)
location /live {
    proxy_pass http://localhost:8081;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_read_timeout 60s;

    # Tối ưu Cache Header cho Cloudflare
    location ~* \.m3u8$ {
        proxy_pass http://localhost:8081;
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0";
        add_header Access-Control-Allow-Origin *;
    }

    location ~* \.ts$ {
        proxy_pass http://localhost:8081;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin *;
    }
}
```

---

## 7. Bước 6: Kiểm Tra (Verification) Xem Đã Tối Ưu Thành Công Chưa

Chạy các lệnh sau trên terminal máy tính hoặc VPS:

### 1. Kiểm tra file chunk `.ts` có được Cloudflare Cache HIT không:
```bash
curl -I https://traigabaanhem.com/live/<streamKey>/<chunk_name>.ts
```
**Kết quả mong đợi:**
- Lần gọi thứ 2 trở đi xuất hiện:  
  `cf-cache-status: HIT`  
  `cf-ray: ...-HKG` (hoặc `-SIN`, `-HAN`)  
  *-> Thành công: File video đã được Cloudflare phục vụ từ Edge gần nhất mà không cần chạm vào VPS!*

### 2. Kiểm tra file playlist `.m3u8` không bị cache đọng:
```bash
curl -I https://traigabaanhem.com/live/<streamKey>/index.m3u8
```
**Kết quả mong đợi:**
- `cf-cache-status: DYNAMIC` hoặc `BYPASS`
- `cache-control: no-cache, no-store, max-age=0`
- *-> Thành công: Người xem luôn nhận dữ liệu video mới nhất theo thời gian thực!*

---

## 8. Bảng Tổng Hợp Thông Số Cho Trại Gà Mới

Khi triển khai cho khách hàng/trại gà mới, chỉ cần đối chiếu checklist:
- [ ] Trỏ 2 bản ghi A `@` và `www` bật đám mây cam 🟠.
- [ ] Tạo bản ghi phụ `stream` đám mây xám ⚪ để nạp OBS/Prism Live qua RTMP.
- [ ] Bật SSL Full (Strict) + Always Use HTTPS + TLS 1.3.
- [ ] Thêm Cache Rule: `.ts` (Eligible, 2h), `.m3u8` (Bypass), `/api` & `/ws` (Bypass).
- [ ] Bật HTTP/3 (QUIC) + 0-RTT.
- [ ] Tắt Rocket Loader.
