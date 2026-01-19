import { useEffect, useRef, useState, useCallback } from 'react';
import styles from '@/styles/VideoPlayer.module.css';

interface AudioTrack {
  id: string;
  label: string;
  language: string;
  enabled: boolean;
}

interface VideoPlayerProps {
  token: string;
  onBack: () => void;
}

export default function VideoPlayer({ token, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSkipAnimation, setShowSkipAnimation] = useState<'forward' | 'backward' | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showBuffering, setShowBuffering] = useState(false);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();
  const animationFrameId = useRef<number>();
  const skipAnimationTimeout = useRef<NodeJS.Timeout>();
  const bufferingTimeout = useRef<NodeJS.Timeout>();
  const bufferingDelayTimeout = useRef<NodeJS.Timeout>();

  const streamUrl = `/api/stream/${token}`;

  // Fetch video duration from server headers
  useEffect(() => {
    const fetchDuration = async () => {
      try {
        const response = await fetch(streamUrl, {
          method: 'HEAD'
        });
        const durationHeader = response.headers.get('X-Video-Duration');
        if (durationHeader && parseFloat(durationHeader) > 0) {
          const serverDuration = parseFloat(durationHeader);
          console.log('✓ Duration from server header:', serverDuration, 'seconds');
          setDuration(serverDuration);
        }
      } catch (err) {
        console.log('⚠ Could not fetch duration from headers:', err);
      }
    };
    
    fetchDuration();
  }, [streamUrl]);

  // Use requestAnimationFrame for smooth progress updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
      animationFrameId.current = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, isSeeking]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;

    const updateDuration = () => {
      const newDuration = video.duration;
      if (!isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
        setDuration(prevDuration => {
          // Only update if we don't have a duration yet or new duration is significantly different
          if (prevDuration === 0 || Math.abs(prevDuration - newDuration) > 1) {
            console.log('✓ Duration from video element:', newDuration, 'seconds /', (newDuration / 60).toFixed(2), 'minutes');
            return newDuration;
          }
          return prevDuration;
        });
      } else {
        console.log('✗ Invalid duration from video:', newDuration, '| readyState:', video.readyState);
      }
    };

    const handleDurationChange = () => {
      console.log('Event: durationchange');
      updateDuration();
    };
    
    const handleLoadedMetadata = () => {
      console.log('Event: loadedmetadata');
      updateDuration();
      // Force seek to 0.1 seconds to trigger full duration load
      if (video.duration && video.currentTime === 0) {
        setTimeout(() => {
          video.currentTime = 0.1;
          setTimeout(() => {
            video.currentTime = 0;
            updateDuration();
          }, 100);
        }, 100);
      }
    };
    
    const handleLoadedData = () => {
      console.log('Event: loadeddata');
      updateDuration();
    };
    
    const handleCanPlay = () => {
      console.log('Event: canplay');
      updateDuration();
    };
    
    const handleCanPlayThrough = () => {
      console.log('Event: canplaythrough');
      updateDuration();
    };
    
    const handleSeeked = () => {
      console.log('Event: seeked');
      updateDuration();
    };
    
    const handleTimeUpdate = () => {
      // Update duration during playback if it changes (for streaming)
      const newDuration = video.duration;
      if (!isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
        setDuration(prevDuration => {
          if (prevDuration === 0 || Math.abs(prevDuration - newDuration) > 1) {
            console.log('Duration updated during playback:', newDuration);
            return newDuration;
          }
          return prevDuration;
        });
      }
    };
    
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
      // Try to update duration
      updateDuration();
    };

    // Loading and buffering event handlers
    const handleLoadStart = () => {
      console.log('Event: loadstart - Video loading started');
      setIsBuffering(true);
      // Show buffering immediately on initial load
      setShowBuffering(true);
    };

    const handleWaiting = () => {
      console.log('Event: waiting - Video is waiting for data');
      setIsBuffering(true);
      // Add 300ms delay before showing spinner to avoid flicker
      if (bufferingDelayTimeout.current) {
        clearTimeout(bufferingDelayTimeout.current);
      }
      bufferingDelayTimeout.current = setTimeout(() => {
        setShowBuffering(true);
      }, 300);
    };

    const handleStalled = () => {
      console.log('Event: stalled - Video stalled');
      setIsBuffering(true);
      // Show buffering with delay
      if (bufferingDelayTimeout.current) {
        clearTimeout(bufferingDelayTimeout.current);
      }
      bufferingDelayTimeout.current = setTimeout(() => {
        setShowBuffering(true);
      }, 300);
    };

    const handleCanPlayEvent = () => {
      console.log('Event: canplay - Video can play');
      // Clear any pending buffering delays
      if (bufferingDelayTimeout.current) {
        clearTimeout(bufferingDelayTimeout.current);
      }
      // Only hide buffering if video is actually playing or about to play
      if (video.readyState >= 3) {
        setIsBuffering(false);
        setShowBuffering(false);
      }
      updateDuration();
    };

    const handlePlaying = () => {
      console.log('Event: playing - Video is playing');
      setIsBuffering(false);
      // Clear any pending buffering delays
      if (bufferingDelayTimeout.current) {
        clearTimeout(bufferingDelayTimeout.current);
      }
      setShowBuffering(false);
    };

    const handleSeeking = () => {
      console.log('Event: seeking - Video is seeking');
      setIsBuffering(true);
      // Show buffering with delay for seeks
      if (bufferingDelayTimeout.current) {
        clearTimeout(bufferingDelayTimeout.current);
      }
      bufferingDelayTimeout.current = setTimeout(() => {
        setShowBuffering(true);
      }, 300);
    };

    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlayEvent);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('seeking', handleSeeking);
    
    // Try to get duration immediately if already loaded
    updateDuration();
    
    // Aggressive polling for duration
    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 30 seconds
    const durationCheckInterval = setInterval(() => {
      pollCount++;
      updateDuration();
      
      // Stop polling once we have a valid duration or reached max polls
      if ((video.duration && !isNaN(video.duration) && isFinite(video.duration) && video.duration > 0 && video.readyState >= 2) || pollCount >= maxPolls) {
        console.log('Stopping duration polling. Duration:', video.duration, 'ReadyState:', video.readyState);
        clearInterval(durationCheckInterval);
      }
    }, 500);

    return () => {
      clearInterval(durationCheckInterval);
      if (bufferingDelayTimeout.current) {
        clearTimeout(bufferingDelayTimeout.current);
      }
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlayEvent);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, []);

  // Define all callback functions first
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying]);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Close audio menu if clicking outside of it
    const target = e.target as HTMLElement;
    if (showAudioMenu && !target.closest(`.${styles.audioMenuContainer}`)) {
      setShowAudioMenu(false);
    }
  }, [showAudioMenu]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  // Switch audio track
  const switchAudioTrack = useCallback((trackId: string) => {
    const video = videoRef.current;
    if (!video || !video.audioTracks) return;

    for (let i = 0; i < video.audioTracks.length; i++) {
      const track = video.audioTracks[i];
      const shouldEnable = track.id === trackId || i.toString() === trackId;
      track.enabled = shouldEnable;
    }

    // Update state
    setAudioTracks(prev => prev.map(track => ({
      ...track,
      enabled: track.id === trackId
    })));
    
    setShowAudioMenu(false);
    console.log('Switched to audio track:', trackId);
  }, []);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    video.currentTime = newTime;
    
    // Show skip animation
    setShowSkipAnimation(seconds > 0 ? 'forward' : 'backward');
    if (skipAnimationTimeout.current) {
      clearTimeout(skipAnimationTimeout.current);
    }
    skipAnimationTimeout.current = setTimeout(() => {
      setShowSkipAnimation(null);
    }, 500);
    
    showControlsTemporarily();
  }, [duration, showControlsTemporarily]);

  const skipForward = useCallback(() => skip(5), [skip]);
  const skipBackward = useCallback(() => skip(-5), [skip]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        if (video.muted) {
          video.muted = false;
          setIsMuted(false);
        }
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Play failed:', err);
        video.muted = true;
        setIsMuted(true);
        await video.play();
        setIsPlaying(true);
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!video.muted);
  }, []);

  const changePlaybackRate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  }, [playbackRate]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleVideoClick = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  const handleDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  }, []);

  const handleSeekEnd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
    setIsSeeking(false);
  }, []);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    video.currentTime = time;
    setCurrentTime(time);
  }, [duration]);

  const handleProgressBarHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    setHoverTime(time);
  }, [duration]);

  const handleProgressBarLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Detect and load audio tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadAudioTracks = () => {
      const tracks: AudioTrack[] = [];
      
      // Try native audioTracks API (Safari, Edge)
      if (video.audioTracks && video.audioTracks.length > 0) {
        console.log('Detected native audio tracks:', video.audioTracks.length);
        for (let i = 0; i < video.audioTracks.length; i++) {
          const track = video.audioTracks[i];
          tracks.push({
            id: track.id || `audio-${i}`,
            label: track.label || `Audio Track ${i + 1}`,
            language: track.language || 'unknown',
            enabled: track.enabled
          });
        }
      }
      // Check for HLS.js or similar multi-track support
      else if ((video as any).audioTrackList && (video as any).audioTrackList.length > 0) {
        const audioTrackList = (video as any).audioTrackList;
        console.log('Detected HLS audio tracks:', audioTrackList.length);
        for (let i = 0; i < audioTrackList.length; i++) {
          const track = audioTrackList[i];
          tracks.push({
            id: track.id || `audio-${i}`,
            label: track.name || track.label || `Audio ${i + 1}`,
            language: track.lang || track.language || 'unknown',
            enabled: track.enabled || i === 0
          });
        }
      }
      
      // Only show in UI if multiple tracks exist
      if (tracks.length > 1) {
        setAudioTracks(tracks);
        console.log('Audio tracks available for selection:', tracks);
      } else if (tracks.length === 1) {
        console.log('Only one audio track available, hiding audio menu');
        setAudioTracks([]);
      } else {
        console.log('No additional audio tracks detected');
        setAudioTracks([]);
      }
    };

    video.addEventListener('loadedmetadata', loadAudioTracks);
    video.addEventListener('canplay', loadAudioTracks);
    
    // Try immediately if already loaded
    if (video.readyState >= 1) {
      loadAudioTracks();
    }

    return () => {
      video.removeEventListener('loadedmetadata', loadAudioTracks);
      video.removeEventListener('canplay', loadAudioTracks);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Prevent default for all our shortcuts
      if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F', 'm', 'M', 'j', 'J', 'l', 'L'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case ' ':
          togglePlay();
          showControlsTemporarily();
          break;
        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 10);
          showControlsTemporarily();
          break;
        case 'ArrowRight':
          video.currentTime = Math.min(duration, video.currentTime + 10);
          showControlsTemporarily();
          break;
        case 'j':
        case 'J':
          skipBackward();
          break;
        case 'l':
        case 'L':
          skipForward();
          break;
        case 'ArrowUp':
          video.volume = Math.min(1, video.volume + 0.1);
          showControlsTemporarily();
          break;
        case 'ArrowDown':
          video.volume = Math.max(0, video.volume - 0.1);
          showControlsTemporarily();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          showControlsTemporarily();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [duration, togglePlay, skipForward, skipBackward, showControlsTemporarily, toggleFullscreen, toggleMute]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const preventDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      ref={containerRef}
      className={styles.playerContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      onContextMenu={preventDownload}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={streamUrl}
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={preventDownload}
        controlsList="nodownload"
        disablePictureInPicture
        preload="auto"
        crossOrigin="anonymous"
        onError={(e) => {
          const video = videoRef.current;
          console.error('Video error:', e);
          console.error('Error code:', video?.error?.code);
          console.error('Error message:', video?.error?.message);
          alert('Failed to load video. Please check the URL and try again.');
        }}
        onLoadStart={() => console.log('Video loading started')}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          console.log('=== Video Metadata Loaded ===');
          console.log('Duration:', video?.duration, 'seconds');
          console.log('ReadyState:', video?.readyState);
          console.log('Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);
          console.log('Video tracks:', video?.videoTracks?.length);
          console.log('Audio tracks:', video?.audioTracks?.length);
          console.log('Has audio:', video?.mozHasAudio || video?.webkitAudioDecodedByteCount > 0 || Boolean(video?.audioTracks?.length));
          console.log('===========================');
          
          // Force duration update
          if (video && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
            setDuration(video.duration);
          }
        }}
        onDurationChange={() => {
          const video = videoRef.current;
          if (video) {
            console.log('Duration changed:', video.duration, 'seconds');
          }
        }}
        onCanPlay={() => console.log('Video can play')}
        onVolumeChange={() => {
          const video = videoRef.current;
          console.log('Volume:', video?.volume, 'Muted:', video?.muted);
        }}
      />

      {/* Netflix-style loading spinner */}
      {showBuffering && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
        </div>
      )}

      {/* Large centered play button when paused */}
      {!isPlaying && showControls && !showBuffering && (
        <div className={styles.centerPlayButton} onClick={togglePlay}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}

      {/* Skip animation overlay */}
      {showSkipAnimation && (
        <div className={`${styles.skipAnimation} ${styles[showSkipAnimation]}`}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
            {showSkipAnimation === 'backward' ? (
              <>
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="12" y="16" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">5</text>
              </>
            ) : (
              <>
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="12" y="16" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">5</text>
              </>
            )}
          </svg>
        </div>
      )}

      <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
        <div 
          ref={progressBarRef}
          className={styles.progressBarContainer}
          onClick={handleProgressBarClick}
          onMouseMove={handleProgressBarHover}
          onMouseLeave={handleProgressBarLeave}
        >
          <div className={styles.progressBar}>
            <div 
              className={styles.buffered}
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            <div 
              className={styles.played}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              className={styles.seekBar}
              aria-label="Seek video"
            />
          </div>
          
          {/* Hover time preview */}
          {hoverTime !== null && (
            <div 
              className={styles.timePreview}
              style={{ left: `${(hoverTime / duration) * 100}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className={styles.controlsBottom}>
          <div className={styles.leftControls}>
            <button 
              onClick={togglePlay} 
              className={styles.playButton}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Skip backward button */}
            {duration > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  skipBackward();
                }}
                className={styles.skipButtonBottom}
                aria-label="Rewind 5 seconds (J)"
                title="Rewind 5 seconds (J)"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  <text x="12" y="15.5" fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">5</text>
                </svg>
              </button>
            )}

            {/* Skip forward button */}
            {duration > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  skipForward();
                }}
                className={styles.skipButtonBottom}
                aria-label="Fast forward 5 seconds (L)"
                title="Fast forward 5 seconds (L)"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                  <text x="12" y="15.5" fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">5</text>
                </svg>
              </button>
            )}

            <div className={styles.volumeControl}>
              <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted || volume === 0 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : volume < 0.5 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
                aria-label="Volume"
              />
            </div>

            <span className={styles.time}>
              {formatTime(currentTime)} {duration > 0 ? `-${formatTime(duration - currentTime)}` : ''}
            </span>
          </div>

          <div className={styles.rightControls}>
            {/* Audio & Subtitles button (only show if multiple tracks) */}
            {audioTracks.length > 1 && (
              <div className={styles.audioMenuContainer}>
                <button 
                  onClick={() => setShowAudioMenu(!showAudioMenu)}
                  className={styles.audioButton}
                  aria-label="Audio & Subtitles"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
                  </svg>
                </button>
                
                {showAudioMenu && (
                  <div className={styles.audioMenu}>
                    <div className={styles.audioMenuHeader}>Audio & Subtitles</div>
                    <div className={styles.audioMenuSection}>
                      <div className={styles.audioMenuLabel}>Audio</div>
                      {audioTracks.map(track => (
                        <button
                          key={track.id}
                          className={`${styles.audioMenuItem} ${track.enabled ? styles.active : ''}`}
                          onClick={() => switchAudioTrack(track.id)}
                        >
                          <span>{track.label}</span>
                          {track.enabled && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={changePlaybackRate} 
              className={styles.speedButton}
              aria-label={`Playback speed: ${playbackRate}x`}
            >
              {playbackRate}x
            </button>

            <button 
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>

            <button onClick={onBack} className={styles.closeButton} aria-label="Close player">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
