import json
import threading
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from backend.paths import DATA_DIR, GENERATED_DIR, STATE_PATH, TOPICS_DIR, day_dir
from backend.schemas import AppState, DayResponse, Lesson, LessonType, StatusResponse

_STATE_LOCK = threading.Lock()


class JsonRepository:
    # ponytail: process-local lock is enough for one local uvicorn worker; use OS locks if multi-process writes matter.
    def __init__(self, root: Path | None = None) -> None:
        self.root = root
        if root is None:
            self.data_dir = DATA_DIR
            self.topics_dir = TOPICS_DIR
            self.generated_dir = GENERATED_DIR
            self.state_path = STATE_PATH
        else:
            self.data_dir = root / "data"
            self.topics_dir = self.data_dir / "topics"
            self.generated_dir = self.data_dir / "generated"
            self.state_path = self.data_dir / "state.json"

    def ensure_dirs(self) -> None:
        self.topics_dir.mkdir(parents=True, exist_ok=True)
        self.generated_dir.mkdir(parents=True, exist_ok=True)
        if not self.state_path.exists():
            self.save_state(AppState())

    def day_dir(self, day: int) -> Path:
        if self.root is None:
            return day_dir(day)
        return self.generated_dir / f"day-{day:03d}"

    def load_json(self, path: Path) -> Any:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            raise
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in {path}") from exc

    def write_json(self, path: Path, data: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = path.with_suffix(path.suffix + ".tmp")
        tmp_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tmp_path.replace(path)

    def load_state(self) -> AppState:
        self.ensure_dirs()
        try:
            return AppState.model_validate(self.load_json(self.state_path))
        except ValidationError as exc:
            raise ValueError("data/state.json does not match the expected schema.") from exc

    def save_state(self, state: AppState) -> None:
        self.write_json(self.state_path, state.model_dump(mode="json"))

    def generated_days(self) -> list[int]:
        days: list[int] = []
        for path in self.generated_dir.glob("day-*"):
            if path.is_dir():
                try:
                    days.append(int(path.name.removeprefix("day-")))
                except ValueError:
                    continue
        return sorted(days)

    def status(self) -> StatusResponse:
        state = self.load_state()
        return StatusResponse(
            current_day=state.progress.current_day,
            last_generated_day=state.generation.last_generated_day,
            generated_days=self.generated_days(),
            completed_lessons=state.progress.completed_lessons,
        )

    def get_day(self, day: int) -> DayResponse:
        folder = self.day_dir(day)
        if not folder.exists():
            raise FileNotFoundError(f"Day {day} has not been generated.")
        try:
            country = Lesson.model_validate(self.load_json(folder / "country.json"))
            question = Lesson.model_validate(self.load_json(folder / "question.json"))
            manifest = self.load_json(folder / "manifest.json")
        except ValidationError as exc:
            raise ValueError(f"Generated day {day} does not match the lesson schema.") from exc
        return DayResponse(day=day, country=country, question=question, manifest=manifest)

    def save_lesson(self, day: int, lesson_type: LessonType, lesson: Lesson) -> None:
        self.write_json(self.day_dir(day) / f"{lesson_type}.json", lesson.model_dump(mode="json"))

    def load_manifest(self, day: int) -> dict:
        path = self.day_dir(day) / "manifest.json"
        if not path.exists():
            return {"day": day, "assets": {}}
        data = self.load_json(path)
        if not isinstance(data, dict):
            raise ValueError(f"Manifest for day {day} must be an object.")
        return data

    def save_manifest(self, day: int, manifest: dict) -> None:
        self.write_json(self.day_dir(day) / "manifest.json", manifest)

    def mark_complete(self, day: int, lesson_type: LessonType) -> StatusResponse:
        with _STATE_LOCK:
            state = self.load_state()
            if day != state.progress.current_day:
                raise ValueError(f"Only current day {state.progress.current_day} can be completed.")
            self.get_day(day)
            completed = state.progress.completed_lessons.setdefault(str(day), [])
            if lesson_type not in completed:
                completed.append(lesson_type)
            if {"country", "question"}.issubset(set(completed)):
                state.progress.current_day = min(day + 1, 366)
            self.save_state(state)
            return self.status()

    def update_last_generated_day(self, day: int) -> None:
        with _STATE_LOCK:
            state = self.load_state()
            state.generation.last_generated_day = max(state.generation.last_generated_day, day)
            self.save_state(state)
