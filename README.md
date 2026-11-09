Nền tảng live streaming chuyên nghiệp, phát trực tiếp từ điện thoại (RTMP) với chat real-time.

---

## 🎨 Thiết kế mới

- 🎨 Giao diện chuyên nghiệp với màu đỏ/vàng/đen truyền thống
- 📱 Responsive hoàn toàn cho mobile và desktop
- ✨ Hiệu ứng gradient, animation mượt mà
- 🎯 Tích hợp đầy đủ thông tin CLB, liên hệ, quy định

## 📋 Tổng quan dự án

### Mô tảa

- **Admin**: Đăng nhập, phát live từ điện thoại qua RTMP Publisher app, quản lý stream, xem chat real-time
- **Khách**: Xem live không cần đăng nhập, bình luận với tên tùy chỉnh (lưu vào localStorage)
- **Real-time chat**: WebSocket cho bình luận trực tiếp
- **Mobile-first**: Tối ưu cho điện thoại (admin và viewer đều dùng mobile nhiều)

### Tech Stack

#### Backend

- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **WebSocket**: STOMP protocol
- **Security**: Spring Security + JWT
- **Build**: Maven

#### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Router**: React Router v6
- **Video Player**: Video.js (HLS support) - **Custom Theme**
- **WebSocket**: STOMP.js + SockJS
- **HTTP Client**: Axios
- **Styling**: Custom CSS with responsive design

#### Streaming Infrastructure

- **RTMP Server**: SRS (Simple Realtime Server) v5
- **Protocol**: RTMP input → HLS output
- **Latency**: ~5-8 seconds (optimized)

#### DevOps

- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐
│  Mobile Phone   │
│  (RTMP Publisher│  ──RTMP (1935)──▶  ┌──────────────┐
│   App - Admin)  │                     │  SRS Server  │
└─────────────────┘                     │  (RTMP→HLS)  │
                                        └──────┬───────┘
┌─────────────────┐                           │ HLS
│  Mobile/Web     │                           ▼
│  (Viewer)       │  ◀─────────────  ┌──────────────┐
└────────┬────────┘                  │   Nginx      │
         │                           │ (Reverse Proxy)
         │ HTTP/WS                   └──────┬───────┘
         ▼                                  │
┌─────────────────────────────────────────▼┴────────┐
│              Spring Boot Backend                   │
│  - REST API                                        │
│  - WebSocket (STOMP)                               │
│  - JWT Auth                                        │
└────────┬──────────────────────┬────────────────────┘
         │                      │
         ▼                      ▼
┌──────────────┐        ┌──────────────┐
│  PostgreSQL  │        │    Redis     │
│  (Data)      │        │  (Cache)     │
└──────────────┘        └──────────────┘
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Docker** & **Docker Compose** (recommended)
- Hoặc cài riêng:
  - Java 17+
  - Node.js 18+
  - PostgreSQL 15+
  - Redis 7+
  - Maven 3.9+

### Cài đặt với Docker (Khuyến nghị)

1. **Clone repository**

```bash
git clone https://github.com/cuong78/livestream.git
cd liveStream
```

2. **Khởi động toàn bộ services**

```bash
docker-compose up -d
```

Services sẽ chạy tại:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- RTMP Server: rtmp://localhost:1935/live
- HLS Stream: http://localhost:8081/live/{streamKey}.m3u8
- SRS HTTP API: http://localhost:1985/api/v1
- PostgreSQL: localhost:5432
- Redis: localhost:6379

3. **Kiểm tra logs**

```bash
docker-compose logs -f
```

4. **Dừng services**

```bash
docker-compose down
```

### Cài đặt thủ công (Development)

#### Backend

```bash
cd livestream-backend

# Install dependencies
mvn clean install

# Run application
mvn spring-boot:run
```

#### Frontend

```bash
cd livestream-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Database Setup

```sql
-- Create database
CREATE DATABASE livestream_db;

-- Create user
CREATE USER livestream_user WITH PASSWORD 'livestream_pass';
GRANT ALL PRIVILEGES ON DATABASE livestream_db TO livestream_user;
```

---

## 📱 Hướng dẫn sử dụng

### Cho Admin

1. **Cài đặt RTMP Publisher app** trên điện thoại

   - iOS: "RTMP Live Streaming Publisher"
   - Android: "Larix Broadcaster" hoặc "CameraFi Live"

2. **Cấu hình streaming**

   - **Server URL**: `rtmp://your-server.com:1935/live`
   - **Stream Key**: (lấy từ admin dashboard sau khi đăng nhập)
   - **Quality**: HD (720p, 3500kbps)
   - **Frame Rate**: 25-30 FPS
   - **Orientation**: Landscape (16:9)

3. **Bắt đầu live**
   - Đăng nhập admin dashboard
   - Copy stream key
   - Mở RTMP Publisher app → Settings → paste Server URL và Stream Key
   - Nhấn "Start Streaming"
   - Chat sẽ hiển thị bên cạnh/dưới video

### Cho Viewer (Khách hàng)

1. **Truy cập website** (không cần đăng nhập)

   - Desktop: http://your-domain.com
   - Mobile: Tương tự, tối ưu responsive

2. **Xem live và bình luận**
   - Nhập tên hiển thị (lưu tự động vào localStorage)
   - Nhập nội dung bình luận
   - Nhấn "Gửi"
   - Bình luận hiển thị real-time cho tất cả viewers

---

## 🛠️ Kế hoạch phát triển chi tiết

