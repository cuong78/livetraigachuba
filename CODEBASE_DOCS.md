# 📚 Tài liệu Kỹ thuật — Hệ thống Livestream Gà Chọi Xóm Bầu

> **Mục đích:** Tài liệu này mô tả toàn bộ kiến trúc, luồng hoạt động, các vấn đề đã xác định và plan giải quyết của hệ thống.  
> **Cập nhật lần cuối:** 2026-11-09

---

## 1. Tổng quan hệ thống

### 1.1 Chức năng chính

| Người dùng | Chức năng |
|---|---|
| **Viewer (không cần đăng nhập)** | Xem live stream, gửi bình luận (chat real-time), xem lại video đã lưu |
| **Admin (đăng nhập)** | Phát live từ điện thoại qua RTMP, quản lý chat, xem lại video, **upload/merge video lưu lại**, xóa video, chặn IP |

### 1.2 Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Maven |
| Frontend | ReactJS 18 + TypeScript, Vite |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| WebSocket/Chat | Spring WebSocket + STOMP protocol |
| Auth | JWT (Access Token) + Refresh Token (DB) |
| RTMP Server | SRS (Simple Realtime Server) v6 |
| Video phân phối HLS | Nginx |
| Video merge/xử lý | FFmpeg |
| Container | Docker + Docker Compose |

### 1.3 Kiến trúc hệ thống

```
App điện thoại (Larix/PRISM/OBS)
        │
        │  RTMP stream (port 1935)
        ▼
┌──────────────────┐       DVR callback (HTTP)      ┌──────────────────────┐
│   SRS Server v6  │ ─────────────────────────────► │  Spring Boot Backend │
│  - RTMP ingestion│       /api/recordings/           │  - REST API          │
│  - HLS output    │         callback/dvr             │  - WebSocket (STOMP) │
│  - DVR recording │                                  │  - JWT Auth          │
│    (.flv files)  │       publish/unpublish          │  - PostgreSQL        │
└───────┬──────────┘ ─────────────────────────────► │  - Redis cache       │
        │                                            └──────────────────────┘
        │  HLS segments (.ts, .m3u8)
        ▼
┌──────────────────┐
│  Nginx :8081     │  ◄─── Viewer Browser (hls.js kéo .ts files)
│  - Serve HLS     │
│  - Serve MP4     │  ◄─── Viewer Browser (video xem lại)
│    recordings    │
└──────────────────┘
```

### 1.4 Ports

| Service | Port | Mục đích |
|---|---|---|
| Frontend (React) | 3000 | Web UI |
| Backend (Spring Boot) | 8080 | REST API, WebSocket |
| Nginx (HLS + Video) | 8081 | Phân phối HLS stream và MP4 video |
| SRS RTMP | 1935 | Nhận RTMP stream từ app phát |
| SRS HTTP API | 1985 | SRS management API |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

---

## 2. Luồng Video Live Stream

### 2.1 Luồng phát live (Admin → Viewer)

```
1. Admin mở app (Larix Broadcaster / PRISM Live / OBS) trên điện thoại
2. Nhập RTMP URL: rtmp://<server>:1935/live  
   Stream Key: <stream_key của user admin lấy từ hệ thống>
3. App gửi RTMP stream đến SRS Server (port 1935)
4. SRS gửi HTTP callback POST đến /api/stream/callback/publish
   → Backend tìm user theo stream_key → ghi trạng thái Stream = LIVE vào PostgreSQL
5. SRS chuyển RTMP → HLS (.m3u8 + .ts files), lưu tại:
   /usr/local/srs/objs/nginx/html/live/<stream_key>/index.m3u8
6. Nginx :8081 phục vụ các file HLS này ra ngoài internet
7. Frontend (hls.js) poll .m3u8 mỗi 2 giây để lấy .ts mới → phát video cho viewer
```

### 2.2 Luồng kết thúc live (Unpublish)

```
1. Admin dừng phát từ app điện thoại
2. SRS gửi HTTP callback POST đến /api/stream/callback/unpublish
3. Backend (StreamController.onUnpublish):
   a. Tìm stream đang LIVE → cập nhật trạng thái thành ENDED
   b. Gọi recordingService.markAllActiveRecordingsComplete(stream)
      → Các bản ghi Recording trong DB được đánh dấu status = READY
   ⚠️ HIỆN TẠI: KHÔNG tự động merge video — admin phải ấn tay
```

