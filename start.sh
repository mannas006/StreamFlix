#!/bin/bash

# Start the streaming platform
echo "🚀 Starting StreamFlix..."
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  Warning: FFmpeg is not installed!"
    echo "   Audio transcoding will not work for MKV files."
    echo "   Install with: brew install ffmpeg (macOS)"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start both servers
echo "🎬 Starting backend and frontend servers..."
npm run dev:all
