import json
import shutil
from pathlib import Path

from backend.paths import FRONTEND_DIST_DIR, MEDIA_DIR, ROOT_DIR
from backend.repository import JsonRepository

FRONTEND_PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
CONTENT_PUBLIC_DIR = FRONTEND_PUBLIC_DIR / "content"
MEDIA_PUBLIC_DIR = FRONTEND_PUBLIC_DIR / "media"


def export_static(
    days: int | None = None,
    include_dist: bool = False,
    repo: JsonRepository | None = None,
    public_dir: Path | None = None,
    media_dir: Path | None = None,
    dist_dir: Path | None = None,
) -> dict:
    repo = repo or JsonRepository()
    public_dir = public_dir or FRONTEND_PUBLIC_DIR
    media_dir = media_dir or MEDIA_DIR
    dist_dir = dist_dir or FRONTEND_DIST_DIR
    status = repo.status()
    exported_days = status.generated_days[: days or len(status.generated_days)]
    if not exported_days:
        raise ValueError("No generated days to export.")

    content_public_dir = public_dir / "content"
    media_public_dir = public_dir / "media"
    reset_dir(content_public_dir)
    reset_dir(media_public_dir)
    copy_assets(media_dir, media_public_dir)

    generated_dir = content_public_dir / "generated"
    generated_dir.mkdir(parents=True, exist_ok=True)
    offline_assets = ["/", "/manifest.webmanifest", "/icon.svg", "/content/state.json", "/offline-assets.json"]

    for day in exported_days:
        source_day = repo.day_dir(day)
        target_day = generated_dir / f"day-{day:03d}"
        target_day.mkdir(parents=True, exist_ok=True)
        for filename in ["country.json", "question.json", "manifest.json"]:
            shutil.copy2(source_day / filename, target_day / filename)
            offline_assets.append(f"/content/generated/day-{day:03d}/{filename}")

    for path in media_public_dir.rglob("*"):
        if path.is_file():
            offline_assets.append("/media/" + path.relative_to(media_public_dir).as_posix())

    state = {
        "static_export": True,
        "current_day": 1,
        "last_generated_day": max(exported_days),
        "generated_days": exported_days,
        "completed_lessons": {},
    }
    write_json(content_public_dir / "state.json", state)
    write_json(public_dir / "offline-assets.json", sorted(set(offline_assets)))

    if include_dist and dist_dir.exists():
        export_dist_copy(public_dir, dist_dir)

    return state


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_assets(source: Path, target: Path) -> None:
    if source.exists():
        shutil.copytree(source, target, dirs_exist_ok=True)


def export_dist_copy(public_dir: Path, dist_dir: Path) -> None:
    (dist_dir / "content").mkdir(parents=True, exist_ok=True)
    (dist_dir / "media").mkdir(parents=True, exist_ok=True)
    if (public_dir / "content").exists():
        shutil.copytree(public_dir / "content", dist_dir / "content", dirs_exist_ok=True)
    if (public_dir / "media").exists():
        shutil.copytree(public_dir / "media", dist_dir / "media", dirs_exist_ok=True)
    shutil.copy2(public_dir / "offline-assets.json", dist_dir / "offline-assets.json")


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
