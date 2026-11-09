import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

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
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        liveSyncDurationCount: 5,
        liveMaxLatencyDurationCount: 15,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 8,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed successfully");
        // Try to play with sound first
        video.muted = false;
        video.play().catch((err) => {
          console.log("Autoplay with sound prevented, trying muted:", err);
          // If failed, try muted autoplay
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
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetryCount < MAX_NETWORK_RETRIES) {
                networkRetryCount++;
                console.log(`Network error, retrying (${networkRetryCount}/${MAX_NETWORK_RETRIES}) in 2s...`);
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
      // Native HLS support (Safari)
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        // Try to play with sound first
        video.muted = false;
        video.play().catch((err) => {
          console.log("Autoplay with sound prevented, trying muted:", err);
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .catch((err2) => console.log("Autoplay prevented:", err2));
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
    }
  };

  return (
    <div className="video-player-wrapper">
      <video
        ref={videoRef}
        poster="https://res.cloudinary.com/duklfdbqf/image/upload/v1794207357/Gemini_Generated_Image_of30onof30onof30_pqgmxe.webp"
        controls
        className="video-player"
        playsInline
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        style={{ objectFit: "contain" }}
      />
      {isMuted && (
        <button className="unmute-button" onClick={handleUnmute}>
          🔊 Bật tiếng
        </button>
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