---

## 3. Luồng Lưu Video (DVR → MP4)

### 3.1 SRS DVR hoạt động thế nào

SRS ghi song song với stream, mỗi lần **kết thúc một segment** (mặc định không giới hạn thời gian - DVR session), SRS tạo file `.flv` và gọi callback:

```
SRS ghi file: ./objs/nginx/html/recordings/live/<stream_key>/<YYYY-MM-DD>/timestamp.flv
                        ↓
SRS gọi: POST /api/recordings/callback/dvr
  Body: { "app": "live", "stream": "<stream_key>", "file": "<đường dẫn file .flv>" }
                        ↓
Backend (RecordingController.onDvr):
  → Tạo bản ghi Recording trong DB với status = READY
  → Đảm bảo tồn tại DailyRecording cho ngày hôm đó (status = PENDING)
```

### 3.2 Luồng merge video thủ công (HIỆN TẠI)

```
1. Admin đăng nhập vào web
2. Sau khi kết thúc live, Admin cuộn xuống section "VIDEO XEM LẠI"
3. Admin thấy nút: 📤 "Upload Video Hôm Nay (DD/MM/YYYY)"
   → Nút này CHỈ hiện với admin đã đăng nhập (isAdmin === true)
4. Admin click nút → window.confirm() hiện popup xác nhận:
   "Bạn có muốn upload video ngày DD/MM/YYYY lên hệ thống không?
    Lưu ý: Quá trình này sẽ gộp tất cả các đoạn video đã ghi trong ngày."
5. Admin chọn "OK"
6. Frontend gọi: POST /api/recordings/admin/merge/{today}
7. Backend (RecordingController.triggerMerge):
   → Gọi recordingService.triggerMerge(date)
   → @Async: Chạy mergeRecordingsForDate(date) trong background thread
8. Backend phản hồi ngay: { "success": true, "message": "Merge process started..." }
9. Frontend hiện alert: "✅ Đang xử lý video! Sẽ xuất hiện sau vài phút."
10. Frontend setTimeout 5 giây → gọi lại getRecentRecordings() để refresh danh sách
```

### 3.3 Luồng merge FFmpeg (nội bộ)

```
mergeRecordingsForDate(date):
  1. Kiểm tra lock (ConcurrentHashMap mergingDates) — tránh merge song song
  2. Kiểm tra DailyRecording: nếu status = PROCESSING → skip
                               nếu status = READY với videoUrl → skip
  3. Lấy tất cả Recording[] có status = READY, sắp xếp theo segmentOrder
  4. Cập nhật DailyRecording.status = PROCESSING
  5. Tạo file danh sách FFmpeg concat (temp file):
     file '/recordings/live/<key>/<date>/xxx.flv'
     file '/recordings/live/<key>/<date>/yyy.flv'
     ...
  6. Chạy FFmpeg (xem chi tiết tại [Issue #1] bên dưới)
  7. Nếu merge OK → validateMergedVideo() bằng ffprobe
  8. Nếu valid:
     - Cập nhật DailyRecording: status=READY, videoUrl, filePath, duration, fileSize
     - Xóa các file .flv segment gốc để tiết kiệm disk
  9. Nếu fail → retry tối đa 2 lần, mỗi lần cách 10 giây
  10. Nếu tất cả fail → DailyRecording.status = FAILED
```

### 3.4 Luồng xem lại video (Viewer)

```
1. Viewer vào trang chủ
2. Frontend gọi GET /api/recordings/recent → lấy danh sách DailyRecording có status = READY
3. Frontend hiển thị grid các video card (thumbnail, title, duration)
4. Viewer click vào card → modal hiện VideoPlayer với MP4 URL:
   http://<server>:8081/videos/daily/<YYYY-MM-DD>.mp4
```

---

## 4. Hệ thống Authentication

### 4.1 Luồng đăng nhập Admin

```
1. Admin click icon 🔐 (ẩn) trên UI → LoginModal hiện ra
2. Nhập username + password
3. Frontend: POST /api/auth/login
4. Backend:
   - Verify password bằng BCrypt
   - Tạo JWT Access Token (hiện tại: 24 giờ)
   - Tạo Refresh Token (lưu DB, 7 ngày)
   - Trả về: { token, refreshToken, user }
5. Frontend lưu vào localStorage:
   - admin_token: JWT access token
   - admin_user: { id, username, email, streamKey, role }
   - refresh_token: refresh token UUID
6. Mỗi request API tiếp theo đính kèm: Authorization: Bearer <token>
```