### Phase 1: Backend Foundation ✅ (Đã hoàn thành)

- [x] Setup Spring Boot project với Maven
- [x] Cấu hình PostgreSQL + Redis connection
- [x] Tạo entities (User, Stream, Comment)
- [x] Tạo repositories (JPA)
- [x] Config WebSocket (STOMP)
- [x] Config Spring Security (JWT ready)
- [x] Controller cơ bản (Stream, Chat)

### Phase 2: Frontend Foundation ✅ (Đã hoàn thành)

- [x] Setup React + TypeScript + Vite
- [x] Component VideoPlayer (Video.js + HLS)
- [x] Component ChatBox (localStorage cho display name)
- [x] Page ViewerPage (layout responsive)
- [x] WebSocket client (STOMP.js)
- [x] Routing (React Router)

### Phase 3: RTMP & Streaming Infrastructure ✅ (Đã hoàn thành)

- [x] Setup SRS server container (Docker)
- [x] Cấu hình RTMP input (port 1935)
- [x] Cấu hình HLS output (low-latency: 1s segments)
- [x] Stream key validation endpoint
- [x] HTTP callbacks (on_publish, on_unpublish)
- [x] HLS file serving (port 8081)
- [x] CORS enabled cho streaming
- [x] Tối ưu low-latency (~5-8s delay)

### Phase 4: Authentication & Admin Features ✅ (Đã hoàn thành)

- [x] JWT token generation/validation service (JwtService)
- [x] Login API endpoint (POST /auth/login)
- [x] Register API endpoint (POST /auth/register)
- [x] JWT Authentication Filter
- [x] Stream settings API (GET /user/stream-settings)
- [x] Regenerate stream key API
- [x] Protected routes với Spring Security
- [x] Stream key tự động generate cho user
- [x] Swagger UI với JWT authentication

### Phase 5: Real-time Chat Enhancement ✅ (Hoàn thành)

- [x] WebSocket STOMP configuration
- [x] ChatBox component (React)
- [x] Real-time comment display
- [x] Comment validation (length 1-500 chars, profanity filter)
- [x] Rate limiting (3 giây/comment per IP với Redis)
- [x] IP tracking qua WebSocket handshake interceptor
- [x] Profanity filter tiếng Việt + English
- [x] Block số điện thoại, URLs, từ ngữ cấm (cá độ, chửi thề)
- [x] Frontend circular buffer: chỉ giữ 50 comments mới nhất
- [x] Error handling và UI feedback real-time
- [x] No database storage (chỉ broadcast qua WebSocket)
- [x] Delete comment

### Phase 6: Stream Management ⏳ (Đang phát triển)

- [x] Create stream API (tự động qua SRS callback)
- [x] End stream API (tự động qua SRS callback)
- [x] Get current stream API (GET /stream/current)
- [x] Stream status monitoring (LIVE/ENDED)
- [x] SRS callbacks integration (on_publish, on_unpublish)
- [x] Auto stream creation khi user bắt đầu RTMP
- [x] Viewer count

### Phase 7: IP Blocking & Admin Features ✅ (Hoàn thành)

- [x] IP tracking trong WebSocket handshake
- [x] BlockedIp entity, repository, service
- [x] Admin block/unblock IP endpoints
- [x] BlockedIpsModal UI component
- [x] Admin context menu (delete comment, view IP, block IP)
- [x] Viewer count display and synchronization
- [x] Comment history với Redis (50 comments, 24h TTL)

### Phase 8: Testing & Quality Assurance ✅ (Hoàn thành)

**Load Testing (k6):**

- [x] Chat load test (100+ concurrent users, WebSocket)
- [x] Viewer load test (500-1000 concurrent viewers, HLS streaming)
- [x] API stress test (authentication, stream endpoints)
- [x] Performance benchmarks và thresholds
- [x] Custom metrics tracking (success rate, response time, errors)

**Security Audit:**

- [x] SQL injection testing (authentication, streams, admin)
- [x] XSS testing (comments, display names, stored XSS)
- [x] CSRF protection verification
- [x] Authentication & authorization tests (JWT, role-based)
- [x] Rate limiting verification
- [x] Input validation tests
- [x] WebSocket security (IP blocking, message validation)
- [x] Information disclosure checks
- [x] Security checklist documentation
- [x] Automated security test script (Python)
- [x] OWASP dependency check setup

**Documentation:**

- [x] Load testing guide (`tests/README.md`)
- [x] Security checklist (`tests/security/SECURITY_CHECKLIST.md`)
- [x] Test execution instructions
- [x] Performance benchmarks
- [x] Troubleshooting guide

**Location:** `tests/` directory

- `tests/load/` - k6 load testing scripts
- `tests/security/` - Security audit tools and checklist

### Phase 9: Production Deployment

- [x] Environment configuration (.env)
- [x] Nginx SSL/TLS setup (Let's Encrypt)
- [x] Domain configuration
- [x] CDN integration (CloudFlare)
- [x] Backup strategy (database)
- [x] Monitoring setup
  - [x] Prometheus + Grafana
  - [x] Application logs (ELK stack optional)
  - [x] Alerting (email/Slack)
- [x] CI/CD pipeline (GitHub Actions)

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues and questions:

- Create an issue in GitHub repository
  👤 **Email:** cuongcaoleanh@gmail.com
- 👤 **Facebook:** [Anh Cương](https://www.facebook.com/ang.cuong.77)

---
