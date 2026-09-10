import https from 'https';
import http from 'http';

// Configuration
const BACKEND_URL = 'https://elite-pe1d.onrender.com/api/health';
const MANDI_URL = 'https://elite-pe1d.onrender.com/api/mandi/prices?state=Punjab';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15 min)
const TIMEOUT = 10000; // 10 second timeout

const isHttps = BACKEND_URL.startsWith('https');
const protocol = isHttps ? https : http;

let pingCount = 0;

function pingEndpoint(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = protocol.get(url, { timeout: TIMEOUT }, (res) => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      const timestamp = new Date().toISOString();
      
      console.log(`✅ [${timestamp}] ${name} - Status: ${status}, Duration: ${duration}ms`);
      resolve({ success: true, status, duration });
    });
    
    req.on('error', (err) => {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] ${name} - Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      const timestamp = new Date().toISOString();
      console.error(`⏱️  [${timestamp}] ${name} - Timeout`);
      req.abort();
      resolve({ success: false, error: 'timeout' });
    });
  });
}

async function keepalive() {
  pingCount++;
  const timestamp = new Date().toISOString();
  
  console.log(`\n🔔 Keepalive Ping #${pingCount} at ${timestamp}`);
  console.log('━'.repeat(60));
  
  // Ping health endpoint
  const health = await pingEndpoint(BACKEND_URL, '🏥 Health Check');
  
  // Ping mandi endpoint to warm up database
  const mandi = await pingEndpoint(MANDI_URL, '📊 Mandi Endpoint');
  
  console.log('━'.repeat(60));
  console.log(`✨ Keepalive cycle complete\n`);
  
  // Log summary
  if (health.success && mandi.success) {
    console.log(`📈 Status: All endpoints healthy`);
  } else {
    console.log(`⚠️  Status: Some endpoints down (will retry next cycle)`);
  }
}

// Start immediately
console.log('🚀 Backend Keepalive Service Started');
console.log(`📍 Backend URL: ${BACKEND_URL}`);
console.log(`⏱️  Interval: Every ${PING_INTERVAL / 1000 / 60} minutes`);
console.log(`💡 Purpose: Prevent Render free tier from spinning down`);
console.log('━'.repeat(60));

keepalive();

// Schedule periodic pings
const interval = setInterval(keepalive, PING_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down keepalive service gracefully...');
  clearInterval(interval);
  console.log('✅ Keepalive service stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Termination signal received...');
  clearInterval(interval);
  console.log('✅ Keepalive service terminated');
  process.exit(0);
});