### 4.2 Kiểm tra token phía Frontend

File: `src/services/api.ts`

```typescript
// Trước mỗi request → kiểm tra token có hết hạn không
// Nếu hết hạn → xóa localStorage + reload trang (logout tự động)
api.interceptors.request.use(config => {
  if (isTokenExpired(token)) {
    localStorage.removeAll(); window.location.reload();
  }
});

// Nếu server trả 401/403 → xóa token + reload
api.interceptors.response.use(_, error => {
  if (error.response?.status === 401 || 403) {
    localStorage.removeAll(); window.location.reload();
  }
});
```

### 4.3 Cấu hình JWT hiện tại

| Thông số | Giá trị dev | Giá trị prod (env var) |
|---|---|---|
| Access Token TTL | `86400000` ms = **24 giờ** | `${JWT_EXPIRATION}` |
| Refresh Token TTL | `604800000` ms = **7 ngày** | `${JWT_REFRESH_EXPIRATION}` |
| Refresh Token storage | PostgreSQL table `refresh_tokens` | — |
| Token validation | Chữ ký + thời gian hết hạn | — |

### 4.4 Luồng Refresh Token

```
Khi refresh token còn hiệu lực và access token hết hạn:
POST /api/auth/refresh  { refreshToken: "<uuid>" }
→ Backend: verify refresh token không expired/revoked
→ Tạo access token mới
→ Trả về: { accessToken, refreshToken }

⚠️ HIỆN TẠI: Frontend KHÔNG tự động gọi refresh.
   Khi access token hết hạn → logout ngay lập tức (kể cả trong đêm đang live).
```

---

## 5. Các Vấn Đề Đã Xác Định (Issues)

### Issue #1 — 🔴 Video merge bị corrupt (Nghiêm trọng nhất)

**Triệu chứng:** Video xem lại không phát được, file MP4 bị lỗi, hoặc không có video nào xuất hiện sau khi live.

**Nguyên nhân:**
- FFmpeg ghép nhiều file `.flv` bằng `-c copy` (stream copy không re-encode)
- Các file `.flv` được SRS ghi khi điện thoại bị rớt mạng rồi kết nối lại
- Mỗi lần reconnect tạo ra file `.flv` mới với timestamp PTS/DTS **bắt đầu từ 0**
- Khi nối các file có timestamp không liên tục → MP4 bị lệch, trình duyệt không phát được

**File bị ảnh hưởng:** `RecordingService.java` → hàm `mergeWithFFmpeg()`

**Lệnh cũ (lỗi):**
```bash
ffmpeg -y -f concat -safe 0 -i list.txt -c copy -movflags +faststart output.mp4
```

**Fix (đã áp dụng):**
```bash
ffmpeg -y -fflags +genpts -f concat -safe 0 -i list.txt \
  -c:v copy \
  -c:a aac -b:a 128k -ar 44100 \
  -avoid_negative_ts make_zero \
  -movflags +faststart \
  output.mp4
```
- `-c:v copy`: giữ nguyên video (nhanh, không re-encode)
- `-c:a aac -ar 44100`: re-encode audio để fix lệch sample rate
- `-avoid_negative_ts make_zero`: sửa timestamp âm giữa các segment
- `-fflags +genpts`: tái tạo PTS khi bị thiếu/hỏng

---

### Issue #2 — 🔴 Video KHÔNG tự động merge khi stream kết thúc

**Triệu chứng:** Sau khi admin dừng live, không có gì xảy ra tự động. Admin phải vào web, tìm nút "Upload Video Hôm Nay" và ấn tay.

**Nguyên nhân:**
- `StreamController.onUnpublish()` chỉ gọi `markAllActiveRecordingsComplete()`
- Không có lệnh gọi `triggerMerge()` sau khi unpublish

**File bị ảnh hưởng:** `StreamController.java` dòng 81–107

**Fix (cần thực hiện):**
```java
// Sau khi markAllActiveRecordingsComplete, thêm:
LocalDate today = LocalDate.now();
CompletableFuture.delayedExecutor(30, TimeUnit.SECONDS).execute(() -> {
    recordingService.triggerMerge(today);
});
// Delay 30s để SRS kịp gửi nốt callback DVR cuối cùng
```

