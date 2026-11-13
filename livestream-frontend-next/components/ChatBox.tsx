"use client";

import { useState, useEffect, useRef } from "react";
import type { Comment } from "@/types";
import { getStorageItem, setStorageItem } from "@/services/api";
import "./ChatBox.css";

interface ChatBoxProps {
  comments: Comment[];
  onSendComment: (comment: Comment) => void;
  viewerCount?: number;
  isAdmin?: boolean;
  adminUsername?: string | null;
  onDeleteComment?: (comment: Comment) => void;
  onBlockIp?: (ipAddress: string) => void;
}

const DISPLAY_NAME_KEY = "livestream_display_name";
const MAX_COMMENTS = 60;
const MAX_DISPLAY_NAME_LENGTH = 30;
const MAX_CONTENT_LENGTH = 300;

const ChatBox: React.FC<ChatBoxProps> = ({
  comments,
  onSendComment,
  viewerCount = 0,
  isAdmin = false,
  adminUsername = null,
  onDeleteComment,
  onBlockIp,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    comment: Comment;
    x: number;
    y: number;
  } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const inputContentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedName = getStorageItem(DISPLAY_NAME_KEY);
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);

  // Auto-scroll to top for newest message when input is at the top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && shouldScrollRef.current) {
      container.scrollTop = 0;
    }
  }, [comments]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearTop = container.scrollTop < 50;
      shouldScrollRef.current = isNearTop;
    }
  };

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Don't close if click is inside the context menu itself
      if (target.closest(".admin-context-menu")) return;
      // Don't close if clicking a chat-line (handleCommentClick will handle it)
      if (target.closest(".chat-line")) return;
      setContextMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCommentClick = (comment: Comment, e: React.MouseEvent) => {
    if (isAdmin) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();

      const menuHeight = 240;
      const menuWidth = 220;
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 400;
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

      const x = Math.min(Math.max(10, e.clientX), Math.max(10, viewportWidth - menuWidth - 10));
      const y = Math.min(Math.max(10, e.clientY), Math.max(10, viewportHeight - menuHeight - 10));

      setContextMenu({ comment, x, y });
    } else {
      handleReplyClick(comment);
    }
  };

  const handleDeleteComment = () => {
    if (contextMenu && onDeleteComment) {
      if (
        confirm(
          `Bạn có chắc muốn xóa bình luận của "${contextMenu.comment.displayName}"?`
        )
      ) {
        onDeleteComment(contextMenu.comment);
      }
    }
    setContextMenu(null);
  };

  const handleViewIp = () => {
    if (contextMenu?.comment.ipAddress) {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(contextMenu.comment.ipAddress);
        alert(`Đã sao chép IP: ${contextMenu.comment.ipAddress}`);
      } else {
        alert(`IP Address: ${contextMenu.comment.ipAddress}`);
      }
    } else {
      alert("Bình luận này không có thông tin IP.");
    }
    setContextMenu(null);
  };

  const handleBlockIp = () => {
    if (contextMenu?.comment.ipAddress && onBlockIp) {
      if (
        confirm(`Bạn có chắc muốn chặn IP: ${contextMenu.comment.ipAddress}?`)
      ) {
        onBlockIp(contextMenu.comment.ipAddress);
      }
    } else {
      alert("Không có IP để chặn.");
    }
    setContextMenu(null);
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    setContent(""); // Không điền trước @Name vào input để tránh duplicate chữ
    inputContentRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMessage("");

    const cleanName = displayName.trim();
    const cleanContent = content.trim();

    if (!cleanName) {
      setErrorMessage("Vui lòng nhập tên hiển thị");
      return;
    }

    if (cleanName.length > MAX_DISPLAY_NAME_LENGTH) {
      setErrorMessage(`Tên tối đa ${MAX_DISPLAY_NAME_LENGTH} ký tự`);
      return;
    }

    if (!cleanContent) {
      setErrorMessage("Vui lòng nhập nội dung bình luận");
      return;
    }

    if (cleanContent.length > MAX_CONTENT_LENGTH) {
      setErrorMessage(`Bình luận tối đa ${MAX_CONTENT_LENGTH} ký tự`);
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setStorageItem(DISPLAY_NAME_KEY, cleanName);

      const commentToSend: Comment = {
        displayName: cleanName,
        content: cleanContent,
        parentId: replyingTo?.id?.toString(),
        replyTo: replyingTo?.displayName,
      };

      if (isAdmin && adminUsername) {
        commentToSend.adminUsername = adminUsername;
      }

      setContent("");
      setReplyingTo(null);

      onSendComment(commentToSend);

      shouldScrollRef.current = true;
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0;
        }
      }, 50);
    } catch (error: any) {
      setErrorMessage(error.message || "Không thể gửi bình luận. Thử lại.");
    } finally {
      setTimeout(() => setIsSubmitting(false), 1200);
    }
  };

  const displayedComments = comments.slice(-MAX_COMMENTS).reverse();

  // Loại bỏ các tiền tố @Tên người được trả lời nếu có sẵn trong text để tránh duplicate hiển thị
  const getDisplayContent = (comment: Comment): string => {
    let text = comment.content || "";
    if (comment.replyTo) {
      const escaped = comment.replyTo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^(@${escaped}[:\\s]*)+`, "i");
      text = text.replace(regex, "").trim();
    }
    return text;
  };

  const renderContentWithMentions = (text: string) => {
    if (!text) return "";
    const mentionRegex = /@(\S+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>
        );
      }
      parts.push(
        <span key={match.index} className="mention-highlight">
          @{match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="chatbox-container">
      {/* 1. Sleek Top Bar */}
      <div className="chatbox-header">
        <div className="header-left">
          <a
            href="tel:0931607907"
            className="phone-pill"
            title="Gọi Hotline: 0931607907"
          >
            <span className="phone-icon">📞</span>
            <span className="phone-num">0931607907</span>
          </a>
          <div className="viewer-pill">
            <span className="live-dot"></span>
            <span>{viewerCount} đang xem</span>
          </div>
        </div>
        <a
          href="https://zalo.me/0931607907"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-chot-ga"
          title="Chốt Gà nhanh qua Zalo"
        >
          🐓 CHỐT GÀ
        </a>
      </div>

      {/* 2. Compact Single-Row Input Dock */}
      <form onSubmit={handleSubmit} className="chat-dock">
        {replyingTo && (
          <div className="dock-reply-banner">
            <span className="reply-info">
              ↩️ Trả lời <strong>@{replyingTo.displayName}</strong>
            </span>
            <button
              type="button"
              className="dock-reply-close"
              onClick={() => {
                setReplyingTo(null);
                setContent("");
              }}
              title="Hủy trả lời"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="dock-error-banner">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        <div className="dock-row">
          <input
            type="text"
            placeholder="Nhập tên..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="dock-input-name"
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            disabled={isSubmitting}
            title="Nhập tên hiển thị của bạn"
          />
          <input
            ref={inputContentRef}
            type="text"
            placeholder={
              replyingTo
                ? `Trả lời @${replyingTo.displayName}...`
                : "Nhập bình luận..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="dock-input-msg"
            maxLength={MAX_CONTENT_LENGTH}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="dock-btn-send"
            disabled={isSubmitting || !content.trim()}
            title="Gửi bình luận"
          >
            {isSubmitting ? (
              <span className="dock-spinner"></span>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* 3. Chat Message Stream */}
      <div
        className="chatbox-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {displayedComments.length === 0 ? (
          <div className="chatbox-empty">
            <span className="empty-icon">💬</span>
            <p>Chưa có bình luận nào. Hãy gửi bình luận đầu tiên!</p>
          </div>
        ) : (
          displayedComments.map((comment, index) => {
            const isAdminComment = comment.isAdmin === true;
            return (
              <div
                key={
                  comment.id ||
                  `${comment.displayName}-${comment.createdAt || index}`
                }
                className={`chat-line ${isAdminComment ? "is-admin" : ""} ${
                  comment.parentId ? "is-reply" : ""
                }`}
                onClick={(e) => handleCommentClick(comment, e)}
                title={isAdmin ? "Nhấp để quản lý bình luận" : "Nhấp để trả lời"}
              >
                {isAdminComment && (
                  <span className="badge-admin" title="Quản trị viên">
                    👑 ADMIN
                  </span>
                )}
                <span className="msg-author">{comment.displayName}:</span>{" "}
                {comment.replyTo && (
                  <span className="msg-reply-to">
                    @{comment.replyTo}{" "}
                  </span>
                )}
                <span className="msg-text">
                  {renderContentWithMentions(getDisplayContent(comment))}
                </span>
                {isAdmin && comment.ipAddress && (
                  <span className="badge-ip" title="IP người dùng">
                    [{comment.ipAddress}]
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Admin Context Menu */}
      {contextMenu && isAdmin && (
        <div
          className="admin-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation?.();
          }}
        >
          <div className="context-menu-header">
            👤 {contextMenu.comment.displayName}
          </div>
          <button
            type="button"
            className="context-menu-item reply"
            onClick={(e) => {
              e.stopPropagation();
              handleReplyClick(contextMenu.comment);
              setContextMenu(null);
            }}
          >
            ↩️ Trả lời bình luận
          </button>
          <button
            type="button"
            className="context-menu-item delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteComment();
            }}
          >
            🗑️ Xóa bình luận
          </button>
          {contextMenu.comment.ipAddress && (
            <>
              <button
                type="button"
                className="context-menu-item view-ip"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewIp();
                }}
                title="Sao chép IP vào clipboard"
              >
                📋 Sao chép IP: {contextMenu.comment.ipAddress}
              </button>
              <button
                type="button"
                className="context-menu-item block"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBlockIp();
                }}
              >
                🚫 Chặn IP này
              </button>
            </>
          )}
          {contextMenu.comment.latitude && contextMenu.comment.longitude && (
            <div className="context-menu-location">
              <div className="location-label">🗺️ Tọa độ:</div>
              <div className="location-coords">
                Lat: {contextMenu.comment.latitude.toFixed(6)}
              </div>
              <div className="location-coords">
                Lng: {contextMenu.comment.longitude.toFixed(6)}
              </div>
            </div>
          )}
          <button
            type="button"
            className="context-menu-item cancel"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
            }}
          >
            ✕ Đóng
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
