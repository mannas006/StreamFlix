# 🎬 StreamFlix - Instant Media Streaming Platform

> A Netflix-style streaming platform with instant playback, audio transcoding, and HTTP byte-range streaming

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

## ⚡ Quick Start (One Command)

```bash
npm install
npm run dev:all
```

Open **http://localhost:3000** and start streaming!

👉 See [QUICKSTART.md](QUICKSTART.md) for detailed setup guide.

## Features

✓ **Netflix-Style Player** - Exact replica of Netflix's web player UI
✓ **Instant Playback** - Stream starts within seconds using progressive loading
✓ **HTTP Range Requests** - Efficient chunk-based streaming with seek support
✓ **Audio Transcoding** - Automatically converts incompatible audio (AC3/DTS) to AAC
✓ **Audio Track Selection** - Switch between multiple audio languages during playback
✓ **5-Second Skip Controls** - Netflix-style quick skip buttons (J/L keys)
✓ **Token-Based Security** - Secure streaming URLs with 1-hour expiration
✓ **Advanced Controls** - Play/pause, seek, volume, speed, fullscreen
✓ **Keyboard Shortcuts** - Space, arrows, J, L, F, M for quick control
✓ **Click to Play** - Click anywhere on video to toggle playback
✓ **Double-Click Fullscreen** - Quick fullscreen access
✓ **Hover Preview** - See timestamp when hovering over seek bar
✓ **Auto-Hide Controls** - Controls fade out after 2.5 seconds
✓ **Large Play Button** - Centered play icon when paused
✓ **Smooth Animations** - requestAnimationFrame for 60fps updates
✓ **No Downloads** - Direct streaming without file downloads
✓ **Responsive Design** - Works on desktop and mobile
✓ **Accessibility** - Full keyboard navigation and ARIA labels

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Node.js, Express
- **Transcoding**: FFmpeg (for audio conversion)
- **Proxy**: Nginx (optional, for production)
- **Security**: JWT tokens, no-download protection

## Quick Start

### Prerequisites

- Node.js 18+ installed
- FFmpeg installed (for audio transcoding)

**Install FFmpeg:**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg
```

See [INSTALL_FFMPEG.md](INSTALL_FFMPEG.md) for detailed instructions.

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Both Servers (One Command)

```bash
npm run dev:all
```

Or use the start script:
```bash
./start.sh
```

This will start:
- Backend server on http://localhost:3001
- Frontend on http://localhost:3000

### 3. Alternative: Start Servers Separately

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

### 4. Use the Platform

1. Open http://localhost:3000
2. Paste a direct media URL (MP4, MKV, WEBM, MP3)
3. Enable "Audio Transcoding" for MKV files with incompatible audio
4. Click "Start Streaming"
5. Enjoy instant playback with sound!

## Audio Transcoding

MKV files often contain audio codecs (AC3, DTS, Dolby Atmos) that browsers cannot play. The platform automatically transcodes audio to AAC in real-time when enabled:

- **Video**: Copied without re-encoding (fast)
- **Audio**: Converted to AAC 192kbps
- **Performance**: Minimal CPU usage, starts streaming in seconds
- **Quality**: No video quality loss

Enable the "Audio Transcoding" checkbox when pasting MKV URLs.

## Supported Formats

- Video: MP4, WEBM, MKV
- Audio: MP3, WEBM

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Toggle play/pause |
| `←` | Seek backward 10 seconds |
| `→` | Seek forward 10 seconds |
| `J` | **Skip backward 5 seconds** |
| `L` | **Skip forward 5 seconds** |
| `↑` | Increase volume |
| `↓` | Decrease volume |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |

## Mouse Controls

- **Click video** - Toggle play/pause
- **Double-click video** - Toggle fullscreen
- **Click skip buttons** - Skip 5 seconds forward/backward
- **Hover seek bar** - Preview timestamp
- **Click seek bar** - Jump to position
- **Mouse idle** - Auto-hide controls (2.5s)

## Production Deployment

### With Nginx (Recommended)

1. Install Nginx
2. Copy nginx.conf to your Nginx config directory
3. Start services:

```bash
npm run build
npm start
npm run server
nginx -c /path/to/nginx.conf
```

### Environment Variables

Create `.env.local`:

```
SECRET_KEY=your-secure-secret-key-here
TOKEN_EXPIRY=1h
```

## Security Features

- Token-based streaming URLs
- 1-hour token expiration
- No direct file access
- Right-click disabled
- Download button hidden
- Content-Type validation
- No permanent file storage

## API Endpoints

### POST /api/generate-token
Generate streaming token from media URL

**Request:**
```json
{
  "url": "https://example.com/video.mp4",
  "transcode": false
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "streamUrl": "/api/stream/eyJhbGc..."
}
```

### GET /api/stream/:token
Stream media with range support

**Headers:**
- `Range: bytes=0-1023` (optional)

**Response:**
- Status: 200 (full) or 206 (partial)
- Headers: Content-Range, Accept-Ranges, Content-Type

## Architecture

```
User → Frontend (Next.js) → Backend (Express) → External Media URL
                                ↓
                          JWT Token Auth
                                ↓
                        Range Request Proxy
                                ↓
                        Chunked Streaming
```

## Performance

- Playback starts in 1-3 seconds
- Progressive loading (no full download)
- Efficient memory usage
- Nginx caching for repeated requests
- Support for seeking without reload

## License

MIT

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev:all` | **Start both servers (recommended)** |
| `npm run server` | Start backend only (port 3001) |
| `npm run dev` | Start frontend only (port 3000) |
| `npm run build` | Build for production |
| `npm start` | Start production frontend |
| `./start.sh` | Alternative start script |

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get started in 3 steps
- [FEATURES.md](FEATURES.md) - Complete feature list and technical details
- [USAGE.md](USAGE.md) - Comprehensive usage guide and troubleshooting
- [PLAYER_DESIGN.md](PLAYER_DESIGN.md) - Netflix-style player design details
- [INSTALL_FFMPEG.md](INSTALL_FFMPEG.md) - FFmpeg installation instructions

## Quick Start Script

```bash
./start.sh
```

This starts both backend and frontend servers automatically.
