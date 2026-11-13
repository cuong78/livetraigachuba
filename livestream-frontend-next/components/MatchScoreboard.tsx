"use client";

import React, { useEffect, useState } from "react";
import "./MatchScoreboard.css";

interface MatchInfo {
  matchNumber: number;
  redWeight: number;
  blueWeight: number;
  status?: string;
  action?: string;
}

interface MatchScoreboardProps {
  stompClient: any;
}

const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ stompClient }) => {
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (!stompClient) return;

    let subscription: any = null;

    const setupSubscription = () => {
      if (!stompClient.connected) {
        return;
      }

      try {
        subscription = stompClient.subscribe(
          "/topic/match-info",
          (message: any) => {
            try {
              const data = JSON.parse(message.body);

              if (data.action === "clear") {
                setIsHiding(true);
                setTimeout(() => {
                  setMatchInfo(null);
                  setIsHiding(false);
                }, 400);
              } else if (data.action === "update" || data.matchNumber) {
                setMatchInfo({
                  matchNumber: data.matchNumber,
                  redWeight: data.redWeight,
                  blueWeight: data.blueWeight,
                  status: data.status || "active",
                });
                setIsHiding(false);
              }
            } catch (error) {
              console.error("Error parsing match info:", error);
            }
          }
        );

        stompClient.publish({
          destination: "/app/match-info/request",
          body: JSON.stringify({}),
        });
      } catch (error) {
        console.error("Failed to subscribe to match info:", error);
      }
    };

    if (stompClient.connected) {
      setupSubscription();
    } else {
      const onConnect = stompClient.onConnect;
      stompClient.onConnect = (frame: any) => {
        if (onConnect) onConnect(frame);
        setupSubscription();
      };
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      }
    };
  }, [stompClient]);

  if (!matchInfo) {
    return null;
  }

  return (
    <div className={`match-scoreboard ${isHiding ? "hide" : ""}`}>
      <div className="scoreboard-container">
        {/* Match Number Badge */}
        <div className="match-badge">
          <span className="badge-text">TRẬN #{matchInfo.matchNumber}</span>
        </div>

        {/* Teams Comparison */}
        <div className="teams-container">
          {/* Red Team */}
          <div className="team red-team">
            <div className="team-header">
              <span className="team-icon">🔴</span>
              <span className="team-name">GÀ ĐỎ</span>
            </div>
            <div className="team-weight">
              <span className="weight-value">{matchInfo.redWeight}</span>
              <span className="weight-unit">kg</span>
            </div>
          </div>

          {/* VS Divider */}
          <div className="vs-divider">
            <span className="vs-text">VS</span>
          </div>

          {/* Blue/Black Team */}
          <div className="team blue-team">
            <div className="team-header">
              <span className="team-icon">⚫</span>
              <span className="team-name">GÀ ĐEN</span>
            </div>
            <div className="team-weight">
              <span className="weight-value">{matchInfo.blueWeight}</span>
              <span className="weight-unit">kg</span>
            </div>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span className="live-text">ĐANG ĐẤU</span>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreboard;

