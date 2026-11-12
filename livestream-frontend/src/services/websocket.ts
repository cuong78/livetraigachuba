import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Comment } from "@/types";

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem("traiga_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem("traiga_device_id", id);
    }
    return id;
  } catch {
    return "dev_guest_" + Math.random().toString(36).substring(2, 9);
  }
}

export class WebSocketService {
  private client: Client | null = null;
  private onMessageCallback: ((comment: Comment) => void) | null = null;
  private onHistoryCallback: ((comments: Comment[]) => void) | null = null;
  private onViewerCountCallback: ((count: number) => void) | null = null;
  private onCommentDeletedCallback: ((comment: Comment) => void) | null = null;
  private viewerCountIntervalId: number | null = null;
  private heartbeatIntervalId: number | null = null;

  connect(
    onMessage: (comment: Comment) => void,
    onHistory?: (comments: Comment[]) => void,
    onViewerCount?: (count: number) => void,
    onCommentDeleted?: (comment: Comment) => void
  ): void {
    this.onMessageCallback = onMessage;
    this.onHistoryCallback = onHistory || null;
    this.onViewerCountCallback = onViewerCount || null;
    this.onCommentDeletedCallback = onCommentDeleted || null;

    const wsUrl = "/api/ws/chat";

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      debug: (str) => {
        console.log("STOMP: " + str);
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log("WebSocket Connected");

      // Subscribe to new comments
      this.client?.subscribe("/topic/live-comments", (message) => {
        const comment = JSON.parse(message.body) as Comment;
        this.onMessageCallback?.(comment);
      });

      // Send immediate heartbeat and start periodic heartbeat (Redis Best Practice)
      const deviceId = getOrCreateDeviceId();
      this.client?.publish({
        destination: "/app/viewer-heartbeat",
        body: JSON.stringify({ deviceId }),
      });

      if (this.heartbeatIntervalId !== null) {
        window.clearInterval(this.heartbeatIntervalId);
      }
      this.heartbeatIntervalId = window.setInterval(() => {
        if (this.client?.connected) {
          this.client.publish({
            destination: "/app/viewer-heartbeat",
            body: JSON.stringify({ deviceId }),
          });
        }
      }, 10000); // 10 seconds heartbeat

      // Subscribe to viewer count
      if (this.onViewerCountCallback) {
        this.client?.subscribe("/topic/viewer-count", (message) => {
          const data = JSON.parse(message.body) as { count: number };
          this.onViewerCountCallback?.(data.count);
        });

        // Request current viewer count immediately after subscribing
        this.client?.publish({
          destination: "/app/viewer-count/request",
          body: JSON.stringify({}),
        });

        // Periodically request viewer count to keep it in sync
        if (this.viewerCountIntervalId !== null) {
          window.clearInterval(this.viewerCountIntervalId);
        }
        this.viewerCountIntervalId = window.setInterval(() => {
          if (this.client?.connected) {
            this.client.publish({
              destination: "/app/viewer-count/request",
              body: JSON.stringify({}),
            });
          }
        }, 30000); // every 30 seconds
      }

      // Subscribe to comment deleted events
      if (this.onCommentDeletedCallback) {
        this.client?.subscribe("/topic/comment-deleted", (message) => {
          const comment = JSON.parse(message.body) as Comment;
          this.onCommentDeletedCallback?.(comment);
        });
      }

      // Subscribe to comments history
      if (this.onHistoryCallback) {
        this.client?.subscribe("/topic/comments-history", (message) => {
          const commentsJson = JSON.parse(message.body) as string[];
          const comments: Comment[] = commentsJson.map((json) =>
            JSON.parse(json)
          );
          this.onHistoryCallback?.(comments);
        });

        // Request comments history after connection
        this.client?.publish({
          destination: "/app/comments/history",
          body: JSON.stringify({}),
        });
      }
    };

    this.client.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };

    this.client.activate();
  }

  sendComment(comment: Comment): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: "/app/comment",
        body: JSON.stringify(comment),
      });
    }
  }

  deleteComment(comment: Comment): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: "/app/comment/delete",
        body: JSON.stringify(comment),
      });
    }
  }

  getStompClient(): Client | null {
    return this.client;
  }

  disconnect(): void {
    if (this.viewerCountIntervalId !== null) {
      window.clearInterval(this.viewerCountIntervalId);
      this.viewerCountIntervalId = null;
    }
    if (this.heartbeatIntervalId !== null) {
      window.clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    if (this.client) {
      try {
        const deviceId = getOrCreateDeviceId();
        if (this.client.connected) {
          this.client.publish({
            destination: "/app/viewer-leave",
            body: JSON.stringify({ deviceId }),
          });
        }
      } catch {}
      this.client.deactivate();
      this.client = null;
    }
  }
}

export const websocketService = new WebSocketService();
