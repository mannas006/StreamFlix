# 🎬 StreamFlix - Instant Media Streaming Platform

> A Netflix-style streaming platform with instant playback, audio transcoding, and HTTP byte-range streaming

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

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

Deployed on Render at: https://streamflix-qjhn.onrender.com

## Security Features

- Token-based streaming URLs
- 1-hour token expiration
- No direct file access
- Right-click disabled
- Download button hidden
- Content-Type validation
- No permanent file storage

## Performance

- Playback starts in 1-3 seconds
- Progressive loading (no full download)
- Efficient memory usage
- Nginx caching for repeated requests
- Support for seeking without reload

## License

MIT

## Documentation

- [FEATURES.md](FEATURES.md) - Complete feature list and technical details
- [PLAYER_DESIGN.md](PLAYER_DESIGN.md) - Netflix-style player design details
