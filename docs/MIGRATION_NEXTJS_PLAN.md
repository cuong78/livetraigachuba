# KẾ HOẠCH CHI TIẾT CHUYỂN ĐỔI FRONTEND SANG NEXT.JS (APP ROUTER)
**Dự án:** Trại Gà Ba Anh Em (`traigabaanhem.com`)  
**Mục tiêu:** Tối ưu hóa SEO tối đa (Server-Side Rendering & Metadata), cải thiện Core Web Vitals, bảo toàn 100% tính năng Realtime (Livestream HLS, WebSocket Chat, Bộ đếm người xem Redis) và đảm bảo **Zero-Downtime** khi triển khai lên Production.

---

## I. TỔNG QUAN HIỆN TRẠNG & ĐỊNH HƯỚNG

### 1. Hiện trạng (React 18 + Vite SPA)
- **Quy mô code:** ~3,000 dòng TypeScript / TSX.
- **Routing:** 2 route chính (`/` - `ViewerPage.tsx`, `/admin/stream-settings` - `StreamSettingsPage.tsx`).
- **Thành phần Realtime:**
  - `VideoPlayer.tsx`: Dùng `hls.js` chạy stream HLS qua port 8081.
  - `ChatBox.tsx` & `websocket.ts`: Dùng `@stomp/stompjs` + `sockjs-client` kết nối Spring Boot WebSocket `/ws`.
  - Bộ đếm Heartbeat: Dùng `localStorage['device_id']` gửi heartbeat lên Redis.
- **Hạn chế của SPA hiện tại:** Googlebot phải chạy headless browser để parse JS. Thẻ `<head>` hiện tại tĩnh, khó mở rộng khi muốn thêm dynamic metadata theo từng trận xổ gà.

### 2. Định hướng khi sang Next.js (App Router 14/15)
- Dùng **Next.js App Router** (`app/` directory).
- **Server Components:** Render khung trang, toàn bộ thẻ Meta SEO, OpenGraph, JSON-LD Schema trực tiếp từ server ngay trong response HTML đầu tiên (Googlebot nhận HTML hoàn chỉnh 100% trong 50ms).
- **Client Components (`'use client'`):** Bao bọc các module Realtime (`VideoPlayer`, `ChatBox`, `Scoreboard`, `Settings`) để tránh lỗi `window is not defined` và giữ nguyên 100% logic WebSocket/HLS hiện tại.
- **Deployment Mode:** `output: 'standalone'` trong Docker container (chuẩn production của Next.js).

---

## II. BẢN ĐỒ CẤU TRÚC THƯ MỤC DỰ ÁN MỚI

```
livestream-frontend-next/
├── app/
│   ├── layout.tsx                # Server Component: Head, Fonts, Facebook Pixel, Global CSS
│   ├── page.tsx                  # Server Component: SEO Metadata động, fetch stream status server-side
│   ├── robots.ts                 # SEO: Tự động render robots.txt
│   ├── sitemap.ts                # SEO: Tự động render sitemap.xml
│   ├── admin/
│   │   └── stream-settings/
│   │       └── page.tsx          # Client Component: Quản trị luồng & điểm số
│   └── not-found.tsx             # Trang 404 tùy chỉnh
├── components/
│   ├── VideoPlayer.tsx           # 'use client' - dynamic import (ssr: false)
│   ├── ChatBox.tsx               # 'use client' - WebSocket STOMP
│   ├── MatchInfoPanel.tsx        # 'use client'
│   ├── MatchScoreboard.tsx       # 'use client'
│   ├── BlockedIpsModal.tsx       # 'use client'
│   └── LoginModal.tsx            # 'use client'
├── hooks/
│   └── useGeolocation.ts
├── services/
│   ├── api.ts                    # Axios / Fetch client
│   └── websocket.ts              # WebSocket client
├── types/
│   └── index.ts                  # Type definitions
├── public/                       # Favicon, logo, webmanifest, banner
├── next.config.mjs               # Cấu hình standalone & proxy API
└── Dockerfile                    # Multi-stage build cho Next.js standalone
```

---

