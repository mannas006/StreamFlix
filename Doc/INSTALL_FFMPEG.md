# FFmpeg Installation Guide

FFmpeg is required for audio transcoding to fix incompatible audio codecs in MKV files.

## macOS

### Using Homebrew (Recommended)
```bash
brew install ffmpeg
```

### Verify Installation
```bash
ffmpeg -version
```

## Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Linux (CentOS/RHEL)
```bash
sudo yum install ffmpeg
```

## Windows

### Using Chocolatey
```bash
choco install ffmpeg
```

### Manual Installation
1. Download from: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH

## Verify Installation

After installation, verify FFmpeg is working:
```bash
ffmpeg -version
```

You should see FFmpeg version information.

## Why FFmpeg?

MKV files often contain audio codecs (AC3, DTS, TrueHD) that browsers cannot play. FFmpeg transcodes the audio to AAC in real-time while keeping the video unchanged, enabling playback with sound.

## Performance

- Video is copied (no re-encoding) - very fast
- Only audio is transcoded to AAC
- Streaming starts within seconds
- CPU usage: ~10-30% depending on file
