package com.livestream.scheduler;

import com.livestream.service.RecordingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordingScheduler {
    
    private final RecordingService recordingService;
    
    /**
     * Automatically merge recordings at 00:30 AM every day.
     * Merges recordings from yesterday in case stream ended late or unpublish callback missed.
     */
    @Scheduled(cron = "0 30 0 * * *")
    public void autoMergeRecordings() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("Scheduled task: Starting auto-merge for date: {}", yesterday);
        
        try {
            recordingService.triggerMerge(yesterday);
            log.info("Scheduled task: Auto-merge initiated for date: {}", yesterday);
        } catch (Exception e) {
            log.error("Scheduled task: Failed to auto-merge recordings for date: {}", yesterday, e);
        }
    }

    /**
     * Clean up old recordings at 01:00 every day
     * Removes recordings older than the retention period (default 3 days)
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void cleanupOldRecordings() {
        log.info("Scheduled task: Starting cleanup of old recordings");
        
        try {
            recordingService.deleteOldRecordings();
            log.info("Scheduled task: Cleanup completed");
        } catch (Exception e) {
            log.error("Scheduled task: Failed to cleanup old recordings", e);
        }
    }
}
