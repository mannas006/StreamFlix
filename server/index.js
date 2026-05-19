const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';

// Try to find ffprobe path
try {
  const { execSync } = require('child_process');
  const ffprobePath = execSync('which ffprobe').toString().trim();
  if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath);
    console.log('FFprobe path set to:', ffprobePath);
  }
} catch (err) {
  console.log('Could not find ffprobe in PATH, using default');
}

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Helper function to get video metadata (duration and audio tracks) using FFmpeg/ffprobe
const getVideoMetadata = async (url) => {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration:stream=index,codec_name,codec_type -show_entries stream_tags=language,title -of json "${url}"`
    );
    const data = JSON.parse(stdout);
    const duration = parseFloat(data.format?.duration || 0);
    
    const audioTracks = (data.streams || [])
      .filter(s => s.codec_type === 'audio')
      .map((s, idx) => {
        const lang = s.tags?.language || 'unknown';
        const title = s.tags?.title || '';
        return {
          id: s.index.toString(),
          label: title ? `${title} (${s.codec_name})` : `Audio Track ${idx + 1} (${lang} - ${s.codec_name})`,
          language: lang,
          enabled: idx === 0
        };
      });

    const subtitleTracks = (data.streams || [])
      .filter(s => s.codec_type === 'subtitle')
      .map((s, idx) => {
        const lang = s.tags?.language || 'unknown';
        const title = s.tags?.title || '';
        return {
          id: s.index.toString(),
          label: title ? `${title} (${s.codec_name})` : `Subtitle ${idx + 1} (${lang} - ${s.codec_name})`,
          language: lang,
          codec: s.codec_name
        };
      });

    return {
      duration: !isNaN(duration) && duration > 0 ? duration : null,
      audioTracks,
      subtitleTracks
    };
  } catch (err) {
    console.error('ffprobe metadata extraction failed:', err.message);
    return { duration: null, audioTracks: [], subtitleTracks: [] };
  }
};

const getVideoDuration = async (url) => {
  try {
    const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${url}"`);
    const duration = parseFloat(stdout.trim());
    if (!isNaN(duration) && duration > 0) {
      return duration;
    }
  } catch (cmdError) {
    console.log('⚠ ffprobe command failed:', cmdError.message);
  }
  return null;
};

// Allowed MIME types for streaming
const ALLOWED_TYPES = [
  'video/mp4', 'video/webm', 'video/x-matroska',
  'audio/mpeg', 'audio/mp3', 'audio/webm'
];

// Generate streaming token
app.post('/api/generate-token', async (req, res) => {
  const { url, transcode } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Validate URL can be accessed
    console.log('Validating URL:', url);
    const headResponse = await axios.head(url, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    });

    console.log('Response status:', headResponse.status);
    console.log('Content-Type:', headResponse.headers['content-type']);
    console.log('Content-Length:', headResponse.headers['content-length']);

    if (headResponse.status === 403) {
      return res.status(400).json({ 
        error: 'Access denied. The URL may have expired or requires authentication.' 
      });
    }

    if (headResponse.status !== 200) {
      return res.status(400).json({ 
        error: `Unable to access media file (Status: ${headResponse.status})` 
      });
    }

    const contentType = headResponse.headers['content-type'];
    if (!contentType) {
      return res.status(400).json({ error: 'Unable to determine file type' });
    }

    // Extract metadata
    console.log('Probing video metadata...');
    const metadata = await getVideoMetadata(url);
    console.log(`Probing complete. Duration: ${metadata.duration}s, Audio Tracks: ${metadata.audioTracks.length}`);

    // Create token with 1 hour expiration
    const token = jwt.sign({ 
      url, 
      transcode: transcode || false,
      audioTracks: metadata.audioTracks,
      subtitleTracks: metadata.subtitleTracks,
      duration: metadata.duration
    }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({ token, streamUrl: `/api/stream/${token}`, metadata });
  } catch (error) {
    console.error('Validation error:', error.message);
    res.status(400).json({ 
      error: 'Unable to access the provided URL. Please check the link and try again.' 
    });
  }
});

