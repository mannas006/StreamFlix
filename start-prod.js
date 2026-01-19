const { spawn } = require('child_process');

// Start the backend server
const backend = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.BACKEND_PORT || 3001 }
});

// Start the Next.js server
const frontend = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || 3000 }
});

// Handle process exits
backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code);
});

frontend.on('exit', (code) => {
  console.log(`Frontend exited with code ${code}`);
  process.exit(code);
});

// Handle termination
process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
});

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
});
