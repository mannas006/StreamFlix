# StreamFlix Usage Guide

## Quick Start

### 1. Start the Platform

**Option A: One Command (Recommended)**
```bash
npm run dev:all
```

**Option B: Using the start script**
```bash
./start.sh
```

**Option C: Manual start (separate terminals)**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

All options start:
- Backend server on http://localhost:3001
- Frontend on http://localhost:3000

### 2. Open in Browser
Navigate to: http://localhost:3000

### 3. Stream a Video

1. **Paste a media URL** in the input field
   - Must be a direct link to a media file
   - Supported: MP4, MKV, WEBM, MP3

2. **Enable transcoding** (if needed)
   - Check "Enable audio transcoding" for MKV files
   - Required for AC3/DTS/Dolby audio codecs

3. **Click "Start Streaming"**
   - Video loads in 1-3 seconds
   - Controls appear on mouse move

## Player Controls

### Mouse Controls
- **Click video** → Play/Pause
- **Double-click video** → Fullscreen
- **Move mouse** → Show controls
- **Hover seek bar** → Preview timestamp
- **Click seek bar** → Jump to position
- **Drag seek bar** → Scrub through video

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `←` | Rewind 10 seconds |
| `→` | Forward 10 seconds |
| `↑` | Volume up |
| `↓` | Volume down |
| `F` | Fullscreen |
| `M` | Mute/Unmute |

### Control Bar
```
[▶] [🔊] [0:45 / 2:30:15] ────────────── [1x] [⛶] [✕]
 │    │         │                          │    │   │
 │    │         │                          │    │   └─ Close
 │    │         │                          │    └───── Fullscreen
 │    │         │                          └────────── Speed
 │    │         └───────────────────────────────────── Time
 │    └─────────────────────────────────────────────── Volume
 └──────────────────────────────────────────────────── Play/Pause
```

## Audio Transcoding

### When to Enable
Enable transcoding if:
- ✅ File is MKV format
- ✅ Video plays but no sound
- ✅ File has AC3/DTS/Dolby audio
- ✅ Browser console shows audio codec errors

### When NOT to Enable
Don't enable if:
- ❌ File is MP4 with AAC audio (already compatible)
- ❌ File is WebM with Opus audio (already compatible)
- ❌ You want fastest possible startup (transcoding adds 1-2s)

### How It Works
1. Server receives your URL
2. FFmpeg starts transcoding on-the-fly
3. Video is copied (no re-encoding)
4. Audio is converted to AAC
5. Stream starts immediately
6. Transcoding continues as you watch

### Performance Impact
- **CPU**: 10-30% usage
- **Startup**: +1-2 seconds
- **Quality**: No video quality loss
- **Audio**: 192kbps AAC (high quality)

## Finding Media URLs

### Valid URL Examples
```
✅ https://example.com/video.mp4
✅ https://cdn.example.com/movie.mkv
✅ https://storage.example.com/file.webm?token=abc123
✅ https://r2.cloudflarestorage.com/video.mp4?signature=xyz
```

### Invalid URL Examples
```
❌ https://youtube.com/watch?v=abc123 (not a direct file)
❌ https://example.com/video (no file extension)
❌ https://example.com/embed/video (embedded player)
❌ file:///local/video.mp4 (local file)
```

### How to Get Direct URLs
1. **Cloud Storage**: Use direct download links from Dropbox, Google Drive, etc.
2. **CDN**: Get the actual file URL, not the page URL
3. **Self-hosted**: Use your own server's direct file URLs
4. **Signed URLs**: Temporary URLs from cloud services work great

## Troubleshooting

### Video Won't Load
**Problem**: "Failed to load video" error

**Solutions**:
1. Check if URL is accessible (try opening in new tab)
2. Verify URL is a direct file link
3. Check if URL requires authentication
4. Try a different video file

### No Sound
**Problem**: Video plays but no audio

**Solutions**:
1. ✅ Enable "Audio Transcoding" checkbox
2. Check browser volume/mute
3. Check system volume
4. Try unmuting with `M` key
5. Check browser console for codec errors

### Slow Loading
**Problem**: Takes too long to start

**Solutions**:
1. Check your internet speed
2. Try a smaller file
3. Check if source server is slow
4. Disable transcoding if not needed

