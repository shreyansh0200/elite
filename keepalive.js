import https from 'https';
import http from 'http';

// Render backend URL
const backendUrl = 'https://elite-pe1d.onrender.com/api/health';

// Frontend URL (for demonstration)
const frontendUrl = 'https://elite-frontend-omega.vercel.app';

const isHttps = backendUrl.startsWith('https');
const protocol = isHttps ? https : http;

function pingBackend() {
  const startTime = Date.now();
  
  protocol
    .get(backendUrl, (res) => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      
      console.log(
        `[${new Date().toISOString()}] Backend ping successful - Status: ${status}, Duration: ${duration}ms`
      );
    })
    .on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Backend ping failed:`, err.message);
    })
    .on('timeout', () => {
      console.error(`[${new Date().toISOString()}] Backend ping timeout`);
    });
}

// Ping immediately
pingBackend();

// Ping every 14 minutes (840000ms) to keep Render awake
// Render spins down after 15 minutes of inactivity
const interval = setInterval(pingBackend, 14 * 60 * 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down keepalive service...');
  clearInterval(interval);
  process.exit(0);
});

console.log('🚀 Backend keepalive service started');
console.log(`📍 Pinging: ${backendUrl}`);
console.log('⏱️  Interval: Every 14 minutes');
console.log('💡 This prevents Render from spinning down your free tier app');
