# AgriSync

AgriSync is a simple web app that connects **farmers**, **hub managers**, and
**customers**:

- Farmers book a hub pickup **ticket** themselves — IRCTC-style — by picking
  an open slot from the hub's published schedule. Enough capacity in that
  slot means an instant **CONFIRMED** ticket (with a PNR-style number);
  a full slot means an instant **WAITLISTED** ticket that auto-confirms
  if space frees up, just like a railway waitlist. Ticket fare is a flat
  **₹100 per 36 quintal** (or part thereof) booked.
- The hub manager publishes pickup slots (date, time window, and capacity in
  quintals) instead of manually granting tokens, and can still cancel a
  ticket if needed.
- Customers buy crops directly from the hub's marketplace.
- Anyone can check today's mandi (market) prices, or ask the built-in voice
  assistant in Hindi or English.

It's a full-stack app: a React website (`frontend`) and a Node.js server
(`backend`) that talks to a MongoDB database.

---

## What you need before you start

Install these on your computer first:

1. **Node.js** version 18 or newer — [nodejs.org](https://nodejs.org)
2. **MongoDB** — either:
   - A free cloud database at [MongoDB Atlas](https://www.mongodb.com/atlas), or
   - MongoDB installed locally on your machine

That's it — everything else installs automatically in the steps below.

---

## Step-by-step setup

### 1. Open the project folder

```bash
cd AgriSync-Production
```

### 2. Install everything

This single command installs the website and the server together:

```bash
npm install
```

### 3. Set up the server's settings

Copy the example settings file:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` in any text editor and fill in at least these two lines:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_password_you_make_up
```

Everything else is optional. For live mandi rates, also add your data.gov.in API key. Never commit the real `.env` file to Git.

### 4. Set up the website's settings

Copy the example settings file:

```bash
cp frontend/.env.example frontend/.env
```

The default value already points to your own computer, so no changes are
needed for local use.

### 5. Add some sample data (optional but recommended)

This creates 10 demo city-hub manager accounts plus sample crop listings/slots, so
you have something to look at right away:

```bash
npm run seed
```

Demo hub-manager credentials (created by `npm run seed`):

| City | Username | Password |
|---|---|---|
| Kanpur | `hub_kanpur` | `Kanpur@123` |
| Lucknow | `hub_lucknow` | `Lucknow@123` |
| Prayagraj | `hub_prayagraj` | `Prayagraj@123` |
| Varanasi | `hub_varanasi` | `Varanasi@123` |
| Agra | `hub_agra` | `Agra@123` |
| Meerut | `hub_meerut` | `Meerut@123` |
| Gorakhpur | `hub_gorakhpur` | `Gorakhpur@123` |
| Bareilly | `hub_bareilly` | `Bareilly@123` |
| Jhansi | `hub_jhansi` | `Jhansi@123` |
| Aligarh | `hub_aligarh` | `Aligarh@123` |

⚠️ These are demo credentials for testing. Change them before real deployment.

### 6. Start the app

```bash
npm run dev
```

This starts both the website and the server at the same time. Open your
browser to:

```
http://localhost:5173
```

The server runs in the background at `http://localhost:5000` — you don't
need to open that link yourself.

### 7. Try it out

- **Register** as a Farmer or Customer from the homepage.
- Or log in as one of the city-specific demo Hub Managers above. Each manager
  can see and operate only their own city's hub data.
- As a Farmer, use **Book a Crop Pickup Ticket** to reserve an open slot.
  The ticket is only a booking/reservation — it is **not** a crop submission.
- The farmer must physically reach the selected hub with the confirmed ticket
  number. The Hub Manager opens **Receive Crop**, enters the ticket number,
  verifies it, records the actual quantity/quality, and confirms physical
  receipt. Only after that confirmation is the crop added to that hub's stock
  and marketplace.
- Check **Mandi Rates** or **Ask AgriSync** — no login needed.

---

## Physical crop submission flow

AgriSync separates the **pickup ticket** from the **actual crop submission**:

1. The farmer books an open hub slot and receives a confirmed PNR/ticket number.
2. The farmer takes the crop physically to the same city hub during the booked slot.
3. The farmer shows the ticket number to the Hub Manager.
4. The manager verifies the ticket number; the ticket must belong to that manager's city hub.
5. The manager records the actual received quantity, unit, optional quality grade, and notes.
6. The ticket becomes **CROP RECEIVED AT HUB**, and only then is a MarketListing/stock record created.

This prevents a farmer from creating online stock without physically delivering the produce and gives the hub manager a clear audit trail.

---

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start both website and server for local use |
| `npm run dev:frontend` | Start only the website |
| `npm run dev:backend` | Start only the server |
| `npm run build` | Build the website for production |
| `npm start` | Start only the server (production mode) |
| `npm run seed` | Add demo data to the database |

---

## Project folders

```text
AgriSync-Production/
├── frontend/     → The website (what people see and click)
├── backend/      → The server (handles logins, data, prices)
├── scripts/      → The seed.js demo-data script
└── package.json  → Runs frontend and backend together
```

---

## Putting it online

### Server → Render

The included `render.yaml` deploys the `backend` folder. In Render's
dashboard, set `CLIENT_URL` to your live website address once it's online.

### Website → Vercel

Set the Vercel project's root folder to `frontend`, then set:

```env
VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api
```

---

## A few honest notes

- Mandi prices come from the official `data.gov.in` service. If that
  service is unreachable, the app clearly labels prices as **sample data**
  instead of pretending they're live — you'll never see fake numbers marked
  as real.
- The image upload and richer AI chat features are optional — the app works
  without them, using simple built-in fallbacks. See `backend/.env.example`
  if you'd like to turn them on later.
- Before real farmers or customers use this app: change the demo password,
  set a strong `JWT_SECRET`, and restrict who can access your database.

## Agent and live-data behavior

The Ask AgriSync agent accepts typed or microphone questions. Use the Hindi/English microphone selector for speech input. Hindi questions receive Hindi text and Hindi speech when the browser has an `hi-IN` voice installed.

For mandi-rate and pickup-slot questions, the backend reads the mandi service and MongoDB slots directly. The optional LLM is used for general agriculture/app questions; it is not trusted to invent live rates or slots.

The mandi service caches successful government responses for a few minutes and falls back to clearly labelled sample data if the government API cannot be reached. `backend/.env.example` contains the required environment variable names.