### Controls Not Showing
**Problem**: Can't see player controls

**Solutions**:
1. Move your mouse
2. Press `Space` to show controls
3. Check if browser is in fullscreen
4. Refresh the page

### Seeking Not Working
**Problem**: Can't jump to different positions

**Solutions**:
1. Wait for more buffering
2. Check if source supports range requests
3. Try clicking instead of dragging
4. Refresh and try again

### Transcoding Fails
**Problem**: "Transcoding failed" error

**Solutions**:
1. Verify FFmpeg is installed: `ffmpeg -version`
2. Check server logs for FFmpeg errors
3. Try without transcoding
4. Check if file format is supported

## Advanced Usage

### Custom Playback Speed
1. Click the speed button (shows "1x")
2. Cycles through: 0.5x → 0.75x → 1x → 1.25x → 1.5x → 2x
3. Or use browser console: `document.querySelector('video').playbackRate = 1.5`

### Keyboard-Only Navigation
1. Tab to focus controls
2. Use arrow keys to adjust
3. Enter to activate buttons
4. Escape to exit fullscreen

### Mobile Usage
1. Paste URL on desktop
2. Enable transcoding if needed
3. Use device volume controls
4. Tap video to play/pause
5. Double-tap for fullscreen

### Sharing Sessions
⚠️ **Security Note**: Tokens expire after 1 hour

To share:
1. Generate a streaming token
2. Share the token (not the original URL)
3. Recipient uses same token
4. Token expires automatically

## Best Practices

### For Best Performance
- ✅ Use MP4 files with H.264 video and AAC audio
- ✅ Keep file sizes reasonable (< 5GB)
- ✅ Use fast, reliable hosting
- ✅ Enable transcoding only when needed

### For Best Quality
- ✅ Use high bitrate source files
- ✅ Avoid re-encoding if possible
- ✅ Use 1080p or higher resolution
- ✅ Ensure good audio quality in source

### For Best Security
- ✅ Use signed/temporary URLs
- ✅ Don't share original URLs publicly
- ✅ Let tokens expire naturally
- ✅ Use HTTPS for all URLs

## API Usage

### Generate Token
```bash
curl -X POST http://localhost:3001/api/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "transcode": false
  }'
```

**Response**:
```json
{
  "token": "eyJhbGc...",
  "streamUrl": "/api/stream/eyJhbGc..."
}
```

### Stream Video
```bash
curl -H "Range: bytes=0-1023" \
  http://localhost:3001/api/stream/TOKEN
```

## Tips & Tricks

### Faster Seeking
- Click the seek bar instead of dragging
- Use keyboard arrows for precise control
- Wait for buffering before seeking far ahead

### Better Audio
- Enable transcoding for MKV files
- Use headphones for best experience
- Adjust system volume, not just player volume

### Smooth Playback
- Close other tabs/apps
- Use wired internet if possible
- Let video buffer before seeking
- Lower playback speed if stuttering

### Fullscreen Tips
- Press `F` for instant fullscreen
- Double-click video for fullscreen
- Press `Esc` to exit
- Controls still work in fullscreen

## Limitations

### Current Limitations
- No subtitle support (yet)
- No quality selection (uses source quality)
- No playlist support
- No chromecast/airplay
- Transcoding requires FFmpeg

### Browser Limitations
- Safari: Limited codec support
- Mobile: No keyboard shortcuts
- Old browsers: May not support all features

### File Limitations
- Must be direct file URLs
- Must be publicly accessible or signed
- Large files (>10GB) may be slow
- Some codecs require transcoding

## Getting Help

### Check Logs
**Browser Console** (F12):
- Video errors
- Network issues
- JavaScript errors

**Server Logs**:
- Request logging
- FFmpeg output
- Streaming errors

### Common Error Messages
| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid or expired token" | Token is old | Generate new token |
| "Unable to access media file" | URL not accessible | Check URL |
| "Unsupported media type" | Wrong file type | Use MP4/MKV/WEBM |
| "Transcoding failed" | FFmpeg error | Check FFmpeg install |

### Need More Help?
1. Check server logs
2. Check browser console
3. Try a different file
4. Restart servers
5. Check FFmpeg installation
