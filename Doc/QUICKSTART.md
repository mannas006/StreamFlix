# StreamFlix Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js (frontend framework)
- Express (backend server)
- FFmpeg wrapper (for transcoding)
- Concurrently (run multiple servers)

### Step 2: Install FFmpeg (Optional but Recommended)

FFmpeg is needed for audio transcoding of MKV files.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**Windows:**
```bash
choco install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

### Step 3: Start the Platform

**Option A: One Command (Recommended)**
```bash
npm run dev:all
```

**Option B: Using Start Script**
```bash
./start.sh
```

**Option C: Separate Terminals**
```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

## 🎬 Using the Platform

### 1. Open in Browser
Navigate to: **http://localhost:3000**

### 2. Paste a Media URL
Example URLs:
```
https://example.com/video.mp4
https://cdn.example.com/movie.mkv
https://storage.example.com/audio.mp3
```

### 3. Enable Transcoding (if needed)
- ✅ Check "Enable audio transcoding" for MKV files
- ✅ Required for AC3/DTS/Dolby audio codecs
- ❌ Not needed for MP4 with AAC audio

### 4. Click "Start Streaming"
Video starts playing in 1-3 seconds!

## 🎮 Player Controls

### Mouse Controls
- **Click video** → Play/Pause
- **Double-click** → Fullscreen
- **Hover seek bar** → Preview time
- **Click seek bar** → Jump to position

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Rewind 10s |
| `→` | Forward 10s |
| `↑` | Volume up |
| `↓` | Volume down |
| `F` | Fullscreen |
| `M` | Mute |

## 📊 What You'll See

### Terminal Output
```
[backend] Streaming server running on http://localhost:3001
[frontend] ▲ Next.js 14.2.35
[frontend] - Local: http://localhost:3000
[frontend] ✓ Ready in 1889ms
```

### Browser Console (F12)
```
Video loading started
Video metadata loaded
Duration: 7200
Video can play
```

## ⚡ Quick Tips

### For Best Performance
- Use MP4 files with AAC audio (no transcoding needed)
- Enable transcoding only for MKV files
- Use fast, reliable hosting for media files

### For Best Quality
- Use 1080p or higher resolution
- Ensure good audio quality in source
- Use high bitrate source files

### Troubleshooting
| Problem | Solution |
|---------|----------|
| No sound | Enable transcoding checkbox |
| Slow loading | Check internet speed |
| Video won't load | Verify URL is accessible |
| Controls not showing | Move mouse or press Space |

## 🛑 Stopping the Platform

Press `Ctrl+C` in the terminal to stop both servers.

## 📚 Next Steps

- Read [USAGE.md](USAGE.md) for detailed usage guide
- Check [FEATURES.md](FEATURES.md) for complete feature list
- See [PLAYER_DESIGN.md](PLAYER_DESIGN.md) for design details

## 🆘 Need Help?

### Check Logs
**Browser Console (F12):**
- Video errors
- Network issues

**Terminal:**
- Server logs
- FFmpeg output

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**FFmpeg not found:**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Linux
```

**Dependencies not installed:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Example Workflow

### 1. First Time Setup
```bash
# Clone or download the project
cd streaming-platform

# Install dependencies
npm install

# Install FFmpeg (if not already installed)
brew install ffmpeg

# Start the platform
npm run dev:all
```

### 2. Daily Usage
```bash
# Start servers
npm run dev:all

# Open browser to http://localhost:3000
# Paste media URL
# Enable transcoding if needed
# Click "Start Streaming"
# Enjoy!
```

### 3. Stopping
```bash
# Press Ctrl+C in terminal
# Servers stop automatically
```

## 🔥 Pro Tips

### Faster Startup
```bash
# Keep servers running during development
# Just refresh browser to see changes
```

### Testing Different Files
```bash
# Test MP4 (no transcoding)
https://example.com/video.mp4

# Test MKV (with transcoding)
https://example.com/movie.mkv
```

### Keyboard Shortcuts
```bash
# Master these for Netflix-like experience
Space - Play/Pause
F - Fullscreen
← → - Seek
↑ ↓ - Volume
M - Mute
```

## 📱 Mobile Usage

1. Start servers on your computer
2. Find your local IP: `ifconfig | grep inet`
3. Open on mobile: `http://YOUR_IP:3000`
4. Paste URL and stream!

## 🌐 Production Deployment

For production use:
```bash
# Build frontend
npm run build

# Start production servers
npm start  # Frontend
npm run server  # Backend

# Use Nginx for reverse proxy (see nginx.conf)
```

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] FFmpeg installed (optional)
- [ ] Dependencies installed (`npm install`)
- [ ] Servers running (`npm run dev:all`)
- [ ] Browser open to http://localhost:3000
- [ ] Media URL ready to paste
- [ ] Transcoding enabled (if MKV)
- [ ] Video playing with sound!

## 🎉 You're Ready!

Your Netflix-style streaming platform is now running. Paste any media URL and start streaming instantly!
