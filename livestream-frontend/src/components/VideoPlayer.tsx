import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Global 1-tap/click/scroll listener to automatically unmute audio on user gesture
  useEffect(() => {
    const handleUserGesture = () => {
      const video = videoRef.current;
      if (video && video.muted) {
        video.muted = false;
        setIsMuted(false);
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    };

    // Attach to capture phase so ANY first interaction (tap screen, scroll, click) activates sound
    window.addEventListener("click", handleUserGesture, { capture: true, passive: true });
    window.addEventListener("touchstart", handleUserGesture, { capture: true, passive: true });
    window.addEventListener("scroll", handleUserGesture, { capture: true, passive: true });
    window.addEventListener("keydown", handleUserGesture, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleUserGesture, { capture: true });
      window.removeEventListener("touchstart", handleUserGesture, { capture: true });
      window.removeEventListener("scroll", handleUserGesture, { capture: true });
      window.removeEventListener("keydown", handleUserGesture, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !hlsUrl) return;

    const video = videoRef.current;
    setError(null);

    console.log("Initializing HLS.js with URL:", hlsUrl);

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 2,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 8,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed successfully");
        // Try to play with sound first
        video.muted = false;
        video
          .play()
          .then(() => {
            setIsMuted(false);
          })
          .catch((err) => {
            console.log("Autoplay with sound prevented by browser, trying muted:", err);
            // If prevented by browser policy, play muted and let user gesture unmute
            video.muted = true;
            setIsMuted(true);
            video.play().catch((err2) => {
              console.log("Autoplay prevented:", err2);
            });
          });
      });

      let networkRetryCount = 0;
      const MAX_NETWORK_RETRIES = 5;

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          // Unstick buffer stall immediately
          if (video && !video.paused && video.readyState >= 2) {
            video.currentTime += 0.1;
          }
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetryCount < MAX_NETWORK_RETRIES) {
                networkRetryCount++;
                console.log(
                  `Network error, retrying (${networkRetryCount}/${MAX_NETWORK_RETRIES}) in 2s...`
                );
                setTimeout(() => {
                  hls.startLoad();
                }, 2000);
              } else {
                setError("Mất kết nối mạng khi tải stream. Vui lòng tải lại trang.");
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              setError("Lỗi phát video: " + data.details);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (iOS Safari)
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        video.muted = false;
        video
          .play()
          .then(() => {
            setIsMuted(false);
          })
          .catch((err) => {
            console.log("Autoplay with sound prevented on iOS, trying muted:", err);
            video.muted = true;
            setIsMuted(true);
            video.play().catch((err2) => console.log("Autoplay prevented:", err2));
          });
      });
    } else {
      setError("Trình duyệt không hỗ trợ HLS streaming");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div ref={wrapperRef} className={`video-player-wrapper ${isFullscreen ? "is-fullscreen" : ""}`}>
      <video
        ref={videoRef}
        poster="https://res.cloudinary.com/duklfdbqf/image/upload/v1794207357/Gemini_Generated_Image_of30onof30onof30_pqgmxe.webp"
        controls
        className="video-player"
        playsInline
        controlsList="nodownload"
        style={{ objectFit: "contain" }}
        onClick={isMuted ? handleUnmute : undefined}
      />

      {/* Floating Action Bar Overlay */}
      {isMuted && (
        <div className="player-floating-bar">
          <button
            className="player-action-pill sound-pill"
            onClick={handleUnmute}
            title="Bấm để bật âm thanh"
          >
            🔊 Bật tiếng
          </button>
        </div>
      )}

      {error && (
        <div className="video-error-message">
          <p>{error}</p>
          <p>Vui lòng thử lại sau.</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;