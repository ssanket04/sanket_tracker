# Trackr — Personal Productivity Tracker

A minimal, fast, notebook-style daily habit tracker with streaks, weekly reviews, and productivity scores.

## Quick Start

**No installation required.** Just open `index.html` in your browser.

```
Double-click index.html → opens in browser → done.
```

## Deploy Options

### Option A: Static File Hosting (Recommended — Free)

**Netlify (easiest):**
1. Go to https://netlify.com → Sign up free
2. Drag the entire `productivity-tracker` folder onto the Netlify dashboard
3. Done — you get a live URL instantly

**GitHub Pages:**
1. Create a GitHub repo, push all files
2. Go to Settings → Pages → Source: main branch
3. Your site is live at `https://yourusername.github.io/repo-name`

**Vercel:**
1. Go to https://vercel.com → Import GitHub repo
2. No config needed — deploy directly

### Option B: Local Server (if browser blocks local files)

If you see errors with `file://` URLs, run a simple server:

```bash
# Python (installed on most systems)
cd productivity-tracker
python3 -m http.server 3000
# Open: http://localhost:3000

# Node.js (if installed)
npx serve .
```

## Tech Stack

- Pure HTML + CSS + JavaScript (no frameworks, no npm, no build step)
- Data stored in browser localStorage (no backend needed)
- Works offline after first load
- PWA-ready (can be installed on mobile)

## Do You Need a Backend?

**No.** All data is stored locally in your browser's localStorage.

**Limitations of localStorage:**
- Data lives only in your browser (not synced across devices)
- Clearing browser data will erase your history

**If you want cross-device sync (optional upgrade):**
- Add Firebase Firestore (free tier is generous)
- See `FIREBASE_UPGRADE.md` for instructions (not included — request if needed)

## File Structure

```
productivity-tracker/
├── index.html          ← Main app shell (all 3 pages in one file)
├── manifest.json       ← PWA manifest (installable on mobile)
├── css/
│   ├── style.css       ← Design system, shared styles, animations
│   ├── calendar.css    ← Calendar page styles
│   ├── daily.css       ← Daily detail view styles
│   └── weekly.css      ← Weekly review styles
└── js/
    ├── storage.js      ← Data layer (localStorage CRUD, calculations)
    ├── calendar.js     ← Calendar rendering & month navigation
    ├── daily.js        ← Activity tracking, scoring, summaries
    ├── weekly.js       ← Weekly review & stats
    └── app.js          ← App shell, routing, toasts
```

## Features

- 📅 Monthly calendar with color-coded productivity indicators
- 🔥 Streak tracking (current + best)
- 📝 Daily activity tracking with notes
- ⭐ Top 3 priority tracking with "Win the Day" system
- 📊 Auto-calculated productivity scores
- 🧠 Auto-generated daily summaries
- 📋 Weekly performance review with charts
- 💬 Daily motivational quotes
- 📱 Mobile-first responsive design
- ⚡ No backend, no account, no setup
