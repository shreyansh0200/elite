# 🚀 Production Deployment Guide

## Backend Keepalive System

Your AgriSync backend is deployed on **Render** (free tier) and will spin down after **15 minutes of inactivity**. The keepalive system automatically pings your backend to keep it active.

### 🔄 How It Works

There are **two complementary keepalive mechanisms**:

#### 1. **GitHub Actions Workflow** (Primary) ✅
- **Location**: `.github/workflows/keepalive.yml`
- **Frequency**: Every **10 minutes** (automatic)
- **What it does**:
  - Pings health endpoint: `https://elite-pe1d.onrender.com/api/health`
  - Warms up database with mandi endpoint
  - Has built-in retry logic (3 attempts)
  - Logs all pings to GitHub Actions

**How to verify:**
1. Go to: https://github.com/shreyansh0200/elite/actions
2. Look for "Backend Keepalive ⏰" workflow
3. Check recent runs - should show ✅ success every 10 minutes

#### 2. **Keepalive Script** (Optional Backup)
- **Location**: `keepalive.js`
- **How to run**: 
  ```bash
  node keepalive.js
  ```
- **Use case**: Deploy as a background service on your own server if GitHub Actions isn't available

### 📊 Endpoints Being Monitored

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Basic health check (green light) |
| `/api/mandi/prices` | Warms up database connections |

### 🌐 URLs

- **Production Backend**: https://elite-pe1d.onrender.com
- **Production Frontend**: https://elite-frontend-omega.vercel.app
- **Preview Frontend**: https://elite-frontend-*.vercel.app (auto-allowed)

### 🔒 CORS Configuration

The backend automatically allows:
- ✅ Production URL: `https://elite-frontend-omega.vercel.app`
- ✅ All Vercel preview URLs: `*.vercel.app`
- ✅ Localhost: `http://localhost:5173` (dev)

See: `backend/server.js` - `isOriginAllowed()` function

### 🛠️ Troubleshooting

**If backend shows "API route not found":**
1. Check if Render has spun it down (visit https://elite-pe1d.onrender.com/api/health)
2. If 404, manually wake it up by visiting any endpoint
3. Check GitHub Actions logs for keepalive pings

**If CORS errors appear in browser:**
1. Open DevTools → Console
2. Check the `Origin` being sent by your frontend
3. Ensure it matches allowed URLs in `backend/server.js`

**If keepalive script fails:**
1. Check Node.js version (requires 14+)
2. Verify internet connection on deployment server
3. Check firewall isn't blocking outbound HTTPS

### 📈 Monitoring

**GitHub Actions Dashboard:**
```
https://github.com/shreyansh0200/elite/actions/workflows/keepalive.yml
```

**Check backend health directly:**
```bash
curl https://elite-pe1d.onrender.com/api/health
```

Expected response:
```json
{
  "ok": true,
  "service": "agrisync-api",
  "environment": "production",
  "time": "2026-09-11T12:00:00.000Z"
}
```

### 🚀 Future Improvements

- [ ] Add health check endpoint to dashboard
- [ ] Send Slack/email alerts if backend is down
- [ ] Upgrade to Render paid tier (auto-keeps service alive)
- [ ] Use Vercel Cron to ping backend from frontend
- [ ] Add synthetic monitoring (UptimeRobot, etc.)

---

**Last Updated**: 2026-09-11  
**Backend Status**: ✅ Active with 10-minute keepalive pings
