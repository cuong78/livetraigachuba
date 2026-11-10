import { Link } from "react-router-dom";
import "./LienHePage.css";

function LienHePage() {
  return (
    <div className="lien-he-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img
              src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp"
              alt="Logo Trại Gà Ba Anh Em"
              className="header-logo"
            />
            <div className="header-text">
              <h1>Trại Gà Ba Anh Em</h1>
              <p className="header-subtitle">
                Kích vào trang chủ để xem video trực tiếp
              </p>
            </div>
          </Link>
        </div>
        <nav className="main-nav">
          <Link to="/">Trang chủ</Link>
          <Link to="/gioi-thieu">Giới thiệu</Link>
          <Link to="/quy-dinh">Quy định</Link>
          <Link to="/lien-he" className="active">
            Liên hệ
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>📞 Liên Hệ Với Chúng Tôi</h1>
          <p>Sẵn sàng hỗ trợ anh em 24/7</p>
        </div>
      </section>

      {/* Contact Content */}
      <main className="contact-content">
        {/* Main Contact Info */}
        <section className="contact-main">
          <div className="contact-card hotline">
            <div className="card-icon">📞</div>
            <h2>Hotline / Zalo</h2>
            <a href="tel:0931607907" className="phone-number">
              0931607907
            </a>
            <p>Gọi điện hoặc nhắn Zalo để được tư vấn nhanh nhất</p>
            <a
              href="https://zalo.me/0931607907"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-contact btn-zalo"
            >
              💬 Nhắn Zalo Ngay
            </a>
          </div>

          <div className="contact-card address">
            <div className="card-icon">📍</div>
            <h2>Địa Chỉ</h2>
            <p className="address-text">
              <strong>Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk</strong>
            </p>
            <p>Anh em có thể đến trực tiếp xem gà và giao lưu</p>
            <a
              href="https://maps.app.goo.gl/8vTyBLXugZdLrFSP8"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-contact btn-map"
              title="Xem bản đồ và chỉ đường trên Google Maps"
            >
              🗺️ Chỉ Đường Google Maps
            </a>
          </div>

          <div className="contact-card schedule">
            <div className="card-icon">⏰</div>
            <h2>Lịch Livestream</h2>
            <div className="schedule-time">
              <span className="time">18h30</span>
              <span className="period">Hàng Ngày</span>
            </div>
            <p>Vần xổ gà trực tiếp mỗi ngày</p>
            <Link to="/" className="btn-contact btn-watch">
              ▶️ Xem Ngay
            </Link>
          </div>
        </section>

        {/* Social Links */}
        <section className="social-section">
          <h2>🌐 Kết Nối Mạng Xã Hội</h2>
          <div className="social-grid">
            <a
              href="https://zalo.me/0931607907"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card zalo"
            >
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765771851/zalo1_fwawgm.png"
                alt="Zalo"
                className="social-icon"
              />
              <div className="social-info">
                <h3>Zalo Ba Anh Em</h3>
                <p>Kết bạn để giao lưu mua bán</p>
              </div>
            </a>

            <a
              href="https://zalo.me/0931607907"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card zalo-group"
            >
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765771858/zalo-vip-1_yx9lgh.png"
                alt="Nhóm Zalo VIP"
                className="social-icon"
              />
              <div className="social-info">
                <h3>Zalo Trại Gà</h3>
                <p>Liên hệ Zalo 0931607907 tuyển gà chiến</p>
              </div>
            </a>

            <a
              href="https://www.facebook.com/tien.hangvan.5"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card facebook"
            >
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765771846/fb-1_xfr0sa.png"
                alt="Facebook"
                className="social-icon"
              />
              <div className="social-info">
                <h3>Facebook Trại Gà</h3>
                <p>Theo dõi để nhận thông báo mới</p>
              </div>
            </a>
          </div>
        </section>

        {/* Bank Info */}
        <section className="bank-section">
          <h2>💳 Thông Tin Chuyển Khoản</h2>
          <div className="bank-card">
            <div className="bank-logo">
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794298077/Logo-VietinBank-CTG-Ori_pbtmat.webp"
                alt="VietinBank"
                style={{ height: "36px", objectFit: "contain", background: "#fff", padding: "4px 8px", borderRadius: "6px" }}
              />
            </div>
            <div className="bank-info">
              <p className="bank-name">VietinBank (Ngân Hàng Công Thương)</p>
              <p className="account-number">0799 478 478</p>
              <p className="account-holder">Trần Văn Thinh</p>
            </div>
            <button
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText("0799478478");
                alert("Đã sao chép số tài khoản VietinBank: 0799 478 478!");
              }}
            >
              📋 Sao Chép STK
            </button>
          </div>
          <p className="bank-note">
            * Nội dung chuyển khoản ghi: [Tên] + [SĐT] + [Nội dung giao dịch]
          </p>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <h2>❓ Câu Hỏi Thường Gặp</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Làm sao để mua gà?</h3>
              <p>
                Anh em liên hệ trực tiếp qua Zalo 0931607907 để được tư vấn và
                xem gà. Hỗ trợ giao gà đi các tỉnh.
              </p>
            </div>
            <div className="faq-item">
              <h3>Livestream lúc mấy giờ?</h3>
              <p>
                Vần xổ gà trực tiếp lúc 18h30 hàng ngày. Anh em vào trang chủ để
                xem.
              </p>
            </div>
            <div className="faq-item">
              <h3>Có ship gà đi tỉnh không?</h3>
              <p>
                Có, chúng tôi hỗ trợ giao gà đi các tỉnh. Chi phí vận chuyển
                theo thỏa thuận.
              </p>
            </div>
            <div className="faq-item">
              <h3>Làm sao tham gia nhóm Zalo VIP?</h3>
              <p>
                Click vào nút "Nhóm Zalo VIP" ở trên hoặc liên hệ hotline để
                được thêm vào nhóm.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Liên Hệ Ngay Hôm Nay!</h2>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ anh em</p>
          <div className="cta-buttons">
            <a href="tel:0931607907" className="btn-call">
              📞 Gọi Ngay: 0931607907
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p>
          © 2026 Trại Gà Ba Anh Em
        </p>
        <p>
          Hotline/Zalo: <a href="tel:0931607907">0931607907</a>
        </p>
      </footer>
    </div>
  );
}

export default LienHePage;
