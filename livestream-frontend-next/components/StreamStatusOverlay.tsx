"use client";

import React, { useState, useEffect, useRef } from "react";
import { streamApi } from "@/services/api";
import type { DailyRecording } from "@/types";
import "./StreamStatusOverlay.css";

interface StreamStatusOverlayProps {
  initialHasStreamedToday?: boolean;
  recordings: DailyRecording[];
  onScrollToRecordings: () => void;
}

const TARGET_HOUR = 18;
const TARGET_MINUTE = 30;
const TARGET_SECONDS_OF_DAY = TARGET_HOUR * 3600 + TARGET_MINUTE * 60; // 18:30:00

const getVietnamTime = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const vnDate = new Date(utcMs + 7 * 3600000);
  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getDate()).padStart(2, "0");
  return {
    hours: vnDate.getHours(),
    minutes: vnDate.getMinutes(),
    seconds: vnDate.getSeconds(),
    dateStr: `${year}-${month}-${day}`,
  };
};

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

const StreamStatusOverlay: React.FC<StreamStatusOverlayProps> = ({
  initialHasStreamedToday = false,
  recordings,
  onScrollToRecordings,
}) => {
  const [vnTime, setVnTime] = useState(getVietnamTime);
  const [apiHasStreamedToday, setApiHasStreamedToday] = useState<boolean>(
    initialHasStreamedToday
  );
  const lastDateRef = useRef<string>(vnTime.dateStr);

  // Sync with backend today-status on mount and periodically
  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        const res = await streamApi.getTodayStatus();
        if (typeof res?.hasStreamedToday === "boolean") {
          setApiHasStreamedToday(res.hasStreamedToday);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    fetchTodayStatus();
    const pollTimer = setInterval(fetchTodayStatus, 30000);
    return () => clearInterval(pollTimer);
  }, []);

  // Tick every second for countdown & detect midnight rollover (00:00:00)
  useEffect(() => {
    const tickTimer = setInterval(() => {
      const currentVn = getVietnamTime();
      setVnTime(currentVn);

      // Qua 00h00 ngày mới -> reset trạng thái live hôm nay để hiện lại đồng hồ đếm ngược
      if (currentVn.dateStr !== lastDateRef.current) {
        lastDateRef.current = currentVn.dateStr;
        setApiHasStreamedToday(false);
        streamApi
          .getTodayStatus()
          .then((res) => {
            if (typeof res?.hasStreamedToday === "boolean") {
              setApiHasStreamedToday(res.hasStreamedToday);
            }
          })
          .catch(() => {});
      }
    }, 1000);

    return () => clearInterval(tickTimer);
  }, []);

  const currentSecondsOfDay =
    vnTime.hours * 3600 + vnTime.minutes * 60 + vnTime.seconds;
  const remainingSeconds = TARGET_SECONDS_OF_DAY - currentSecondsOfDay;

  // Kiểm tra xem hôm nay đã có phát live hay chưa (từ backend hoặc danh sách video xem lại hôm nay)
  const hasRecordingToday = recordings.some(
    (rec) => rec.recordingDate === vnTime.dateStr
  );
  const hasStreamedToday = apiHasStreamedToday || hasRecordingToday;

  // 1. Trước 18h30 hàng ngày -> Hiện đồng hồ đếm ngược
  if (remainingSeconds > 0) {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return (
      <div className="stream-status-overlay">
        <div className="status-card">
          <div className="status-tv-icon">📺</div>
          <h2 className="status-title-gold">Chưa có livestream</h2>
          <p className="status-schedule-line">
            <span>⏰</span> Lịch phát sóng: <strong>18h30 hàng ngày</strong>
          </p>

          <div className="countdown-grid">
            <div className="countdown-unit">
              <div className="countdown-box">{pad2(hours)}</div>
              <span className="countdown-label">GIỜ</span>
            </div>
            <span className="countdown-colon">:</span>
            <div className="countdown-unit">
              <div className="countdown-box">{pad2(minutes)}</div>
              <span className="countdown-label">PHÚT</span>
            </div>
            <span className="countdown-colon">:</span>
            <div className="countdown-unit">
              <div className="countdown-box">{pad2(seconds)}</div>
              <span className="countdown-label">GIÂY</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Từ 18h30 trở đi & Hôm nay CÓ phát live rồi kết thúc -> Mời xem lại video
  if (hasStreamedToday) {
    return (
      <div className="stream-status-overlay">
        <div className="status-card status-card-notice">
          <div className="status-tv-icon">🎬</div>
          <h2 className="status-title-gold">Đã kết thúc live</h2>
          <p className="status-message-main">
            Đã kết thúc live, mời anh em lướt xuống xem video xem lại
          </p>
          <button
            type="button"
            className="status-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onScrollToRecordings();
            }}
          >
            📺 Xem video xem lại ↓
          </button>
        </div>
      </div>
    );
  }

  // 3. Từ 18h30 trở đi & Hôm nay KHÔNG có phiên live nào -> Báo không ghép được gà
  return (
    <div className="stream-status-overlay">
      <div className="status-card status-card-notice">
        <div className="status-tv-icon">🐓</div>
        <h2 className="status-title-gold">Thông báo từ Trại</h2>
        <p className="status-message-main">
          Hôm nay Trại Không Ghép được gà, mời anh em vào ngày hôm sau
        </p>
        <p className="status-schedule-sub">
          ⏰ Hẹn gặp lại anh em lúc 18h30 ngày mai
        </p>
      </div>
    </div>
  );
};

export default StreamStatusOverlay;
