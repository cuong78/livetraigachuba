"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";
import LoginModal from "@/components/LoginModal";
import BlockedIpsModal from "@/components/BlockedIpsModal";
import MatchScoreboard from "@/components/MatchScoreboard";
import MatchInfoPanel from "@/components/MatchInfoPanel";
import api, {
  streamApi,
  recordingApi,
  authApi,
  checkTokenAndLogout,
  getStorageItem,
  setStorageItem,
} from "@/services/api";
import { websocketService } from "@/services/websocket";
import type { Stream, Comment, DailyRecording } from "@/types";
import "./ViewerPage.css";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div
      className="video-loading-placeholder"
      style={{
        minHeight: "260px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
      }}
    >
      Đang tải video...
    </div>
  ),
});

interface ViewerPageClientProps {
  initialStream?: Stream | null;
  initialRecordings?: DailyRecording[];
}

const ViewerPageClient: React.FC<ViewerPageClientProps> = ({
  initialStream = null,
  initialRecordings = [],
}) => {
  const [stream, setStream] = useState<Stream | null>(initialStream);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBlockedIpsModal, setShowBlockedIpsModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [realViewerCount, setRealViewerCount] = useState(0);
  const [recordings, setRecordings] = useState<DailyRecording[]>(initialRecordings);
  const [selectedVideo, setSelectedVideo] = useState<DailyRecording | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  useEffect(() => {
    // Check if admin already logged in AND token is still valid
    const isValid = checkTokenAndLogout();
    const user = getStorageItem("admin_user");
    if (isValid && user) {
      try {
        setIsAdmin(true);
        setAdminUser(JSON.parse(user));
      } catch {
        setIsAdmin(false);
        setAdminUser(null);
      }
    } else {
      setIsAdmin(false);
      setAdminUser(null);
    }

    // Fetch current stream if not provided or to refresh
    const fetchStream = async () => {
      try {
        const currentStream = await streamApi.getCurrentStream();
        setStream(currentStream);
      } catch (err) {
        console.warn("Could not fetch current stream, showing offline cover placeholder", err);
      }
    };

    if (!initialStream) {
      fetchStream();
    }

    // Connect WebSocket for real-time comments
    websocketService.connect(
      (comment) => {
        setComments((prev) => [...prev, comment]);
      },
      (historyComments) => {
        console.log("Received comments history:", historyComments.length);
        setComments(historyComments);
      },
      (count) => {
        setRealViewerCount(count);
      },
      (deletedComment) => {
        setComments((prev) =>
          prev.filter(
            (c) =>
              c.displayName !== deletedComment.displayName ||
              c.createdAt !== deletedComment.createdAt
          )
        );
      }
    );

    return () => {
      websocketService.disconnect();
    };
  }, [initialStream]);

  // Cập nhật viewer count khi có thay đổi về stream status hoặc real viewer count
  useEffect(() => {
    const calculateViewerCount = () => {
      if (stream?.status === "LIVE") {
        const effectiveReal = Math.max(1, realViewerCount);
        return effectiveReal + 379;
      } else {
        return realViewerCount;
      }
    };

    const timer = setTimeout(() => {
      setViewerCount(calculateViewerCount());
    }, 1000);

    return () => clearTimeout(timer);
  }, [stream?.status, realViewerCount]);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const data = await recordingApi.getRecentRecordings();
        setRecordings(data);
      } catch (err) {
        console.error("Failed to fetch recordings:", err);
      }
    };
    if (initialRecordings.length === 0) {
      fetchRecordings();
    }
  }, [initialRecordings.length]);

  const handleSendComment = (comment: Comment) => {
    websocketService.sendComment(comment);
  };

  const handleDeleteComment = (comment: Comment) => {
    websocketService.deleteComment(comment);
  };

  const handleBlockIp = async (ipAddress: string) => {
    if (!adminUser) return;

    try {
      const response = await api.post(
        `/admin/blocked-ips/block?ipAddress=${ipAddress}&reason=Admin blocked&adminUsername=${adminUser.username}`
      );

      if (response.status === 200) {
        alert(`IP ${ipAddress} đã được chặn thành công!`);
      }
    } catch (err: any) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        alert("Không thể kết nối đến server");
      }
    }
  };

  const copyBankAccount = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("0799478478");
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  const handleLoginSuccess = (token: string, user: any) => {
    setStorageItem("admin_token", token);
    setStorageItem("admin_user", JSON.stringify(user));
    setIsAdmin(true);
    setAdminUser(user);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsAdmin(false);
    setAdminUser(null);
  };

  // Admin: Trigger merge for today's recordings
  const handleMergeToday = async () => {
    if (!isAdmin || isMerging) return;

    const today = new Date().toISOString().split("T")[0];
    const confirmMerge = window.confirm(
      `Bạn có muốn upload video ngày ${getCurrentDate()} lên hệ thống không?\n\nLưu ý: Quá trình này sẽ gộp tất cả các đoạn video đã ghi trong ngày.`
    );

    if (!confirmMerge) return;

    setIsMerging(true);
    try {
      const result = await recordingApi.triggerMerge(today);
      if (result.success) {
        alert(
          '✅ Đang xử lý video! Video sẽ xuất hiện trong phần "Video Xem Lại" sau vài phút.'
        );
        setTimeout(async () => {
          const data = await recordingApi.getRecentRecordings();
          setRecordings(data);
        }, 5000);
      } else {
        alert("❌ " + result.message);
      }
    } catch (err: any) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        alert(
          "❌ Lỗi: " + (err.response?.data?.message || "Không thể xử lý video")
        );
      }
    } finally {
      setIsMerging(false);
    }
  };

  // Admin: Delete recording by date
  const handleDeleteRecording = async (date: string) => {
    if (!isAdmin) return;

    const formattedDate = formatRecordingDate(date);
    const confirmDelete = window.confirm(
      `⚠️ Bạn có chắc muốn XÓA video ngày ${formattedDate}?\n\nHành động này không thể hoàn tác!`
    );

    if (!confirmDelete) return;

    try {
      const result = await recordingApi.deleteRecording(date);
      if (result.success) {
        alert("✅ Đã xóa video thành công!");
        const data = await recordingApi.getRecentRecordings();
        setRecordings(data);
      } else {
        alert("❌ " + result.message);
      }
    } catch (err: any) {
      alert(
        "❌ Lỗi: " + (err.response?.data?.message || "Không thể xóa video")
      );
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatRecordingDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="viewer-page">
      {/* Header with Logo */}
      <header className="site-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp"
                alt="Trại Gà Ba Anh Em"
                className="logo"
              />
            </div>

            <div className="site-title">
              <h1>Trại Gà Ba Anh Em</h1>
              <p className="subtitle">Tinh Hoa Việt</p>
            </div>

            <div className="header-right">
              {isAdmin ? (
                <div className="admin-info">
                  <span className="admin-badge">👑 {adminUser?.username}</span>
                  <button
                    className="btn-blocked-ips"
                    onClick={() => setShowBlockedIpsModal(true)}
                    title="Quản lý IP đã chặn"
                  >
                    🚫 IP
                  </button>
                  <button className="btn-logout" onClick={handleLogout}>
                    Thoát
                  </button>
                </div>
              ) : (
                <button
                  className="btn-login"
                  onClick={() => setShowLoginModal(true)}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="main-nav">
        <div className="container">
          <button onClick={() => setShowIntro(true)} className="nav-link">
            Giới thiệu
          </button>
          <button onClick={() => setShowRules(true)} className="nav-link">
            Nội Quy Xổ Gà
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Main Content Grid */}
        <div className="main-content">
          {/* Video Player Section */}
          <div className="video-section">
            {/* Match Scoreboard Overlay */}
            {websocketService.getStompClient() && (
              <MatchScoreboard
                stompClient={websocketService.getStompClient()}
              />
            )}

            {stream && stream.status === "LIVE" ? (
              <VideoPlayer hlsUrl={stream.hlsUrl} />
            ) : (
              <div className="video-placeholder">
                <img
                  src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794207357/Gemini_Generated_Image_of30onof30onof30_pqgmxe.webp"
                  alt="Trại Gà Ba Anh Em - Xem Live Trực Tiếp"
                  className="cover-image"
                />
                <div className="play-button-overlay">
                  <div className="play-button-circle">
                    <svg width="50" height="50" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="38" strokeWidth="4" />
                      <path d="M32 25L55 40L32 55V25Z" fill="white" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Banner */}
            <div className="warning-banner">
              <span className="warning-icon">⛔</span>
              <span>CẤM CÁ CƯỢC, CHỬI THỀ</span>
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <ChatBox
              comments={comments}
              onSendComment={handleSendComment}
              viewerCount={viewerCount}
              isAdmin={isAdmin}
              adminUsername={adminUser?.username || null}
              onDeleteComment={handleDeleteComment}
              onBlockIp={handleBlockIp}
            />
          </div>
        </div>

        {/* Match Info Panel - Only visible for Admin */}
        {isAdmin && websocketService.getStompClient() && (
          <div className="match-info-section">
            <MatchInfoPanel stompClient={websocketService.getStompClient()} />
          </div>
        )}

        {/* Contact & Community Section */}
        <section className="contact-section">
          <div className="section-header-block">
            <span className="section-kicker">KẾT NỐI & GIAO LƯU</span>
            <h2 className="section-title-modern">Kết Nối Đam Mê</h2>
            <p className="section-subtitle-modern">
              Trại Gà Ba Anh Em — Sân chơi vần xổ, giao lưu chia sẻ đam mê gà đòn đỉnh cao
            </p>
          </div>

          <div className="contact-grid-modern">
            <div className="contact-highlight-card">
              <div className="card-badge">HOTLINE TRỰC TIẾP 24/7</div>
              <div className="phone-hero">
                <a href="tel:0931607907" className="phone-number-modern">
                  0931 607 907
                </a>
                <span className="phone-hint">Bấm để gọi điện hoặc kết bạn Zalo tư vấn</span>
              </div>
              <div className="cta-action-row">
                <a href="tel:0931607907" className="btn-cta-primary">
                  <span className="btn-icon">📞</span>
                  <span>Gọi Ngay</span>
                </a>
                <a
                  href="https://zalo.me/0931607907"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta-zalo"
                >
                  <span className="btn-icon">💬</span>
                  <span>Nhắn Zalo</span>
                </a>
              </div>
            </div>

            <div className="community-card-group">
              <a
                href="https://zalo.me/0931607907"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-tile channel-zalo"
              >
                <div className="channel-icon-wrap">
                  <span className="channel-icon">⚡</span>
                </div>
                <div className="channel-info">
                  <h4>Nhóm Zalo VIP Tuyển Chọn</h4>
                  <p>Xem trước video, hình ảnh & bảng giá chiến kê hàng ngày</p>
                </div>
                <span className="channel-arrow">→</span>
              </a>

              <a
                href="https://www.facebook.com/tien.hangvan.5"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-tile channel-fb"
              >
                <div className="channel-icon-wrap">
                  <span className="channel-icon">📘</span>
                </div>
                <div className="channel-info">
                  <h4>Facebook Trại Gà Ba Anh Em</h4>
                  <p>Kết nối & giao lưu trực tiếp cùng chủ trại Trần Văn Thinh</p>
                </div>
                <span className="channel-arrow">→</span>
              </a>

              <a
                href="https://maps.app.goo.gl/8vTyBLXugZdLrFSP8"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-tile channel-location"
                title="Bấm để xem vị trí & chỉ đường tới Trại Gà trên Google Maps"
              >
                <div className="channel-icon-wrap">
                  <span className="channel-icon">📍</span>
                </div>
                <div className="channel-info">
                  <h4>Địa Chỉ Trại Gà</h4>
                  <p>Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk (Mở Bản Đồ)</p>
                </div>
                <span className="channel-arrow">→</span>
              </a>
            </div>
          </div>

          <div className="quick-nav-row">
            <button onClick={() => setShowIntro(true)} className="btn-subnav-pill">
              ℹ️ Giới Thiệu Về Trại
            </button>
            <button onClick={() => setShowRules(true)} className="btn-subnav-pill">
              📋 Nội Quy Xổ Gà
            </button>
          </div>
        </section>

        {/* Bank Info Section - Luxury Digital Bank Card */}
        <section className="bank-section">
          <div className="section-header-block">
            <span className="section-kicker">GIAO DỊCH CHÍNH CHỦ</span>
            <h2 className="section-title-modern">Thông Tin Chuyển Khoản</h2>
          </div>

          <div className="bank-card-container">
            <div className="vip-bank-card">
              <div className="card-top-row">
                <div className="bank-brand">
                  <img
                    src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794298077/Logo-VietinBank-CTG-Ori_pbtmat.webp"
                    alt="VietinBank"
                    className="vietin-card-logo"
                  />
                  <div className="bank-brand-text">
                    <strong>VIETINBANK</strong>
                    <span>NGÂN HÀNG CÔNG THƯƠNG</span>
                  </div>
                </div>
                <div className="card-chip-wrap">
                  <span className="card-chip"></span>
                  <span className="contactless-icon">📡</span>
                </div>
              </div>

              <div className="card-number-row">
                <span className="card-label">SỐ TÀI KHOẢN</span>
                <div className="account-number-display">
                  <span>0799</span>
                  <span>478</span>
                  <span>478</span>
                </div>
              </div>

              <div className="card-bottom-row">
                <div className="holder-block">
                  <span className="card-label">CHỦ TÀI KHOẢN</span>
                  <span className="holder-name">TRẦN VĂN THINH</span>
                </div>
                <button
                  className={`btn-copy-account ${copiedBank ? "is-copied" : ""}`}
                  onClick={copyBankAccount}
                >
                  {copiedBank ? "✅ Đã sao chép" : "📋 Sao chép STK"}
                </button>
              </div>
            </div>
            <p className="bank-transfer-hint">
              * Quý khách chuyển khoản vui lòng ghi rõ nội dung: <strong>[Họ tên] + [Số điện thoại]</strong> để được xác nhận nhanh nhất.
            </p>
          </div>
        </section>

        {/* Video Archive Section */}
        <section className="video-archive">
          <div className="section-header-block">
            <span className="section-kicker">KHO VIDEO TƯ LIỆU</span>
            <h2 className="section-title-modern">
              <span className="play-icon-glow">▶</span> Video Xem Lại
            </h2>
            <p className="section-subtitle-modern">
              Nơi lưu trữ các video vần xổ gà chọi Trại Gà Ba Anh (Trại Gà Ba Anh Em) được quay trực tiếp hàng ngày lúc 18h30 tại Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk
            </p>
          </div>

          {/* Admin: Upload Video Button */}
          {isAdmin && (
            <div className="admin-video-controls">
              <button
                className="btn-upload-video"
                onClick={handleMergeToday}
                title="Upload video hôm nay lên hệ thống"
                disabled={isMerging}
              >
                {isMerging ? "⏳ Đang xử lý video..." : `📤 Upload Video Hôm Nay (${getCurrentDate()})`}
              </button>
            </div>
          )}

          <div className="video-grid-modern">
            {recordings.length > 0 ? (
              recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="video-item-card"
                  onClick={() => setSelectedVideo(recording)}
                >
                  <div className="video-thumb-wrap">
                    <img
                      src={
                        recording.thumbnailUrl ||
                        "https://res.cloudinary.com/duklfdbqf/image/upload/v1794207357/Gemini_Generated_Image_of30onof30onof30_pqgmxe.webp"
                      }
                      alt={recording.title}
                      className="video-thumb-img"
                      loading="lazy"
                    />
                    <div className="video-thumb-scrim"></div>
                    <div className="video-play-btn">
                      <span className="play-tri">▶</span>
                    </div>
                    {recording.durationSeconds > 0 && (
                      <span className="video-time-badge">
                        {formatDuration(recording.durationSeconds)}
                      </span>
                    )}
                    <span className="video-cat-badge">XỔ GÀ XEM LẠI</span>
                  </div>

                  <div className="video-meta-block">
                    <h4 className="video-item-title">{recording.title}</h4>
                    <div className="video-date-row">
                      <span className="date-icon">📅</span>
                      <span>Ngày {formatRecordingDate(recording.recordingDate)}</span>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn-delete-card-video"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecording(recording.recordingDate);
                        }}
                        title="Xóa video này"
                      >
                        🗑️ Xóa video
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="video-empty-state">
                <div className="empty-state-icon">🎬</div>
                <h3 className="empty-state-title">Chưa có video phát lại hôm nay</h3>
                <p className="empty-state-desc">
                  Các buổi vần xổ gà được phát trực tiếp đều đặn vào lúc <strong>18h30 hàng ngày</strong>.
                  Sau khi buổi live kết thúc, hệ thống sẽ tự động tổng hợp và hiển thị video phát lại tại đây.
                </p>
                <div className="empty-state-badge">
                  <span className="live-pulse-dot"></span>
                  <span>Lịch trực tiếp: 18h30 mỗi ngày</span>
                </div>
              </div>
            )}
          </div>

          <div className="live-reminder-banner">
            <span className="reminder-icon">🔴</span>
            <p>
              <strong>XEM TRỰC TIẾP HÔM NAY:</strong> Truy cập website vào lúc <strong>18h30 hàng ngày</strong> để theo dõi các trận vần xổ gà chọi trực tiếp với chất lượng âm thanh và hình ảnh sắc nét nhất.
            </p>
          </div>

          {/* Tech & Marketing Partner Showcase */}
          <div className="partner-showcase-box">
            <div className="partner-showcase-header">
              <span className="partner-tag">DỊCH VỤ CÔNG NGHỆ & MARKETING</span>
              <span className="partner-contact-badge">Tư vấn trực tiếp: 0387 683 857</span>
            </div>
            <div className="partner-showcase-content">
              <h4 className="partner-showcase-title">
                Thiết Kế Web Bởi <strong>Cao Cương</strong> • <a href="tel:0387683857" className="partner-phone-link">0387 683 857</a>
              </h4>
              <p className="partner-showcase-desc">
                Chuyên thiết kế website Livestream tốc độ cao • Hỗ trợ chạy Ads, kéo khách Facebook & phát triển Fanpage chuyên nghiệp.
              </p>
            </div>
            <div className="partner-showcase-actions">
              <a href="tel:0387683857" className="btn-showcase-call" title="Gọi trực tiếp: 0387683857">
                📞 Hotline: 0387 683 857
              </a>
              <a
                href="https://zalo.me/0387683857"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-showcase-zalo"
                title="Nhắn Zalo tư vấn thiết kế web & kéo khách"
              >
                💬 Nhắn Zalo Tư Vấn
              </a>
            </div>
          </div>
        </section>

        {/* Rules Section */}
        <section className="rules-section">
          <div className="rules-card-modern">
            <div className="rules-header">
              <span className="rules-badge">NỘI QUY CỘNG ĐỒNG</span>
              <h3>Cam Kết & Quy Định Sân Chơi</h3>
            </div>
            <div className="rules-grid-modern">
              <div className="rule-box">
                <div className="rule-icon-circle check">✓</div>
                <div className="rule-text">
                  <strong>Tinh thần giao lưu văn minh</strong>
                  <p>Sân chơi kết nối anh em đam mê gà đòn trên cả nước, mua bán giao lưu lịch sự, tôn trọng lẫn nhau.</p>
                </div>
              </div>
              <div className="rule-box">
                <div className="rule-icon-circle ban">✕</div>
                <div className="rule-text">
                  <strong>Tuyệt đối không cá cược</strong>
                  <p>Không để lại số điện thoại giao dịch lạ, nghiêm cấm mọi hình thức cá cược vi phạm pháp luật Việt Nam.</p>
                </div>
              </div>
            </div>
            <div className="rules-action-row">
              <button onClick={() => setShowRules(true)} className="btn-rules-modal">
                📋 Xem Đầy Đủ Nội Quy Xổ Gà
              </button>
            </div>
          </div>
        </section>

        {/* Introduction Modal */}
        {showIntro && (
          <div className="modal-overlay" onClick={() => setShowIntro(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowIntro(false)}
              >
                ✕
              </button>
              <div className="modal-header">
                <img
                  src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp"
                  alt="Logo"
                  className="modal-logo"
                />
                <h2>Giới thiệu</h2>
              </div>
              <div className="modal-body">
                <p>
                  • Chào mừng bạn đến với{" "}
                  <strong>Trại Gà Ba Anh Em</strong> nơi tạo ra sân chơi
                  phục vụ niềm đam mê gà đòn cho anh em 24/7.
                </p>
                <p>
                  • Tại Trại Gà Ba Anh Em bạn có thể tìm hiểu về kiến
                  thức về gà đòn, hay đơn giản là thưởng thức những video xổ gà
                  trong những lúc rảnh rỗi. Trại Gà Ba Anh Em sẽ đưa đến cho bạn những thông
                  tin mới nhất về giống gà đòn, kinh nghiệm chăm sóc gà, cách
                  huấn luyện gà chọi và nhiều hơn thế nữa.
                </p>
                <p>
                  • <strong>Trại Gà Ba Anh Em</strong> còn cung cấp con
                  giống gà đòn cho những ai đang quan tâm đến việc nuôi gà đòn.
                  Trại Gà Ba Anh Em cam kết chất lượng và uy tín.
                </p>
                <div className="intro-images">
                  <img
                    src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp"
                    alt="Trại Gà Ba Anh Em"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {showRules && (
          <div className="modal-overlay" onClick={() => setShowRules(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowRules(false)}
              >
                ✕
              </button>
              <div className="modal-header">
                <h2>⚠️ Nội Quy Xổ Gà</h2>
              </div>
              <div className="modal-body">
                <ul className="rules-list-detail">
                  <li>
                    <strong>☑️ Tinh thần giao lưu:</strong> Xổ Gà Mua Bán Trên
                    Tinh Thần Giao Lưu Vui Vẻ, Lịch Sự Trên Live Chat
                  </li>
                  <li>
                    <strong>🚫 Không cá cược:</strong> Không Để Số Điện Thoại,
                    Không Cá Cược Dưới Mọi Hình Thức
                  </li>
                  <li>
                    <strong>🚫 Không chửi thề:</strong> Tuyệt đối không sử dụng
                    ngôn từ thiếu văn hóa, xúc phạm người khác
                  </li>
                  <li>
                    <strong>⛔ Vi phạm sẽ bị khoá nick:</strong> Mọi hành vi vi
                    phạm sẽ bị khoá tài khoản vĩnh viễn
                  </li>
                </ul>
                <p className="disclaimer">
                  <strong>Lưu ý pháp lý:</strong> Website Trại Gà Ba Anh Em
                  hoạt động với hình thức giải trí, vui lòng không cá độ dưới
                  mọi hình thức vi phạm pháp luật Việt Nam.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Luxury Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid-modern">
            <div className="footer-col-brand">
              <div className="footer-brand-header">
                <img
                  src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794206741/1793800833515_8768714213416063846_8768714213416063846_83c74c8a52840f6f317e330c1ec999f5-fotor-20261109134342_qlahyg.webp"
                  alt="Trại Gà Ba Anh Em"
                  className="footer-logo"
                />
                <div>
                  <h3>Trại Gà Ba Anh Em</h3>
                  <span className="footer-tagline">TINH HOA VIỆT</span>
                </div>
              </div>
              <p className="footer-desc">
                Trại Gà Ba Anh Em (Trại Gà Ba Anh - Trai Ga Ba Anh) nơi hội tụ đam mê gà chọi đỉnh cao. Chuyên vần xổ gà trực tiếp 18h30 hàng ngày, giao lưu chia sẻ kỹ thuật và con giống chất lượng.
              </p>
            </div>

            <div className="footer-col-bank">
              <h4>Tài Khoản Giao Dịch</h4>
              <div className="footer-bank-info">
                <div className="bank-brand-header">
                  <img
                    src="https://res.cloudinary.com/duklfdbqf/image/upload/v1794298077/Logo-VietinBank-CTG-Ori_pbtmat.webp"
                    alt="VietinBank"
                    className="bank-logo-img"
                  />
                  <p className="bank-name-tag">VietinBank</p>
                </div>
                <p className="bank-stk-tag">
                  STK: <strong>0799 478 478</strong>
                </p>
                <p className="bank-holder-tag">
                  Chủ TK: <strong>TRẦN VĂN THINH</strong>
                </p>
              </div>
            </div>

            <div className="footer-col-contact">
              <h4>Thông Tin Liên Hệ</h4>
              <ul className="footer-contact-list">
                <li>
                  <span className="contact-icon">📞</span>
                  <a href="tel:0931607907" className="contact-link-highlight">
                    Hotline: 0931 607 907
                  </a>
                </li>
                <li>
                  <span className="contact-icon">💬</span>
                  <a
                    href="https://zalo.me/0931607907"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Zalo: 0931 607 907
                  </a>
                </li>
                <li>
                  <span className="contact-icon">📘</span>
                  <a
                    href="https://www.facebook.com/tien.hangvan.5"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook: Trại Gà Ba Anh Em
                  </a>
                </li>
                <li>
                  <span className="contact-icon">📍</span>
                  <a
                    href="https://maps.app.goo.gl/8vTyBLXugZdLrFSP8"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chỉ đường tới Trại Gà trên Google Maps"
                  >
                    Thôn Phước Mỹ, Xã Tây Hòa, Tỉnh Đắk Lắk
                  </a>
                </li>
                <li>
                  <span className="contact-icon">⏰</span>
                  <span>Trực tiếp: 18h30 Hàng Ngày</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-modern">
            <p>© 2026 Trại Gà Ba Anh Em • traigabaanhem.com • All Rights Reserved</p>
            <p className="footer-credit-text">
              Thiết kế web bởi <strong>Cao Cương</strong>: <a href="tel:0387683857">0387 683 857</a> • Hỗ trợ chạy Ads, kéo khách Facebook & Fanpage
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Blocked IPs Modal */}
      {showBlockedIpsModal && (
        <BlockedIpsModal onClose={() => setShowBlockedIpsModal(false)} />
      )}

      {/* Video Replay Modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedVideo(null)}
            >
              ✕
            </button>
            <div className="video-modal-header">
              <h3>{selectedVideo.title}</h3>
              <p className="video-modal-date">
                Ngày {formatRecordingDate(selectedVideo.recordingDate)} • Thời
                lượng: {formatDuration(selectedVideo.durationSeconds)}
              </p>
            </div>
            <div className="video-modal-player">
              <video
                src={selectedVideo.videoUrl}
                poster={
                  selectedVideo.thumbnailUrl ||
                  "https://res.cloudinary.com/duklfdbqf/image/upload/v1794207357/Gemini_Generated_Image_of30onof30onof30_pqgmxe.webp"
                }
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="replay-video-player"
                onError={(e) => {
                  console.error("Video error:", e);
                }}
              >
                <source src={selectedVideo.videoUrl} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="floating-buttons">
        <a href="tel:0931607907" className="fab-btn fab-phone" title="Gọi Ngay">
          <span className="fab-icon">
            <img
              src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764553112/yellow-phone-icon-11_pypubp.png"
              alt="Phone"
            />
          </span>
          <span className="fab-text">Gọi Ngay</span>
        </a>
        <a
          href="https://zalo.me/0931607907"
          target="_blank"
          rel="noopener noreferrer"
          className="fab-btn fab-zalo"
          title="Zalo Trại Gà"
        >
          <span className="fab-icon">
            <img
              src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765639125/zalo-icon_etabmt.png"
              alt="Zalo"
            />
          </span>
          <span className="fab-text">Zalo</span>
        </a>
      </div>
    </div>
  );
};

export default ViewerPageClient;

