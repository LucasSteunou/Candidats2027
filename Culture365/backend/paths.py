from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
TOPICS_DIR = DATA_DIR / "topics"
GENERATED_DIR = DATA_DIR / "generated"
STATE_PATH = DATA_DIR / "state.json"
MEDIA_DIR = ROOT_DIR / "assets"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"


def day_dir(day: int) -> Path:
    return GENERATED_DIR / f"day-{day:03d}"