---

### Issue #3 — 🔴 URL video hardcode IP LAN nội bộ

**Triệu chứng:** Viewer truy cập từ 4G hoặc thiết bị khác mạng LAN không xem được video lưu lại (404 hoặc không kết nối được).

**Nguyên nhân:**
- `docker-compose.yml` dòng 83: `RECORDING_VIDEO_URL_BASE: http://192.168.1.9:8081/videos`
- `192.168.1.9` là IP máy local, chỉ truy cập được trong mạng LAN

**File bị ảnh hưởng:** `docker-compose.yml`, `application.yml`

**Fix:**
- Thay bằng domain thực tế hoặc public IP trong file `.env`
- `docker-compose.yml` đã có file `docker-compose.prod.yml` dùng biến môi trường đúng cách

---

### Issue #4 — 🔴 Admin bị logout giữa đêm khi access token hết hạn

**Triệu chứng:** Admin đăng nhập buổi chiều, đến tối đang live thì bị đăng xuất tự động (access token 24 giờ hết hạn khi để browser qua đêm, hoặc thiết bị ngủ màn hình).

**Nguyên nhân:**
- `jwt.expiration = 86400000` = 24 giờ
- Frontend khi phát hiện token hết hạn → gọi `window.location.reload()` (logout ngay)
- **Không có cơ chế tự động refresh token** dù refresh token 7 ngày vẫn còn hiệu lực

**Giải pháp đề xuất (xem chi tiết tại Phần 7):** Cho access token không hết hạn (hoặc TTL = 1 năm) + giữ refresh token để revoke khi cần.

---

### Issue #5 — 🟠 Web xem live bị giật lag

**Triệu chứng:** Video bị xoay vòng loading, giật, dừng đột ngột khi xem live.

**Nguyên nhân (theo thứ tự ảnh hưởng):**

