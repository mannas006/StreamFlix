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

// Helper function to get video duration using FFmpeg
const getVideoDuration = async (url) => {
  try {
    // Try using ffprobe command directly for better reliability
    const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${url}"`);
    const duration = parseFloat(stdout.trim());
    if (!isNaN(duration) && duration > 0) {
      console.log('✓ Video duration from ffprobe:', duration, 'seconds /', (duration / 60).toFixed(2), 'minutes');
      return duration;
    }
  } catch (cmdError) {
    console.log('⚠ ffprobe command failed:', cmdError.message);
  }

  // Fallback to fluent-ffmpeg
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(url, (err, metadata) => {
      if (err) {
        console.error('✗ FFprobe error:', err.message);
        reject(err);
      } else {
        const duration = metadata.format.duration;
        console.log('✓ Video duration from fluent-ffmpeg:', duration, 'seconds');
        resolve(duration);
      }
    });
  });
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

    // Create token with 1 hour expiration
    const token = jwt.sign({ url, transcode: transcode || false }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({ token, streamUrl: `/api/stream/${token}` });
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

    // Get video duration from metadata
    let videoDuration = null;
    try {
      videoDuration = await getVideoDuration(url);
      console.log('✓ Extracted video duration:', videoDuration, 'seconds');
    } catch (err) {
      console.log('⚠ Could not extract duration:', err.message);
    }

    // If transcoding is enabled, use FFmpeg to convert on-the-fly
    if (transcode) {
      console.log('Starting FFmpeg transcoding...');
      
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'none',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Transfer-Encoding': 'chunked'
      });

      // FFmpeg command to transcode audio to AAC, copy video
      const ffmpegProcess = spawn('ffmpeg', [
        '-i', url,
        '-c:v', 'copy',           // Copy video without re-encoding
        '-c:a', 'aac',            // Convert audio to AAC
        '-b:a', '192k',           // Audio bitrate
        '-movflags', 'frag_keyframe+empty_moov+faststart', // Enable streaming
        '-f', 'mp4',              // Output format
        'pipe:1'                  // Output to stdout
      ]);

      ffmpegProcess.stdout.pipe(res);

      ffmpegProcess.stderr.on('data', (data) => {
        console.log('FFmpeg:', data.toString());
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

app.listen(PORT, () => {
  console.log(`Streaming server running on http://localhost:${PORT}`);
});
