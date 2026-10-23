# Culture365

Culture365 is a local-first personal learning app: one country or region and one general knowledge question per day. The codebase is in English; all learner-facing UI and generated lessons are in French.

This version uses a manual/Codex content workflow. No OpenAI API key is required.

## Architecture

- `backend/`: FastAPI API, static hosting, JSON repository, progress state.
- `frontend/`: Vite React PWA with a mobile-first card reading experience.
- `generator/`: request-file creation, JSON pack validation, and local import.
- `prompts/`: English guidance for Codex/manual content generation.
- `data/`: editable local JSON storage.
- `assets/`: local flags, maps, and lesson images.

No database is required. Reading lessons never calls an external API.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install the frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Manual Content Workflow

Create the topic-list request:

```bash
python generate.py init
```

This writes:

```text
data/requests/request-topics.md
```

Ask Codex to create the JSON file requested inside it:

```text
data/inbox/topics.json
```

Then import it:

```bash
python generate.py import data/inbox/topics.json
```

Create a request for the next 14 days:

```bash
python generate.py 14
```

This writes a file like:

```text
data/requests/request-days-001-014.md
```

Ask Codex to create the JSON pack named inside that request, then import it:

```bash
python generate.py import data/inbox/pack-days-001-014.json
```

Useful commands:

```bash
python generate.py request --count 14
python generate.py request --start 43 --count 14
python generate.py validate data/inbox/pack-days-043-056.json
python generate.py status
```

Requests resume automatically from `data/state.json`.

## Run Locally

For development, run the API and frontend separately:

```bash
uvicorn backend.app:app --reload
```

```bash
cd frontend
npm run dev
```

For a single production-like local server:

```bash
cd frontend
npm run build
cd ..
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000`.

## Export For iPhone Offline Use

The iPhone version is a static PWA: it reads JSON from `frontend/public/content/`, saves progress in the phone browser, and does not need FastAPI after installation.

Export the imported lessons:

```bash
python generate.py export-static --days 14
```

Build the static app:

```bash
cd frontend
npm run build
cd ..
```

Deploy the contents of `frontend/dist/` to any HTTPS static host:

- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages

GitHub is not required unless you specifically want GitHub Pages. If using GitHub Pages for a project URL such as `https://USER.github.io/REPO/`, build with:

```bash
cd frontend
npm run build -- --base=/REPO/
cd ..
```

On iPhone:

1. Open the HTTPS URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Keep Open as Web App enabled if Safari shows that option.
5. Open the app once while online so the service worker caches the app, lessons, and media.

After that, the installed app can read the exported days without your laptop or backend. For a new batch, import more days, run `python generate.py export-static --days N`, rebuild, redeploy, and open the app once online to refresh the cache.

## Local Data

- `data/topics/countries.json` and `data/topics/questions.json` are imported from `data/inbox/topics.json` and remain editable.
- Generated lessons live in `data/generated/day-001/`.
- User progress lives in `data/state.json`.
- Assets are stored under `assets/` and served at `/media/...`.
- Static iPhone export lives in `frontend/public/content/`, `frontend/public/media/`, and `frontend/public/offline-assets.json`.

The current day advances only after both daily lessons are marked complete. If the next day has not been imported, the app asks you to create a request and import the next JSON pack.

## Quality Checks

```bash
pytest
cd frontend
npm test
npm run build
```

## Notes

The importer validates schema, topic counts, lesson type, day numbers, and French lesson language. It does not fact-check content automatically; review generated packs before importing when accuracy matters.