1. **Keyframe Interval sai trên app phát** _(nguyên nhân #1)_
   - SRS cấu hình `hls_fragment 2` = cắt .ts mỗi 2 giây
   - App phát để Keyframe = Auto → thực tế keyframe mỗi 4–10 giây
   - SRS PHẢI chờ keyframe mới cắt được .ts → segment bị kéo dài bất thường
   - Viewer phải chờ 4–10 giây/segment thay vì 2 giây → giật

2. **VideoPlayer buffer quá mỏng** _(nguyên nhân #2)_
   - `lowLatencyMode: true` + `liveSyncDurationCount: 3` = chỉ buffer ~6 giây
   - Rớt mạng 1 giây → player hết buffer → vòng xoay loading

3. **Không có CDN** _(nguyên nhân #3 nếu nhiều người xem)_
   - Tất cả viewer kéo .ts files trực tiếp từ cùng 1 Nginx
   - Băng thông VPS bị bão hòa khi 10+ người xem đồng thời

**Fix:**
- Cài đặt Keyframe Interval = 2 giây cứng trên app phát
- Tăng buffer player: `liveSyncDurationCount: 5`, `maxBufferLength: 60`, tắt `lowLatencyMode`
- Thêm logic auto-reconnect khi network error

---

### Issue #6 — 🟠 Merge bị skip vĩnh viễn khi trạng thái bị "stuck"

**Triệu chứng:** DailyRecording có status = PROCESSING mãi không chuyển sang READY hoặc FAILED (do server bị crash hoặc restart khi đang merge).

**Nguyên nhân:**
- Khi server restart, `mergingDates` Set bị xóa trong bộ nhớ
- Nhưng DB vẫn còn trạng thái PROCESSING
- Lần merge tiếp theo bị skip: `"Merge already processing for date: X, skipping"`

**Fix (đã áp dụng):**
```java
// Nếu status = PROCESSING quá 30 phút → coi là stuck, cho phép retry
if (existing.getStatus() == PROCESSING && updatedAt < now - 30 phút) {
    // Tiếp tục merge, không return sớm
}
```

---

### Issue #7 — 🟡 File .ts HLS tích lũy vô hạn

**Triệu chứng:** Disk server đầy dần sau mỗi buổi live.

**Nguyên nhân:** `srs.conf` cấu hình `hls_cleanup off` → SRS giữ tất cả file .ts đã phát, không tự xóa.

**Fix:** Bật `hls_cleanup on` trong `srs.conf`.

---

## 6. Cấu trúc Database

### Bảng `users`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGINT PK | |
| username | VARCHAR | Tên đăng nhập |
| password | VARCHAR | BCrypt hash |
| email | VARCHAR | |
| stream_key | VARCHAR | UUID ngẫu nhiên dùng để xác thực khi phát RTMP |
| role | ENUM | ADMIN hoặc USER |
| is_active | BOOLEAN | |

### Bảng `streams`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK | |
| title | VARCHAR | |
| status | ENUM | LIVE / ENDED |
| hls_url | VARCHAR | URL đến file .m3u8 |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | |
| viewer_count | INT | |

### Bảng `recordings` (segment FLV)
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGINT PK | |
| recording_date | DATE | Ngày ghi |
| stream_key | VARCHAR | |
| file_path | VARCHAR | Đường dẫn file .flv trong container |
| segment_order | INT | Thứ tự segment trong ngày |
| status | ENUM | RECORDING / READY / MERGED / FAILED / DELETED |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | |

### Bảng `daily_recordings` (video gộp MP4)
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGINT PK | |
| recording_date | DATE UNIQUE | Ngày (1 ngày = 1 video) |
| title | VARCHAR | VD: "Video Xem Lại Tối 09/11/2026" |
| file_path | VARCHAR | Đường dẫn MP4 trong container |
| video_url | VARCHAR | URL công khai để xem (`http://<host>/videos/daily/<date>.mp4`) |
| thumbnail_url | VARCHAR | URL ảnh thumbnail |
| duration_seconds | BIGINT | Thời lượng (giây) |
| file_size_bytes | BIGINT | Kích thước file |
| segment_count | INT | Số segment FLV đã gộp |
| status | ENUM | PENDING / PROCESSING / READY / FAILED / DELETED |
| created_at / updated_at | TIMESTAMP | |

### Bảng `refresh_tokens`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGINT PK | |
| token | VARCHAR UNIQUE | UUID |
| user_id | BIGINT FK | |
| expiry_date | TIMESTAMP | |
| revoked | BOOLEAN | |

---

## 7. Plan Giải Quyết Vấn Đề (Hướng A)

### 7.1 Yêu cầu: Admin Access Token không bao giờ hết hạn

**Phân tích:**
> Vì dự án chỉ có 1 admin duy nhất, không cần enterprise security phức tạp.
> Nhu cầu thực tế: Admin đăng nhập 1 lần, dùng mãi mãi không bị logout bất ngờ.

**Giải pháp đề xuất: Access Token TTL = 100 năm**

Thay vì xây dựng phức tạp silent refresh, đơn giản nhất là set TTL cực lớn.

**Thay đổi cần thực hiện:**

**Backend — `application.yml`:**
```yaml
jwt:
  expiration: 3153600000000  # 100 năm tính bằng milliseconds
```

**Backend — `application-prod.yml` (env var):**
```bash
# File .env
JWT_EXPIRATION=3153600000000
```

**Frontend — `api.ts`:**
```typescript
// Xóa toàn bộ logic isTokenExpired() và checkTokenAndLogout()
// Vì token thực tế không bao giờ hết hạn trong vòng đời dự án

// Chỉ giữ lại xử lý 401/403 từ server (token bị revoke thủ công)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("refresh_token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);
```

> **Lưu ý bảo mật:** Nếu token bị lộ, admin có thể logout thủ công (gọi /auth/logout để revoke refresh token), hoặc đổi JWT_SECRET để vô hiệu hóa tất cả token cũ.

---

### 7.2 Các fix theo thứ tự ưu tiên

| # | Vấn đề | File | Trạng thái |
|---|---|---|---|
| 1 | Fix FFmpeg timestamp (`-c:a aac`, `-avoid_negative_ts`, `-fflags +genpts`) | `RecordingService.java` | ✅ Đã hoàn thành |
| 2 | Fix stuck PROCESSING (reset sau 30 phút) | `RecordingService.java` | ✅ Đã hoàn thành |
| 3 | Kiểm tra file stable trước khi merge | `RecordingService.java` | ✅ Đã hoàn thành |
| 4 | Auto-merge khi unpublish (delay 30s) | `StreamController.java` | ⏳ Chờ thực hiện |
| 5 | Access token vĩnh viễn (`expiration=0`) | `JwtService.java`, `application.yml`, `api.ts` | ✅ Đã hoàn thành |
| 6 | Fix URL hardcode IP LAN | `docker-compose.yml`, `.env` | ⏳ Chờ thực hiện |
| 7 | Tối ưu VideoPlayer buffer | `VideoPlayer.tsx` | ⏳ Chờ thực hiện |
| 8 | Bật hls_cleanup SRS | `srs.conf` | ⏳ Chờ thực hiện |
| 9 | Cache headers Nginx HLS | `nginx-hls.conf` | ⏳ Chờ thực hiện |
| 10 | Cron job tự động merge 00:30 AM | `RecordingScheduler.java` | ⏳ Chờ thực hiện |

---

## 8. Hướng dẫn vận hành

### 8.1 Deploy production

```bash
# Tạo file .env từ template
cp .env.example .env
# Chỉnh sửa các biến trong .env

# Build và khởi động
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Xem logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 8.2 Cài đặt app phát (BẮT BUỘC để hết lag)

| Setting | Giá trị |
|---|---|
| RTMP URL | `rtmp://<server>:1935/live` |
| Stream Key | `<stream_key của admin>` |
| Video Bitrate | 2500–3500 kbps (CBR) |
| **Keyframe Interval** | **2.0 giây** ← QUAN TRỌNG NHẤT |
| Audio Codec | AAC |
| Audio Bitrate | 128 kbps |
| Sample Rate | 44100 Hz |

### 8.3 Quy trình sau mỗi buổi live

**Hiện tại (thủ công):**
1. Dừng phát trên app
2. Vào web, đăng nhập admin
3. Cuộn xuống section "VIDEO XEM LẠI"
4. Click "📤 Upload Video Hôm Nay"
5. Xác nhận popup
6. Chờ ~2–5 phút (tùy độ dài video)
7. Refresh trang để thấy video mới

**Sau khi fix Issue #2 (tự động):**
1. Dừng phát trên app
2. Hệ thống tự động merge sau 30 giây
3. Video xuất hiện sau ~2–5 phút không cần thao tác tay

### 8.4 Merge thủ công qua API

```bash
# Trigger merge cho ngày cụ thể (cần admin token)
curl -X POST https://<domain>/api/recordings/admin/merge/2026-11-09 \
  -H "Authorization: Bearer <admin_token>"

# Kiểm tra trạng thái
curl https://<domain>/api/recordings/date/2026-11-09
```

---

## 9. File Structure

```
livestreamxombau/
├── livestream-backend/              # Spring Boot
│   └── src/main/java/com/livestream/
│       ├── config/
│       │   ├── JwtAuthenticationFilter.java  # Lọc JWT mỗi request
│       │   ├── SecurityConfig.java           # Cấu hình Spring Security
│       │   └── WebSocketConfig.java          # STOMP WebSocket
│       ├── controller/
│       │   ├── AuthController.java           # /auth/login, /auth/refresh, /auth/logout
│       │   ├── StreamController.java         # /stream/current, /stream/callback/*
│       │   ├── RecordingController.java      # /recordings/*, /recordings/admin/*
│       │   ├── ChatController.java           # WebSocket chat
│       │   └── BlockedIpController.java      # /admin/blocked-ips/*
│       ├── service/
│       │   ├── JwtService.java               # Tạo/validate JWT
│       │   ├── AuthService.java              # Xác thực user
│       │   ├── RefreshTokenService.java      # Quản lý refresh token
│       │   ├── StreamService.java            # Logic stream
│       │   ├── RecordingService.java         # Logic DVR + FFmpeg merge ← QUAN TRỌNG
│       │   └── ViewerCountService.java       # Đếm người xem
│       └── entity/ dto/ repository/ scheduler/
│
├── livestream-frontend/             # React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── VideoPlayer.tsx               # hls.js player ← cần tối ưu buffer
│       │   ├── ChatBox.tsx                   # Chat UI
│       │   └── ...
│       ├── pages/
│       │   └── ViewerPage.tsx                # Trang chính ← tất cả logic admin
│       └── services/
│           ├── api.ts                        # Axios instance + interceptors + auth
│           └── websocket.ts                  # STOMP WebSocket client
│
├── srs.conf                         # SRS Server config (RTMP, HLS, DVR)
├── nginx-hls.conf                   # Nginx config (serve HLS + MP4)
├── docker-compose.yml               # Dev environment
├── docker-compose.prod.yml          # Production environment
└── CODEBASE_DOCS.md                 # File này
```
