# 🧘 ADHIṬṬHĀNA — Strong Determination Sitting Tracker
### A Dedicated Meditation Practice Platform for **Zabir** & **Soham**

Welcome to **Adhiṭṭhāna**, a platform built for Zabir and Soham to cultivate unbroken willpower and equanimity through the ancient practice of Strong Determination Sitting (sitting completely still without shifting posture, scratching itches, or opening eyes).

---

## ✨ Features

- **Rich Moving Graphics & Aesthetic**:
  - Interactive HTML5 Canvas cosmic particle constellation and sacred geometry (Flower of Life, Star Tetrahedron) slowly rotating in 60fps.
  - Concentric animated timer aura and breathing pacer orb with gentle organic transitions.
  - Deep space dark theme with glowing cyan (`#00F5D4`), sacred violet (`#A855F7`), and solar gold (`#FFB703`).
- **Authentic Tibetan Singing Bowl Soundscape**:
  - Multi-harmonic bronze bowl chime synthesized directly using the Web Audio API with natural decay and resonant beating frequencies.
  - Toggleable 432Hz Om ambient drone.
  - 100% self-contained—zero external audio files needed.
- **The "I Moved / Call Time Out" Protocol**:
  - Whenever someone moves or breaks their posture, they hit the prominent **"I Moved (Call Time Out)"** button.
  - Records the exact minutes and seconds survived.
  - Categorizes the movement trigger (burning knee pain, itch, restlessness storm, numbness) and captures a mindfulness reflection.
- **Dual Head-to-Head Progress Tracking**:
  - Instant profile toggling between **Zabir** and **Soham**.
  - Comparative 14-day meditation volume graph (Chart.js glowing area curves).
  - Clean Sits vs. Time Out ratio doughnut chart.
  - Comparative Bar Chart (Average sit duration, Best clean sit record, Total hours).
  - 28-day stillness calendar heatmap with gold stars for 60m+ clean sits.
  - Collaborative chronological feed with filters and notes.
- **Adhiṭṭhāna Masterclass Guide**:
  - The Three Sacred Vows: Eyes closed, hands motionless, legs locked.
  - The "Urge Surfing" mindfulness protocol for surviving intense sensations.
  - Posture alignment tips (Burmese, Lotus, Seiza).

---

## 🚀 How to Run Locally

You can run the app locally using Python's built-in standard library (no dependencies needed):

```bash
cd /home/zab/Desktop/stargate/adhitthana
python3 server.py
```

Then open your browser to:
👉 **`http://localhost:8000`**

The server will automatically create `sits.db` (SQLite) and persist all sessions.

---

## ☁️ How to Host 100% Free Forever

Both Zabir and Soham can access the app from any phone, tablet, or laptop worldwide at zero cost.

### Option 1: GitHub Pages (Recommended)
1. Go to [GitHub.com](https://github.com) and create a free account.
2. Create a new repository named `adhitthana`.
3. Push or upload the files from this directory:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `charts.js`
   - `canvas-bg.js`
   - `audio-synth.js`
   - `sync.js`
4. Go to repository **Settings** &rarr; **Pages** &rarr; select branch `main` &rarr; click **Save**.
5. Your free permanent URL will be live at:
   `https://<your-username>.github.io/adhitthana/`

### Option 2: Vercel / Netlify / Cloudflare Pages (Drag & Drop)
1. Sign up for free at [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Drag and drop the `adhitthana` folder into their dashboard.
3. Your site is deployed in 10 seconds with a free `.vercel.app` or `.netlify.app` domain and free SSL!

### Synchronizing Sits Between Zabir & Soham:
- Open the app &rarr; Click **Sync** in the top bar.
- Both Zabir and Soham should make sure their **Shared Room Code** is set to `zabir-soham` (or any custom passphrase you choose).
- Any sit logged on one phone or computer will synchronize so you can always see each other's progress!
- You can also export and import a complete JSON backup at any time with 1 click.
