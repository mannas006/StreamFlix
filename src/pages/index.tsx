import { useState } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import styles from '@/styles/Home.module.css';

export default function Home() {
  const [mediaUrl, setMediaUrl] = useState('');
  const [streamToken, setStreamToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enableTranscode, setEnableTranscode] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: mediaUrl,
          transcode: enableTranscode 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate streaming token');
      }

      setStreamToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStreamToken('');
    setMediaUrl('');
    setError('');
  };

  return (
    <div className={styles.container}>
      {!streamToken ? (
        <div className={styles.urlForm}>
          <div className={styles.logo}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <h1>StreamFlix</h1>
          </div>
          
          <form onSubmit={handleSubmit}>
            <input
              type="url"
              placeholder="Paste direct media URL (MP4, MKV, WEBM, MP3)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              required
              disabled={loading}
            />
            
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={enableTranscode}
                onChange={(e) => setEnableTranscode(e.target.checked)}
                disabled={loading}
              />
              <span>Enable audio transcoding (fixes MKV/incompatible audio)</span>
            </label>

            <button type="submit" disabled={loading || !mediaUrl}>
              {loading ? 'Loading...' : 'Start Streaming'}
            </button>
          </form>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.info}>
            <p>✓ Instant playback with progressive loading</p>
            <p>✓ No downloads required</p>
            <p>✓ Secure token-based streaming</p>
            <p>✓ Auto-transcode incompatible audio formats</p>
          </div>
        </div>
      ) : (
        <VideoPlayer token={streamToken} onBack={handleReset} />
      )}
    </div>
  );
}
