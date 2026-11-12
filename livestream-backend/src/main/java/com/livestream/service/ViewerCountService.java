package com.livestream.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ViewerCountService {

    private static final String REDIS_VIEWERS_KEY = "live:viewers:heartbeat";
    private static final long HEARTBEAT_TIMEOUT_MS = 30_000L; // 30 seconds inactivity window

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, String> redisTemplate;
    private final AtomicInteger inMemoryFallbackCount = new AtomicInteger(0);

    // Map sessionId -> deviceId for session cleanup
    private final Map<String, String> sessionDeviceMap = new ConcurrentHashMap<>();

    /**
     * Record heartbeat from a device / client (Best practice Redis Sorted Set)
     */
    public void recordHeartbeat(String deviceId, String sessionId) {
        if (deviceId == null || deviceId.isBlank()) {
            return;
        }

        if (sessionId != null) {
            sessionDeviceMap.put(sessionId, deviceId);
        }

        try {
            long now = System.currentTimeMillis();
            redisTemplate.opsForZSet().add(REDIS_VIEWERS_KEY, deviceId, (double) now);
            redisTemplate.expire(REDIS_VIEWERS_KEY, 10, TimeUnit.MINUTES);
            log.debug("Recorded heartbeat for device: {}, session: {}", deviceId, sessionId);
        } catch (Exception e) {
            log.warn("Redis heartbeat record failed, relying on fallback: {}", e.getMessage());
        }
    }

    /**
     * Client explicitly left
     */
    public void recordLeave(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return;
        }
        try {
            redisTemplate.opsForZSet().remove(REDIS_VIEWERS_KEY, deviceId);
            int count = getCurrentCount();
            broadcastViewerCount(count);
        } catch (Exception e) {
            log.warn("Redis leave record failed: {}", e.getMessage());
        }
    }

    /**
     * Get current active viewer count
     * Cleans up members inactive for > 30s and counts active unique devices
     */
    public int getCurrentCount() {
        try {
            long cutoff = System.currentTimeMillis() - HEARTBEAT_TIMEOUT_MS;
            // Remove inactive entries older than 30s
            redisTemplate.opsForZSet().removeRangeByScore(REDIS_VIEWERS_KEY, 0, (double) cutoff);
            Long count = redisTemplate.opsForZSet().zCard(REDIS_VIEWERS_KEY);
            int redisCount = (count != null) ? count.intValue() : 0;
            return Math.max(redisCount, inMemoryFallbackCount.get());
        } catch (Exception e) {
            log.warn("Failed to get viewer count from Redis: {}", e.getMessage());
            return Math.max(0, inMemoryFallbackCount.get());
        }
    }

    /**
     * Event listener for WebSocket connections
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        inMemoryFallbackCount.incrementAndGet();
        // Immediately notify newly connected client with current count
        broadcastViewerCount(getCurrentCount());
    }

    /**
     * Event listener for WebSocket disconnections
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId != null) {
            String deviceId = sessionDeviceMap.remove(sessionId);
            if (deviceId != null) {
                try {
                    redisTemplate.opsForZSet().remove(REDIS_VIEWERS_KEY, deviceId);
                } catch (Exception ignored) {}
            }
        }
        if (inMemoryFallbackCount.get() > 0) {
            inMemoryFallbackCount.decrementAndGet();
        }
        broadcastViewerCount(getCurrentCount());
    }

    /**
     * Send current viewer count to a specific user
     */
    public void sendCountToUser(String sessionId) {
        try {
            int count = getCurrentCount();
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/viewer-count", Map.of("count", count));
            log.debug("Sent viewer count {} to session {}", count, sessionId);
        } catch (Exception e) {
            log.error("Failed to send viewer count to user", e);
        }
    }

    /**
     * Periodic broadcast every 5 seconds to keep all viewers in sync
     */
    @Scheduled(fixedRate = 5000)
    public void scheduledViewerCountBroadcast() {
        try {
            int count = getCurrentCount();
            broadcastViewerCount(count);
        } catch (Exception e) {
            log.error("Failed to broadcast periodic viewer count", e);
        }
    }

    /**
     * Broadcast current viewer count to all clients
     */
    public void broadcastViewerCount(int count) {
        try {
            messagingTemplate.convertAndSend("/topic/viewer-count", Map.of("count", count));
            log.debug("Broadcasted viewer count: {}", count);
        } catch (Exception e) {
            log.error("Failed to broadcast viewer count", e);
        }
    }
}