## III. 4 ĐIỂM KỸ THUẬT QUAN TRỌNG CẦN XỬ LÝ (TRÁNH LỖI)

### 1. `hls.js` và `window is not defined`
`hls.js` chỉ chạy được trong môi trường Browser. Trên Next.js SSR, nếu import trực tiếp sẽ văng lỗi build: `ReferenceError: window is not defined`.
- **Giải pháp:** Sử dụng `next/dynamic` với tùy chọn `ssr: false`:
```tsx
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => <div className="video-loading-placeholder">Đang tải video...</div>
});
```

### 2. WebSocket & SockJS
`sockjs-client` cũng truy cập `window` khi import.
- **Giải pháp:** Đặt `'use client'` ở dòng đầu tiên của `websocket.ts` và `ChatBox.tsx`. Chỉ kích hoạt kết nối WebSocket bên trong `useEffect()` (chỉ chạy ở Client sau khi component đã mount).

### 3. Đọc `localStorage` (Token Admin & DeviceID Heartbeat)
Khi SSR render lần đầu, server không có `localStorage`.
- **Giải pháp:** Bọc các lệnh đọc `localStorage` trong hàm helper an toàn:
```typescript
export const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};
```

### 4. SEO Metadata chuẩn Next.js (Thay thế hoàn toàn thẻ meta trong index.html)
Viết trong `app/layout.tsx` hoặc `app/page.tsx`:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://traigabaanhem.com'),
  title: 'Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp 18h30 Hàng Ngày | traigabaanhem.com',
  description: 'Trại Gà Ba Anh Em - Kênh phát trực tiếp vần xổ gà đòn đỉnh cao lúc 18h30 hàng ngày tại Đắk Lắk. Kết nối đam mê chiến kê, giao lưu chia sẻ kỹ thuật toàn quốc.',
  keywords: [
    // 1. Tên thương hiệu chuẩn & có dấu
    'trại gà ba anh em',
    'trại gà ba anh',
    'trại gà 3 anh em',
    'trại gà 3 anh',
    'trại gà ba anhem',
    'trại gà 3 anhem',
    'trại gà anh em',
    'gà chọi ba anh em',
    'gà chọi 3 anh em',
    'gà chọi ba anh',
    'gà đòn ba anh em',
    'gà đòn 3 anh em',

    // 2. Tên thương hiệu không dấu (người dùng hay gõ tắt / mobile)
    'trai ga ba anh em',
    'trai ga ba anh',
    'trai ga 3 anh em',
    'trai ga 3 anh',
    'trai ga ba anhem',
    'trai ga 3 anhem',
    'trai ga anh em',
    'ga choi ba anh em',
    'ga choi 3 anh em',
    'ga choi ba anh',
    'ga don ba anh em',
    'ga don 3 anh em',

    // 3. Viết liền không dấu / Domain / Slugs
    'traigabaanhem',
    'traigabaanh',
    'traiga3anhem',
    'traiga3anh',
    'traigaanhem',
    'traigabaanhem.com',
    'www.traigabaanhem.com',
    'traiga ba anh em',
    'traiga 3 anh em',

    // 4. Hoạt động & Dịch vụ cốt lõi (Có dấu & Không dấu)
    'xổ gà trực tiếp',
    'xo ga truc tiep',
    'trực tiếp xổ gà',
    'truc tiep xo ga',
    'vần xổ gà',
    'van xo ga',
    'vần gà trực tiếp',
    'van ga truc tiep',
    'xổ gà 18h30',
    'xo ga 18h30',
    'video xổ gà',
    'video xo ga',
    'giao lưu gà chọi',
    'giao luu ga choi',
    'đá gà đòn',
    'da ga don',

    // 5. Địa phương & Chủ trại
    'trại gà đắk lắk',
    'trai ga dak lak',
    'gà đòn đắk lắk',
    'ga don dak lak',
    'trại gà tây hòa đắk lắk',
    'trần văn thinh',
    'tran van thinh'
  ],
  openGraph: {
    title: 'Trại Gà Ba Anh Em - Xổ Gà Trực Tiếp 18h30 Hàng Ngày',
    description: 'Trại Gà Ba Anh Em - Kênh phát trực tiếp vần xổ gà đòn đỉnh cao lúc 18h30 hàng ngày tại Đắk Lắk.',
    url: 'https://traigabaanhem.com',
    siteName: 'Trại Gà Ba Anh Em',
    images: [{ url: 'https://res.cloudinary.com/.../banner.webp', width: 1200, height: 630 }],
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: {
    canonical: 'https://traigabaanhem.com',
  },
};
```

---

## IV. QUY TRÌNH THỰC HIỆN TỪ LOCAL ĐẾN PRODUCTION

### Giai đoạn 1: Triển khai & Kiểm thử trên Local của Anh
*(Hoàn toàn độc lập, không chạm vào server Production)*

1. **Tạo nhánh Git mới từ repository:**
   ```bash
   git checkout -b feature/migrate-nextjs
   ```

2. **Khởi tạo project Next.js:**
   - Cài đặt Next.js 14 (App Router, TypeScript, Tailwind hoặc CSS Modules tùy chọn).
   - Copy toàn bộ assets ảnh, icons từ `public/` cũ sang `public/` mới.
   - Copy các components: `ChatBox`, `VideoPlayer`, `MatchScoreboard`, `ViewerPage`.
   - Chuyển `index.css` và CSS files vào project.

3. **Cấu hình Reverse Proxy trong `next.config.mjs` để test local:**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
     async rewrites() {
       return [
         {
           source: '/api/:path*',
           destination: 'https://traigabaanhem.com/api/:path*', // Trỏ tạm về API backend prod để test
         },
       ];
     },
   };
   export default nextConfig;
   ```

