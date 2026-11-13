"use client";

import { useState, useEffect } from "react";
import { getStorageItem } from "@/services/api";
import "./BlockedIpsModal.css";

interface BlockedIp {
  id: number;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
}

interface BlockedIpsModalProps {
  onClose: () => void;
}

const BlockedIpsModal: React.FC<BlockedIpsModalProps> = ({ onClose }) => {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const fetchBlockedIps = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getStorageItem("admin_token");
      const response = await fetch("/api/admin/blocked-ips", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedIps(data);
      } else {
        setError("Không thể tải danh sách IP đã chặn");
      }
    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (id: number, ipAddress: string) => {
    if (!confirm(`Bạn có chắc muốn mở khóa IP: ${ipAddress}?`)) {
      return;
    }

    try {
      const token = getStorageItem("admin_token");
      const response = await fetch(`/api/admin/blocked-ips/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBlockedIps(blockedIps.filter((ip) => ip.id !== id));
      } else {
        alert("Không thể mở khóa IP này");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="blocked-ips-modal-overlay" onClick={onClose}>
      <div
        className="blocked-ips-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="blocked-ips-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="blocked-ips-modal-header">
          <div className="blocked-ips-icon">🚫</div>
          <h2>Danh Sách IP Bị Chặn</h2>
          <p>Quản lý các địa chỉ IP bị cấm bình luận</p>
        </div>

        {error && <div className="blocked-ips-error">{error}</div>}

        <div className="blocked-ips-body">
          {loading ? (
            <div className="blocked-ips-loading">Đang tải danh sách...</div>
          ) : blockedIps.length === 0 ? (
            <div className="blocked-ips-empty">
              <span className="empty-icon">✅</span>
              <p>Hiện tại không có IP nào bị chặn</p>
            </div>
          ) : (
            <div className="blocked-ips-table-wrapper">
              <table className="blocked-ips-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Lý do</th>
                    <th>Thời gian</th>
                    <th>Người chặn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.map((ip) => (
                    <tr key={ip.id}>
                      <td className="ip-cell font-mono">{ip.ipAddress}</td>
                      <td>{ip.reason || "Không có"}</td>
                      <td className="date-cell">{formatDate(ip.blockedAt)}</td>
                      <td>{ip.blockedBy || "Admin"}</td>
                      <td>
                        <button
                          className="btn-unblock"
                          onClick={() => handleUnblock(ip.id, ip.ipAddress)}
                        >
                          Mở Khóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockedIpsModal;

