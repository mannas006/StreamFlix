# StreamFlix Features

## 🎬 Netflix-Style Video Player

### Visual Design
- **Dark minimal theme** - Pure black background with subtle gradients
- **Hidden controls by default** - Fade in on mouse movement
- **Large centered play button** - Appears when video is paused
- **Smooth animations** - All transitions use CSS transitions and requestAnimationFrame
- **No browser controls** - Fully custom player interface

### Control Bar Features
- **Play/Pause button** - Left side with smooth icon transitions
- **Time display** - Current time / Total duration
- **Seek bar** with:
  - Buffered progress indicator (gray)
  - Played progress (Netflix red)
  - Smooth scrubbing without lag
  - Hover preview showing timestamp
  - Click to jump instantly
- **Volume control** with:
  - Mute/unmute toggle
  - Expandable slider on hover
  - Visual volume level indicator
- **Playback speed selector** - 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- **Fullscreen toggle** - Right side
- **Close button** - Exit player

### Interaction & UX
- **Click video** - Toggle play/pause
- **Double-click video** - Toggle fullscreen
- **Mouse move** - Show controls
- **Mouse idle (2.5s)** - Hide controls automatically
- **Mouse leave** - Hide controls if playing

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Toggle play/pause |
| `←` | Seek backward 10 seconds |
| `→` | Seek forward 10 seconds |
| `↑` | Increase volume |
| `↓` | Decrease volume |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |

### Performance Optimizations
- **requestAnimationFrame** for progress updates
- **No layout reflow** - Controls use transform and opacity
- **Minimal re-renders** - useCallback for all handlers
- **Smooth seeking** - Separate seeking state prevents jank
- **Will-change hints** - GPU acceleration for animations

### Accessibility
- **ARIA labels** on all controls
- **Keyboard navigation** - Full keyboard support
- **Focus indicators** - Visible focus outlines
- **Reduced motion** - Respects prefers-reduced-motion
- **Screen reader friendly** - Semantic HTML

## 🎵 Audio Transcoding

### Problem Solved
MKV files often contain audio codecs (AC3, DTS, Dolby Atmos) that browsers cannot decode natively. This results in video playing without sound.

### Solution
Real-time FFmpeg transcoding that:
- **Copies video** without re-encoding (fast, no quality loss)
- **Converts audio** to AAC 192kbps (browser-compatible)
- **Streams immediately** - No waiting for full transcode
- **Minimal CPU usage** - Only audio is processed

### How to Use
1. Enable "Audio Transcoding" checkbox when pasting URL
2. Click "Start Streaming"
3. Video plays with sound!

### Technical Details
- Uses FFmpeg with `-c:v copy -c:a aac` flags
- Outputs fragmented MP4 for streaming
- Handles client disconnection gracefully
- Logs FFmpeg output for debugging

## 🔒 Security Features

### Token-Based Streaming
- **JWT tokens** with 1-hour expiration
- **No direct file access** - URLs are proxied
- **Token verification** on every stream request

### Download Prevention
- **Right-click disabled** on video element
- **controlsList="nodownload"** attribute
- **No visible download button**
- **Content-Type validation**

### Privacy
- **No file storage** - Direct proxy streaming
- **No logging of media URLs** (in production mode)
- **CORS protection**
- **X-Content-Type-Options: nosniff**

## 📡 HTTP Range Streaming

### Instant Playback
- **Byte-range requests** - Load only what's needed
- **Progressive loading** - Playback starts in 1-3 seconds
- **Seeking support** - Jump to any position instantly
- **Buffering indicator** - Shows what's loaded

### Technical Implementation
- **206 Partial Content** responses
- **Accept-Ranges: bytes** header
- **Content-Range** header with proper byte ranges
- **5MB chunks** for optimal performance

### Benefits
- No waiting for full download
- Efficient bandwidth usage
- Fast seeking
- Works with large files (GB+)

## 🎨 Responsive Design

### Desktop
- Full-size player
- All controls visible
- Volume slider expands on hover
- Keyboard shortcuts enabled

### Mobile
- Touch-optimized controls
- Larger touch targets
- Volume control hidden (use device volume)
- Simplified layout

### Tablet
- Hybrid layout
- Touch and keyboard support
- Optimized spacing

## 🚀 Performance

### Metrics
- **First paint**: < 1 second
- **Playback start**: 1-3 seconds
- **Seeking**: Instant
- **CPU usage**: 10-30% (with transcoding)
- **Memory**: < 200MB

### Optimizations
- Code splitting with Next.js
- CSS modules for scoped styles
- No unnecessary dependencies
- Efficient state management
- GPU-accelerated animations

## 📦 Supported Formats

### Video Codecs
- H.264 (MP4)
- VP8/VP9 (WebM)
- AV1 (WebM)

### Audio Codecs (Native)
- AAC (MP4)
- Opus (WebM)
- Vorbis (WebM)
- MP3

### Audio Codecs (Transcoded)
- AC3 / Dolby Digital
- DTS
- Dolby Atmos
- TrueHD
- Any FFmpeg-supported codec

### Container Formats
- MP4
- WebM
- MKV (with transcoding)

## 🛠️ Development Features

### Hot Reload
- Next.js fast refresh
- Instant updates during development

### Error Handling
- Graceful error messages
- Console logging for debugging
- Video error detection
- Network error recovery

### Logging
- Server request logging
- FFmpeg output logging
- Video event logging
- Performance metrics

## 🌐 Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Partial Support
- Older browsers (no fullscreen API)
- Mobile browsers (limited keyboard)

### Requirements
- HTML5 video support
- JavaScript enabled
- Modern CSS support