// HEAD endpoint for getting video metadata (including duration)
app.head('/api/stream/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      console.error('HEAD: Token verification failed:', err.message);
      return res.status(401).end();
    }

    const { url } = decoded;
    console.log('HEAD request for duration:', url);

    // Get video duration from metadata
    let videoDuration = null;
    try {
      videoDuration = await getVideoDuration(url);
      console.log('✓ HEAD: Extracted video duration:', videoDuration, 'seconds');
    } catch (err) {
      console.log('⚠ HEAD: Could not extract duration:', err.message);
    }

    // Get content info
    try {
      const headResponse = await axios.head(url, {
        timeout: 10000,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*'
        }
      });

      const contentType = headResponse.headers['content-type'] || 'video/x-matroska';
      const contentLength = parseInt(headResponse.headers['content-length'] || '0');

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Accept-Ranges': 'bytes',
        'X-Video-Duration': videoDuration || '',
        'Access-Control-Expose-Headers': 'X-Video-Duration, Content-Type, Content-Length, Accept-Ranges'
      });
      res.end();
    } catch (err) {
      console.error('HEAD request failed:', err.message);
      res.status(502).end();
    }
  } catch (error) {
    console.error('HEAD error:', error.message);
    res.status(500).end();
  }
});

// Stream endpoint with byte-range support and transcoding
app.get('/api/stream/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { url, transcode } = decoded;
    const range = req.headers.range;

    console.log('Streaming request for:', url);
    console.log('Transcode:', transcode);
    console.log('Range header:', range);

    const forceRaw = req.query.raw === 'true';
    const ss = req.query.ss ? parseFloat(req.query.ss) : 0;
    const audioStream = req.query.audioStream || '';

    // If transcoding is enabled, or custom audio track is selected, transcode on-the-fly
    if ((transcode || audioStream) && !forceRaw) {
      console.log(`Starting FFmpeg transcoding from ss=${ss}, audioStream=${audioStream}`);
      
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'none',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Transfer-Encoding': 'chunked'
      });

      const ffmpegArgs = [];
      
      // Regenerate presentation timestamps if missing or broken in source stream
      ffmpegArgs.push('-fflags', '+genpts');

      if (ss > 0) {
        ffmpegArgs.push('-ss', ss.toString());
      }
      ffmpegArgs.push('-i', url);

      if (audioStream) {
        ffmpegArgs.push('-map', '0:v:0', '-map', `0:${audioStream}`);
      } else {
        ffmpegArgs.push('-map', '0:v:0', '-map', '0:a:0?');
      }

      // Choose optimal video codec:
      // When seeking (ss > 0), transcoding the video guarantees frame-accurate, perfect audio-video synchronization.
      // On macOS (Apple Silicon), we use the hardware videotoolbox encoder which is extremely fast and uses 0% CPU.
      let videoCodec = 'copy';
      const codecArgs = [];

      if (ss > 0) {
        if (process.platform === 'darwin') {
          console.log('[backend] Using hardware h264_videotoolbox for seek sync');
          videoCodec = 'h264_videotoolbox';
          codecArgs.push(
            '-b:v', '4000k',
            '-maxrate', '6000k',
            '-bufsize', '12000k',
            '-pix_fmt', 'yuv420p'
          );
        } else {
          console.log('[backend] Using software libx264 ultrafast for seek sync');
          videoCodec = 'libx264';
          codecArgs.push(
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-pix_fmt', 'yuv420p'
          );
        }
      }

      ffmpegArgs.push(
        '-c:v', videoCodec,
        ...codecArgs,
        '-c:a', 'aac',
        '-b:a', '192k',
        '-af', 'aresample=async=1',               // Dynamically sync/stretch audio samples to match video frames
        '-avoid_negative_ts', 'make_zero',        // Shift stream presentation timestamps to start at 0
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4',
        'pipe:1'
      );

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      ffmpegProcess.stdout.pipe(res);

      ffmpegProcess.stderr.on('data', (data) => {
        // Suppress FFmpeg noise, only log errors if critical
      });

      ffmpegProcess.on('error', (err) => {
        console.error('FFmpeg error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Transcoding failed' });
        }
      });

      ffmpegProcess.on('close', (code) => {
        console.log('FFmpeg process closed with code:', code);
      });

      req.on('close', () => {
        console.log('Client disconnected, killing FFmpeg');
        ffmpegProcess.kill('SIGKILL');
      });

      return;
    }

    // Original streaming logic (no transcoding)
    const headResponse = await axios.head(url, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    });

    if (headResponse.status !== 200) {
      console.error('HEAD request failed:', headResponse.status);
      return res.status(502).json({ error: 'Unable to access media source' });
    }

    const contentType = headResponse.headers['content-type'] || 'video/x-matroska';
    const contentLength = parseInt(headResponse.headers['content-length'] || '0');

    console.log('Content-Type:', contentType);
    console.log('Content-Length:', contentLength);

    const isVideo = contentType.includes('video') || contentType.includes('matroska') || contentType.includes('octet-stream');
    const isAudio = contentType.includes('audio');
    
    if (!isVideo && !isAudio) {
      console.error('Unsupported content type:', contentType);
      return res.status(415).json({ error: 'Unsupported media type' });
    }

    const finalContentType = contentType.includes('octet-stream') || contentType.includes('matroska') 
      ? 'video/webm' 
      : contentType;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 5 * 1024 * 1024, contentLength - 1);
      const chunkSize = (end - start) + 1;

      console.log(`Streaming range: ${start}-${end}/${contentLength}`);

      try {
        const streamResponse = await axios.get(url, {
          headers: { 
            Range: `bytes=${start}-${end}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*'
          },
          responseType: 'stream',
          timeout: 30000
        });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${contentLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': finalContentType,
          'X-Video-Duration': videoDuration || '',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, X-Video-Duration'
        });

        streamResponse.data.pipe(res);
        
        streamResponse.data.on('error', (err) => {
          console.error('Stream error:', err.message);
        });
      } catch (streamError) {
        console.error('Range request failed:', streamError.message);
        return res.status(502).json({ error: 'Failed to stream media chunk' });
      }
    } else {
      console.log('Streaming full file');
      
      try {
        const streamResponse = await axios.get(url, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*'
          }
        });

        res.writeHead(200, {
          'Content-Length': contentLength,
          'Content-Type': finalContentType,
          'Accept-Ranges': 'bytes',
          'X-Video-Duration': videoDuration || '',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, X-Video-Duration'
        });

        streamResponse.data.pipe(res);
        
        streamResponse.data.on('error', (err) => {
          console.error('Stream error:', err.message);
        });
      } catch (streamError) {
        console.error('Full stream failed:', streamError.message);
        return res.status(502).json({ error: 'Failed to stream media' });
      }
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream media' });
    }
  }
});

// Real-time subtitle extraction endpoint (WebVTT format)
app.get('/api/subtitles/:token/:trackId', async (req, res) => {
  try {
    const { token, trackId } = req.params;
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      console.error('Subtitles: Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { url } = decoded;
    console.log(`[backend] Extracting subtitle stream ${trackId} to WebVTT for:`, url);

    res.writeHead(200, {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    // Spawn FFmpeg to extract subtitles and convert to WebVTT format on-the-fly
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', url,
      '-map', `0:${trackId}`,
      '-f', 'webvtt',
      'pipe:1'
    ]);

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
      // Suppress FFmpeg output
    });

    ffmpegProcess.on('error', (err) => {
      console.error('Subtitle FFmpeg process error:', err);
    });

    req.on('close', () => {
      ffmpegProcess.kill('SIGKILL');
    });
  } catch (error) {
    console.error('Subtitle API error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to retrieve subtitles' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Streaming server running on http://localhost:${PORT}`);
});
