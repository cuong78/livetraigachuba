#!/usr/bin/env python3
"""
Setup Brand Script for Livestream Platform
Automates rebranding, SEO metadata, contact info, bank details, and Nginx config
when cloning or setting up this platform for a new client / farm.
"""

import os
import sys
import json
import re
import unicodedata
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
NEXT_DIR = BASE_DIR / "livestream-frontend-next"

def strip_accents(s: str) -> str:
    """Remove Vietnamese diacritics."""
    s = s.replace("đ", "d").replace("Đ", "D")
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )

def generate_keywords(brand_name: str, domain: str, province: str = "") -> list:
    """Generate 5 comprehensive keyword groups for the new brand."""
    b_lower = brand_name.lower().strip()
    b_nodot = strip_accents(b_lower)
    b_nospace = re.sub(r"\s+", "", b_nodot)
    
    keywords = [
        # Group 1: Vietnamese with accents
        b_lower,
        f"gà đòn {b_lower.replace('trại gà ', '')}",
        f"gà chọi {b_lower.replace('trại gà ', '')}",
        
        # Group 2: Unaccented
        b_nodot,
        f"ga don {b_nodot.replace('trai ga ', '')}",
        f"ga choi {b_nodot.replace('trai ga ', '')}",
        
        # Group 3: Connected & Domain
        b_nospace,
        domain.lower(),
        f"www.{domain.lower()}",
        
        # Group 4: Livestream / industry terms
        "xổ gà trực tiếp",
        "xo ga truc tiep",
        "trực tiếp xổ gà",
        "vần xổ gà đòn",
        "giao lưu gà chọi",
        "đá gà đòn",
    ]
    
    if province:
        prov_nodot = strip_accents(province.lower())
        keywords.extend([
            f"gà đòn {province.lower()}",
            f"ga don {prov_nodot}",
            f"trại gà {province.lower()}",
        ])
        
    # Deduplicate while preserving order
    seen = set()
    result = []
    for k in keywords:
        if k not in seen:
            seen.add(k)
            result.append(k)
            
    return result

