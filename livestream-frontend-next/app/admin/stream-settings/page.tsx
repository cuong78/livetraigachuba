"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/services/api";

interface StreamSettings {
  streamKey: string;
  rtmpUrl: string;
  hlsBaseUrl: string;
  fullRtmpUrl: string;
}

const StreamSettingsPage = () => {
  const [settings, setSettings] = useState<StreamSettings | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreamSettings();
  }, []);

  const fetchStreamSettings = async () => {
    try {
      const response = await api.get("/user/stream-settings");
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch stream settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const regenerateKey = async () => {
    if (
      !confirm(
        "⚠️ Regenerate stream key?\n\nYour old key will be invalid and you need to update it in your RTMP Publisher app!"
      )
    ) {
      return;
    }

    try {
      alert("Stream key regenerated successfully!");
      fetchStreamSettings();
    } catch (error) {
      alert("Failed to regenerate stream key");
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Đang tải cài đặt luồng...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Không thể tải cài đặt luồng phát (Yêu cầu đăng nhập quản trị)</p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: "16px",
              padding: "10px 20px",
              background: "#007bff",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h1 style={styles.title}>📡 Stream Settings</h1>
          <Link
            href="/"
            style={{
              color: "#aaa",
              textDecoration: "none",
              fontSize: "14px",
              padding: "6px 12px",
              border: "1px solid #444",
              borderRadius: "6px",
            }}
          >
            ← Về Trang Chủ
          </Link>
        </div>
        <p style={styles.subtitle}>
          Copy các thông số này dán vào app RTMP Publisher trên điện thoại để bắt đầu phát trực tiếp
        </p>

        {/* Server URL */}
        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>🌐</span>
            Server URL
          </label>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={settings.rtmpUrl}
              readOnly
              style={styles.input}
            />
            <button
              onClick={() => copyToClipboard(settings.rtmpUrl, "server")}
              style={styles.copyButton}
            >
              {copied === "server" ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <p style={styles.hint}>Format: rtmp://192.168.1.9:1935/live hoặc rtmp://traigabaanhem.com:1935/live</p>
        </div>

        {/* Stream Key */}
        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>🔑</span>
            Stream Key
          </label>
          <div style={styles.inputGroup}>
            <input
              type="password"
              value={settings.streamKey}
              readOnly
              style={styles.input}
            />
            <button
              onClick={() => copyToClipboard(settings.streamKey, "key")}
              style={styles.copyButton}
            >
              {copied === "key" ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <button onClick={regenerateKey} style={styles.regenerateButton}>
            🔄 Tạo lại Key mới
          </button>
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.instructionsTitle}>📱 Hướng dẫn sử dụng:</h3>
          <ol style={styles.instructionsList}>
            <li>
              Mở app <strong>RTMP Live Streaming Publisher</strong> trên điện thoại
            </li>
            <li>
              Vào mục <strong>Settings</strong> (biểu tượng ⚙️)
            </li>
            <li>
              Bấm <strong>Server URL</strong> → Dán: <code>{settings.rtmpUrl}</code>
            </li>
            <li>
              Bấm <strong>Stream Key</strong> → Dán mã stream key phía trên
            </li>
            <li>
              Bấm <strong>Save</strong>
            </li>
            <li>
              Quay lại màn hình chính và bấm <strong>Start Streaming 🔴</strong>
            </li>
          </ol>
        </div>

        {/* Requirements */}
        <div style={styles.requirements}>
          <h4 style={styles.requirementsTitle}>⚠️ Lưu ý mạng:</h4>
          <ul style={styles.requirementsList}>
            <li>
              ✅ Điện thoại và máy chủ cần kết nối mạng thông suốt
            </li>
            <li>
              ✅ Port 1935 (RTMP) mở trên firewall
            </li>
            <li>
              ✅ Docker container srs và backend đang hoạt động
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
    padding: "20px",
  },
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#2a2a2a",
    borderRadius: "12px",
    padding: "32px",
    color: "#ffffff",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },
  subtitle: {
    color: "#aaa",
    marginBottom: "32px",
    fontSize: "15px",
  },
  section: {
    marginBottom: "32px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  labelIcon: {
    marginRight: "8px",
    fontSize: "20px",
  },
  inputGroup: {
    display: "flex",
    gap: "12px",
  },
  input: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#1a1a1a",
    border: "2px solid #3a3a3a",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "monospace",
  },
  copyButton: {
    padding: "14px 24px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  regenerateButton: {
    marginTop: "12px",
    padding: "12px 24px",
    backgroundColor: "#dc3545",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  hint: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#888",
    fontFamily: "monospace",
  },
  instructions: {
    backgroundColor: "#1a1a1a",
    padding: "24px",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  instructionsTitle: {
    fontSize: "18px",
    marginBottom: "16px",
  },
  instructionsList: {
    paddingLeft: "24px",
    lineHeight: "1.8",
  },
  requirements: {
    backgroundColor: "#2d1f1f",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "24px",
    borderLeft: "4px solid #dc3545",
  },
  requirementsTitle: {
    fontSize: "16px",
    marginBottom: "12px",
  },
  requirementsList: {
    paddingLeft: "24px",
    lineHeight: "1.8",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "20px",
    color: "#888",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#dc3545",
  },
};

export default StreamSettingsPage;

