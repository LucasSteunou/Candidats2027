# Présidentielle 2027

Mobile app (static PWA) presenting the 2027 French presidential candidacies on an identical, fully sourced grid: programme, polls, history, perception, controversies. All user-facing content is in French. The objectivity rules are in [METHODOLOGIE.md](METHODOLOGIE.md), and most are enforced by tests.

## Layout

- `content/`: the data, as JSON. `perimetre.json` (who has a fiche and why), `themes.json` (the shared grid of themes and key questions), `sondages.json` (polls), `candidatures/<id>.json` (one fiche per candidate).
- `tools/content.py`: pydantic models and the charter checks. `tools/check_links.py` checks that cited URLs still answer.
- `tests/`: runs the charter checks on the real content, plus one failing case per rule.
- `frontend/`: Vite + React PWA. It imports `content/` directly at build time, so there is no API and no export step.
- `RETOURS.md`: log of error reports and what was done about them.

## Setup

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd frontend && npm ci
```

## Everyday commands

```bash
.venv/bin/python -m pytest              # charter checks on content/
.venv/bin/python -m tools.check_links   # dead links (slow on purpose: 2 s per host)
cd frontend && npm run dev              # app at http://localhost:5173
cd frontend && npm test && npm run build
```

Pushing to `main` deploys `frontend/dist` to GitHub Pages (`.github/workflows/deploy.yml`).

## Adding or updating a fiche

1. Write `content/candidatures/<id>.json`. The `id` must exist in `perimetre.json`.
2. Run `pytest` until it passes. It rejects unsourced claims, missing questions, evaluative wording outside quotes, and controversies with fewer than two independent sources.
3. Review the fiche in the app (`npm run dev`).

## Notes

- Party and campaign websites can ban fast scrapers. Space out requests, or use the Wayback Machine for documents.
- If the project folder was downloaded through a browser, macOS quarantines the native binaries in `node_modules` (esbuild, rollup) and Vite hangs. Fix it with `rm -rf frontend/node_modules && npm ci`.