def main():
    print("=" * 60)
    print("🐔 HỆ THỐNG THIẾT LẬP THƯƠNG HIỆU LIVESTREAM MỚI")
    print("=" * 60)
    
    config_file = None
    if len(sys.argv) > 1:
        if sys.argv[1].endswith(".json") and os.path.isfile(sys.argv[1]):
            config_file = sys.argv[1]

    if config_file:
        with open(config_file, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        print(f"[*] Đang nạp cấu hình từ file: {config_file}")
    else:
        print("\nVui lòng nhập thông tin cho trại gà mới (nhấn Enter để dùng mặc định nếu có):")
        brand_name = input("1. Tên trại / Thương hiệu [Trại Gà Ba Anh Em]: ").strip() or "Trại Gà Ba Anh Em"
        domain = input("2. Tên miền chính thức [traigabaanhem.com]: ").strip() or "traigabaanhem.com"
        domain = domain.replace("https://", "").replace("http://", "").strip("/")
        
        hotline = input("3. Hotline / Số Zalo [0931607907]: ").strip() or "0931607907"
        hotline_clean = re.sub(r"\D", "", hotline)
        
        schedule = input("4. Lịch trực tiếp [18h30 hàng ngày]: ").strip() or "18h30 hàng ngày"
        
        bank_name = input("5. Tên ngân hàng [VietinBank]: ").strip() or "VietinBank"
        bank_account = input("6. Số tài khoản ngân hàng [0799 478 478]: ").strip() or "0799 478 478"
        bank_holder = input("7. Tên chủ tài khoản [TRẦN VĂN THINH]: ").strip().upper() or "TRẦN VĂN THINH"
        
        address = input("8. Địa chỉ trại gà [Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk]: ").strip() or "Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk"
        maps_url = input("9. Link Google Maps: ").strip() or "https://maps.app.goo.gl/8vTyBLXugZdLrFSP8"
        province = input("10. Tỉnh / Thành phố [Đắk Lắk]: ").strip() or "Đắk Lắk"

        cfg = {
            "brand_name": brand_name,
            "domain": domain,
            "hotline": hotline,
            "hotline_clean": hotline_clean,
            "schedule": schedule,
            "bank_name": bank_name,
            "bank_account": bank_account,
            "bank_holder": bank_holder,
            "address": address,
            "maps_url": maps_url,
            "province": province
        }

    # Process updates
    brand_name = cfg["brand_name"]
    domain = cfg["domain"]
    hotline = cfg["hotline"]
    hotline_clean = re.sub(r"\D", "", cfg.get("hotline_clean", hotline))
    schedule = cfg.get("schedule", "18h30 hàng ngày")
    bank_name = cfg.get("bank_name", "VietinBank")
    bank_account = cfg.get("bank_account", "0799 478 478")
    bank_holder = cfg.get("bank_holder", "TRẦN VĂN THINH")
    address = cfg.get("address", "Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk")
    province = cfg.get("province", "Đắk Lắk")

    print("\n[*] Đang cập nhật codebase...")

    # 1. Update .env
    env_file = BASE_DIR / ".env"
    if env_file.exists():
        content = env_file.read_text(encoding="utf-8")
        content = re.sub(r"VITE_HLS_BASE_URL=.*", f"VITE_HLS_BASE_URL=https://{domain}/live", content)
        env_file.write_text(content, encoding="utf-8")
        print("  ✓ Đã cập nhật .env")

    # 2. Update layout.tsx
    layout_file = NEXT_DIR / "app" / "layout.tsx"
    if layout_file.exists():
        text = layout_file.read_text(encoding="utf-8")
        
        # Title
        new_title = f"{brand_name} - Xổ Gà Trực Tiếp {schedule.capitalize()} | {domain}"
        text = re.sub(r'title:\s*"[^"]*"', f'title: "{new_title}"', text)
        
        # Description
        new_desc = f"{brand_name} - Kênh phát trực tiếp vần xổ gà đòn đỉnh cao lúc {schedule} tại {province}. Kết nối đam mê chiến kê, giao lưu chia sẻ kỹ thuật toàn quốc."
        text = re.sub(r'description:\s*\n\s*"[^"]*"', f'description:\n    "{new_desc}"', text)
        
        # metadataBase
        text = re.sub(r'metadataBase:\s*new URL\("https://[^"]*"\)', f'metadataBase: new URL("https://{domain}")', text)
        
        # Canonical & OpenGraph url
        text = re.sub(r'url:\s*"https://[^"]*"', f'url: "https://{domain}"', text)
        text = re.sub(r'href="https://[^"]*"', f'href="https://{domain}"', text)
        
        # Keywords
        kws = generate_keywords(brand_name, domain, province)
        kw_json = json.dumps(kws, ensure_ascii=False, indent=4)
        kw_str = "keywords: " + kw_json + ","
        text = re.sub(r'keywords:\s*\[[\s\S]*?\],', kw_str, text)
        
        layout_file.write_text(text, encoding="utf-8")
        print("  ✓ Đã cập nhật livestream-frontend-next/app/layout.tsx (SEO Metadata & Keywords)")

    # 3. Update ChatBox.tsx
    chatbox_file = NEXT_DIR / "components" / "ChatBox.tsx"
    if chatbox_file.exists():
        text = chatbox_file.read_text(encoding="utf-8")
        text = re.sub(r'href="tel:\d+"', f'href="tel:{hotline_clean}"', text)
        text = re.sub(r'title="Gọi Hotline: \d+"', f'title="Gọi Hotline: {hotline_clean}"', text)
        text = re.sub(r'<span className="phone-num">\d+</span>', f'<span className="phone-num">{hotline}</span>', text)
        text = re.sub(r'href="https://zalo\.me/\d+"', f'href="https://zalo.me/{hotline_clean}"', text)
        chatbox_file.write_text(text, encoding="utf-8")
        print("  ✓ Đã cập nhật Hotline & Zalo trong ChatBox.tsx")

    # 4. Update robots.txt & sitemap.xml
    robots_file = NEXT_DIR / "public" / "robots.txt"
    if robots_file.exists():
        r_text = robots_file.read_text(encoding="utf-8")
        r_text = re.sub(r"Sitemap: https://[^/]+/sitemap\.xml", f"Sitemap: https://{domain}/sitemap.xml", r_text)
        robots_file.write_text(r_text, encoding="utf-8")
        print("  ✓ Đã cập nhật public/robots.txt")

    sitemap_file = NEXT_DIR / "public" / "sitemap.xml"
    if sitemap_file.exists():
        s_text = sitemap_file.read_text(encoding="utf-8")
        s_text = re.sub(r"<loc>https://[^<]+</loc>", f"<loc>https://{domain}/</loc>", s_text)
        sitemap_file.write_text(s_text, encoding="utf-8")
        print("  ✓ Đã cập nhật public/sitemap.xml")

    # 5. Generate Nginx template
    nginx_conf_path = BASE_DIR / f"nginx-{domain}.conf"
    nginx_template = f"""server {{
    server_name {domain} www.{domain};
    client_max_body_size 500M;

    # Frontend (Next.js SSR)
    location / {{
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }}

    # Backend REST API
    location /api {{
        proxy_pass http://localhost:8080/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }}

    # WebSocket for real-time chat & viewer count
    location /ws {{
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }}

    # HLS live streaming (.m3u8 và .ts)
    location /live {{
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 60s;
    }}

    # Video recordings (MP4)
    location /videos {{
        proxy_pass http://localhost:8081/videos;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }}
}}
"""
    nginx_conf_path.write_text(nginx_template, encoding="utf-8")
    print(f"  ✓ Đã sinh file cấu hình Nginx mẫu tại: {nginx_conf_path}")

    print("\n" + "=" * 60)
    print("✅ ĐÃ ÁP DỤNG THÔNG TIN THƯƠNG HIỆU MỚI THÀNH CÔNG!")
    print("=" * 60)
    print(f"\nCác bước tiếp theo:")
    print(f"1. Kích hoạt Nginx trên VPS:")
    print(f"   sudo cp {nginx_conf_path} /etc/nginx/sites-available/{domain}")
    print(f"   sudo ln -s /etc/nginx/sites-available/{domain} /etc/nginx/sites-enabled/")
    print(f"   sudo nginx -t && sudo systemctl reload nginx")
    print(f"   sudo certbot --nginx -d {domain} -d www.{domain} --non-interactive --agree-tos -m admin@{domain}")
    print(f"\n2. Rebuild & Deploy Next.js (Chỉ mất ~4 giây nhờ BuildKit cache):")
    print(f"   cd {BASE_DIR}")
    print(f"   DOCKER_BUILDKIT=1 docker build -t livestream-frontend-next:local ./livestream-frontend-next")
    print(f"   docker rm -f livestream-frontend-next")
    print(f"   docker run -d --name livestream-frontend-next --restart always \\")
    print(f"     --network livetraigachuba_livestream-network -p 3001:3000 \\")
    print(f"     -e BACKEND_API_URL=http://livestream-backend:8080 \\")
    print(f"     livestream-frontend-next:local")
    print(f"\n3. Cấu hình Cloudflare theo hướng dẫn tại docs/CLOUDFLARE_OPTIMIZATION_GUIDE.md")

if __name__ == "__main__":
    main()