4. **Kiểm tra 5 bài test tại Local:**
   - [ ] Trang chủ `/` render SSR hiển thị đầy đủ HTML khi xem `View Page Source` (Ctrl+U).
   - [ ] Thẻ Meta, OpenGraph, JSON-LD Schema xuất hiện đầy đủ trong mã nguồn HTML.
   - [ ] Video stream HLS phát mượt mà, đổi luồng dự phòng hoạt động bình thường.
   - [ ] Chatbox kết nối WebSocket, gửi nhận tin nhắn và đếm người xem thời gian thực ổn định.
   - [ ] Trang quản trị `/admin/stream-settings` đăng nhập và lưu cài đặt thành công.

5. **Commit và đẩy nhánh lên GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete nextjs migration with SSR and realtime support"
   git push origin feature/migrate-nextjs
   ```

---

### Giai đoạn 2: Đưa lên Production (Zero-Downtime Rollout)

1. **Chuẩn bị Dockerfile Multi-Stage cho Next.js:**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   ENV PORT=3000
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Quy trình chuyển đổi an toàn trên Server Production:**
   - Kéo nhánh `feature/migrate-nextjs` về server.
   - Build container Next.js mới dưới tên `livestream-frontend-next` chạy trên port nội bộ `3001`.
   - Kiểm tra health-check `curl http://localhost:3001` xem HTML trả về chuẩn SSR chưa.
   - Khi container Next.js đã chạy ổn định 100%: Cập nhật cấu hình Nginx upstream trỏ sang container mới và `nginx -s reload`.
   - **Thời gian downtime:** **0 giây**.

3. **Phương án Rollback dự phòng (Kế hoạch B trong 30 giây):**
   - Container cũ (`livestream-frontend` Nginx static) vẫn được giữ nguyên ở chế độ chờ.
   - Nếu container Next.js gặp bất kỳ sự cố nào, chỉ cần đổi lại port trong Nginx config về container cũ và reload Nginx trong 30 giây là hệ thống trở lại bình thường.

---

## V. TIẾN ĐỘ DỰ KIẾN
- **Bước 1 (Anh thực hiện ở local):** Clone code, tạo nhánh, dựng Next.js theo tài liệu hướng dẫn trên.
- **Bước 2 (Kiểm thử chức năng):** Test livestream, chat, admin tại local.
- **Bước 3 (Review & Phối hợp):** Khi anh đẩy nhánh lên GitHub, em sẽ review toàn bộ code, tối ưu cấu hình Docker và hỗ trợ anh deploy an toàn tuyệt đối lên Production.

