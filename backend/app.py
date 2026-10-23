from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.paths import FRONTEND_DIST_DIR, MEDIA_DIR
from backend.repository import JsonRepository
from backend.schemas import DayResponse, LessonType, StatusResponse

app = FastAPI(title="Culture365", version="1.0.0")
repo = JsonRepository()
repo.ensure_dirs()
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.get("/api/status", response_model=StatusResponse)
def get_status() -> StatusResponse:
    return repo.status()


@app.get("/api/day/current", response_model=DayResponse)
def get_current_day() -> DayResponse:
    current_day = repo.load_state().progress.current_day
    return get_day(current_day)


@app.get("/api/day/{day}", response_model=DayResponse)
def get_day(day: int) -> DayResponse:
    try:
        return repo.get_day(day)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/progress/{day}/{lesson_type}/complete", response_model=StatusResponse)
def complete_lesson(day: int, lesson_type: LessonType) -> StatusResponse:
    try:
        return repo.mark_complete(day, lesson_type)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        requested = (FRONTEND_DIST_DIR / full_path).resolve()
        dist = FRONTEND_DIST_DIR.resolve()
        if requested.is_file() and dist in requested.parents:
            return FileResponse(requested)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

else:
    @app.get("/")
    def missing_frontend() -> JSONResponse:
        return JSONResponse(
            {
                "message": "Interface non construite. Lancez `npm run build` dans frontend puis redémarrez le serveur."
            }
        )
