"use client";

import React, { useState } from "react";
import "./MatchInfoPanel.css";

interface MatchInfoPanelProps {
  stompClient: any;
}

interface MatchInfo {
  matchNumber: number;
  redWeight: number;
  blueWeight: number;
}

const MatchInfoPanel: React.FC<MatchInfoPanelProps> = ({ stompClient }) => {
  const [matchNumber, setMatchNumber] = useState<string>("");
  const [redWeight, setRedWeight] = useState<string>("");
  const [blueWeight, setBlueWeight] = useState<string>("");
  const [currentMatch, setCurrentMatch] = useState<MatchInfo | null>(null);

  const handleSendMatchInfo = () => {
    if (!stompClient || !matchNumber || !redWeight || !blueWeight) {
      alert("Vui lòng điền đầy đủ thông tin cặp đấu!");
      return;
    }

    const matchInfo = {
      matchNumber: parseInt(matchNumber),
      redWeight: parseFloat(redWeight),
      blueWeight: parseFloat(blueWeight),
    };

    if (isNaN(matchInfo.matchNumber) || matchInfo.matchNumber < 1) {
      alert("Số cặp phải là số nguyên dương!");
      return;
    }

    if (isNaN(matchInfo.redWeight) || matchInfo.redWeight <= 0) {
      alert("Trọng lượng gà đỏ phải là số dương!");
      return;
    }

    if (isNaN(matchInfo.blueWeight) || matchInfo.blueWeight <= 0) {
      alert("Trọng lượng gà đen phải là số dương!");
      return;
    }

    try {
      stompClient.publish({
        destination: "/app/match-info/update",
        body: JSON.stringify(matchInfo),
      });

      setCurrentMatch(matchInfo);
    } catch (error) {
      console.error("Failed to send match info:", error);
      alert("Không thể gửi thông tin cặp đấu!");
    }
  };

  const handleClearMatchInfo = () => {
    if (!stompClient) {
      alert("Chưa kết nối WebSocket!");
      return;
    }

    if (
      !window.confirm("Bạn có chắc muốn xóa thông tin cặp đấu khỏi màn hình?")
    ) {
      return;
    }

    try {
      stompClient.publish({
        destination: "/app/match-info/clear",
        body: JSON.stringify({}),
      });

      setCurrentMatch(null);
      setMatchNumber("");
      setRedWeight("");
      setBlueWeight("");
    } catch (error) {
      console.error("Failed to clear match info:", error);
      alert("Không thể xóa thông tin cặp đấu!");
    }
  };

  return (
    <div className="match-info-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon">🥊</span>
          <h3>Quản Lý Cặp Đấu</h3>
        </div>
        {currentMatch && (
          <span className="current-match-badge">
            🟢 Đang hiển thị: Cặp #{currentMatch.matchNumber} ({currentMatch.redWeight}kg - {currentMatch.blueWeight}kg)
          </span>
        )}
      </div>

      <div className="panel-body">
        <div className="form-row match-form">
          <div className="form-group">
            <label htmlFor="matchNumber">Số Cặp Đấu</label>
            <input
              id="matchNumber"
              type="number"
              min="1"
              placeholder="VD: 1, 2, 3..."
              value={matchNumber}
              onChange={(e) => setMatchNumber(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="redWeight" className="label-red">🔴 Gà Đỏ (kg)</label>
            <input
              id="redWeight"
              type="number"
              step="0.01"
              min="0"
              placeholder="VD: 3.25"
              value={redWeight}
              onChange={(e) => setRedWeight(e.target.value)}
              className="input-field red-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="blueWeight" className="label-blue">⚫ Gà Đen (kg)</label>
            <input
              id="blueWeight"
              type="number"
              step="0.01"
              min="0"
              placeholder="VD: 3.20"
              value={blueWeight}
              onChange={(e) => setBlueWeight(e.target.value)}
              className="input-field blue-input"
            />
          </div>
        </div>

        <div className="button-group match-actions">
          <button
            type="button"
            onClick={handleSendMatchInfo}
            className="btn btn-primary btn-send-match"
            disabled={!stompClient}
          >
            📡 Phát Lên Màn Hình
          </button>
          <button
            type="button"
            onClick={handleClearMatchInfo}
            className="btn btn-danger btn-clear-match"
            disabled={!stompClient || !currentMatch}
          >
            🗑️ Xóa Khỏi Màn Hình
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchInfoPanel;
