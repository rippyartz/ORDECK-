# ORDECK

**All-in-one creative suite that runs entirely in your browser.**

Developed by **Shayne M. Mwaniki**

---

## Studios

| Studio | What it does |
|---|---|
| 🎵 **Tidal Beat** | Step-sequencer DAW — real Web Audio synthesis, sample import, per-track FX (reverb / delay / drive), multi-pattern arrangement, mixer, recording, and WAV export |
| 🎬 **Visual Studio** | Layer-based animation & video editor — import images/video, freehand draw, timeline with dope-sheet keyframes, and WebM export |
| 💻 **Dev Studio** | Live code editor — JavaScript runs in a real sandbox, HTML/CSS render in a live preview, Python executes via Pyodide (no backend needed) |

---

## Features

- 🔐 **Accounts & sessions** — sign up / sign in; session is saved to localStorage; all project data persists and restores on login
- 🔒 **Prototype+ plan** — premium features (AI assist, export, recording) are gated; use the code `UPDATEREAL` to unlock Prototype+ free
- 🎵 **Background music** — three ambient tracks (Cosmic Drift · Deep Orbit · Silence), fully synthesised with Web Audio; swap tracks in Settings or upload your own
- 🔍 **Enlarge view** — every studio has an Enlarge button to full-screen your work

---

## Folder structure

```
ordeck-final/
├── index.html        ← page shell + all markup
├── css/
│   └── style.css     ← all styles
├── js/
│   └── app.js        ← all application logic
├── assets/           ← place any static assets here
├── README.md
├── .gitignore
├── vercel.json       ← zero-config Vercel deploy
└── netlify.toml      ← zero-config Netlify deploy
```

---

## Running locally

No build tools required — it's a plain static site.

```bash
# Option 1 — Node
npx serve .

# Option 2 — Python
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

> **Important:** Open via a local server, not `file://`. The Web Audio API, MediaRecorder, and file-input APIs all require an HTTP origin.

---

## Deploying

### Vercel
Push to GitHub and import the repo in [vercel.com](https://vercel.com). The included `vercel.json` handles routing automatically.

### Netlify
Push to GitHub and import in [netlify.com](https://netlify.com). The included `netlify.toml` handles everything.

### GitHub Pages
In your repo → Settings → Pages → set source to `main` / `root`. Enable it and GitHub will serve `index.html` directly.

---

## Notes

- **Data persistence:** accounts and projects are stored in `localStorage`. This means data is per-browser-per-device. There is no cloud sync in this version.
- **Python:** Pyodide (~10 MB) is loaded from a CDN on first Python run. Requires internet on first use.
- **Icons:** Tabler Icons loads from a CDN. For a fully-offline build, download and vendor `@tabler/icons-webfont` locally.
