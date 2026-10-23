import json
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError, model_validator

from backend.paths import DATA_DIR
from backend.repository import JsonRepository
from backend.schemas import Asset, Lesson, LessonType, Topic, TopicList

INBOX_DIR = DATA_DIR / "inbox"
REQUESTS_DIR = DATA_DIR / "requests"


class ManualDay(BaseModel):
    day: int = Field(ge=1, le=365)
    country: Lesson | None = None
    question: Lesson | None = None
    manifest: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def require_lesson(self) -> "ManualDay":
        if self.country is None and self.question is None:
            raise ValueError("A day must include at least one country or question lesson.")
        return self


class ManualContentPack(BaseModel):
    countries: list[Topic] | None = None
    questions: list[Topic] | None = None
    days: list[ManualDay] = Field(default_factory=list)

    @model_validator(mode="after")
    def require_content(self) -> "ManualContentPack":
        if self.countries is None and self.questions is None and not self.days:
            raise ValueError("A pack must include countries, questions, or days.")
        return self


def ensure_manual_dirs() -> None:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    REQUESTS_DIR.mkdir(parents=True, exist_ok=True)


def load_pack(path: Path) -> ManualContentPack:
    try:
        return ManualContentPack.model_validate_json(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise
    except ValidationError:
        raise
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path} is not valid JSON.") from exc


def validate_pack(path: Path) -> ManualContentPack:
    pack = load_pack(path)
    if pack.countries is not None:
        validate_topics(pack.countries, "country")
    if pack.questions is not None:
        validate_topics(pack.questions, "question")
    for day in pack.days:
        if day.country is not None:
            validate_lesson(day.day, "country", day.country)
        if day.question is not None:
            validate_lesson(day.day, "question", day.question)
    return pack


def validate_topics(topics: list[Topic], lesson_type: LessonType) -> None:
    TopicList(topics=topics)
    ids = [topic.id for topic in topics]
    names = [topic.name.casefold().strip() for topic in topics]
    if len(ids) != len(set(ids)):
        raise ValueError(f"Duplicate {lesson_type} topic ids.")
    if len(names) != len(set(names)):
        raise ValueError(f"Duplicate {lesson_type} topic names.")
    wrong_type = [topic.name for topic in topics if topic.type != lesson_type]
    if wrong_type:
        raise ValueError(f"Wrong type in {lesson_type} topics: {wrong_type[0]}")


def validate_lesson(day: int, lesson_type: LessonType, lesson: Lesson) -> None:
    if lesson.day != day:
        raise ValueError(f"{lesson_type} lesson says day {lesson.day}, expected {day}.")
    if lesson.lesson_type != lesson_type:
        raise ValueError(f"Day {day} lesson type is {lesson.lesson_type}, expected {lesson_type}.")
    if lesson.language != "fr":
        raise ValueError(f"Day {day} {lesson_type} lesson must use language='fr'.")


def import_pack(path: Path, repo: JsonRepository) -> ManualContentPack:
    pack = validate_pack(path)
    repo.ensure_dirs()

    if pack.countries is not None:
        repo.write_json(repo.topics_dir / "countries.json", {"topics": [topic.model_dump(mode="json") for topic in pack.countries]})
    if pack.questions is not None:
        repo.write_json(repo.topics_dir / "questions.json", {"topics": [topic.model_dump(mode="json") for topic in pack.questions]})

    imported_days: list[int] = []
    for day in pack.days:
        manifest = {"day": day.day, **day.manifest}
        manifest.setdefault("assets", {})
        manifest.setdefault("topics", {})

        if day.country is not None:
            lesson = with_default_image(day.country, "country")
            repo.save_lesson(day.day, "country", lesson)
            manifest["topics"]["country"] = {"id": lesson.topic_id, "name": lesson.topic_name, "type": "country"}
            manifest["assets"]["country"] = {"image": lesson.image.model_dump(mode="json")}
        if day.question is not None:
            lesson = with_default_image(day.question, "question")
            repo.save_lesson(day.day, "question", lesson)
            manifest["topics"]["question"] = {"id": lesson.topic_id, "name": lesson.topic_name, "type": "question"}
            manifest["assets"]["question"] = {"image": lesson.image.model_dump(mode="json")}

        repo.save_manifest(day.day, manifest)
        if day.country is not None and day.question is not None:
            imported_days.append(day.day)

    if imported_days:
        repo.update_last_generated_day(max(imported_days))
    return pack


def with_default_image(lesson: Lesson, lesson_type: LessonType) -> Lesson:
    if lesson.image.path:
        return lesson
    fallback = Asset(
        path=f"/media/images/default-{lesson_type}.svg",
        alt_text=lesson.image.alt_text or ("Illustration du territoire" if lesson_type == "country" else "Illustration de la question"),
    )
    return lesson.model_copy(update={"image": fallback})


def topics_ready(repo: JsonRepository) -> bool:
    return (repo.topics_dir / "countries.json").exists() and (repo.topics_dir / "questions.json").exists()


def load_topics(repo: JsonRepository, filename: str) -> list[Topic]:
    data = repo.load_json(repo.topics_dir / filename)
    return TopicList.model_validate(data).topics


def create_topics_request(repo: JsonRepository) -> Path:
    ensure_manual_dirs()
    repo.ensure_dirs()
    path = REQUESTS_DIR / "request-topics.md"
    path.write_text(TOPICS_REQUEST, encoding="utf-8")
    return path


def create_batch_request(repo: JsonRepository, count: int, start_day: int | None = None) -> Path:
    if count < 1:
        raise ValueError("Count must be at least 1.")
    ensure_manual_dirs()
    repo.ensure_dirs()
    if not topics_ready(repo):
        create_topics_request(repo)
        raise FileNotFoundError("Topic lists are missing. Fill and import data/requests/request-topics.md first.")

    countries = load_topics(repo, "countries.json")
    questions = load_topics(repo, "questions.json")
    state = repo.load_state()
    start = start_day or state.generation.last_generated_day + 1
    if not 1 <= start <= 365:
        raise ValueError("Start day must be between 1 and 365.")
    end = min(start + count - 1, 365)
    days = [
        {
            "day": day,
            "country_topic": countries[day - 1].model_dump(mode="json"),
            "question_topic": questions[day - 1].model_dump(mode="json"),
        }
        for day in range(start, end + 1)
    ]
    out_path = INBOX_DIR / f"pack-days-{start:03d}-{end:03d}.json"
    display_out_path = Path("data") / "inbox" / out_path.name
    request_path = REQUESTS_DIR / f"request-days-{start:03d}-{end:03d}.md"
    request_path.write_text(BATCH_REQUEST.format(days=json.dumps(days, ensure_ascii=False, indent=2), out_path=display_out_path), encoding="utf-8")
    return request_path


TOPICS_REQUEST = """# Culture365 Topic Pack Request

Create the file `data/inbox/topics.json`.

Return valid JSON with this exact top-level shape:

```json
{
  "countries": [
    {
      "id": "france",
      "name": "France",
      "type": "country",
      "category": "Western Europe",
      "rationale": "A sovereign state with major cultural, political, and historical influence.",
      "sensitivity_note": null
    }
  ],
  "questions": [
    {
      "id": "why-do-volcanoes-erupt",
      "name": "Why do volcanoes erupt?",
      "type": "question",
      "category": "Geology",
      "rationale": "A timeless question that explains plate tectonics and planetary activity.",
      "sensitivity_note": null
    }
  ]
}
```

Requirements:
- Exactly 365 `countries` and exactly 365 `questions`.
- Internal topic fields are in English.
- Include all sovereign states plus important regions, territories, disputed areas, and natural regions.
- Questions must be timeless and cover history, geography, economics, geopolitics, physics, biology, medicine, environment, computer science, AI, psychology, philosophy, religion, literature, arts, music, finance, energy, space, institutions, law, and society.
- No duplicates or near-duplicates.
- Sensitive topics must use a neutral `sensitivity_note`.

After the file exists, run:

```bash
python generate.py import data/inbox/topics.json
```
"""


BATCH_REQUEST = """# Culture365 14-Day Content Pack Request

Create the file `{out_path}`.

Return valid JSON with this exact top-level shape:

```json
{{
  "days": [
    {{
      "day": 1,
      "country": {{
        "day": 1,
        "lesson_type": "country",
        "topic_id": "topic-id",
        "topic_name": "Topic name",
        "language": "fr",
        "title": "Titre en français",
        "hook": "Accroche en français",
        "summary": "Résumé en français",
        "takeaways": ["Point clé", "Point clé", "Point clé"],
        "cards": [
          {{"heading": "Intertitre", "body": "Texte court."}},
          {{"heading": "Intertitre", "body": "Texte court."}},
          {{"heading": "Intertitre", "body": "Texte court."}},
          {{"heading": "Intertitre", "body": "Texte court."}}
        ],
        "key_figures": [
          {{"label": "Repère", "value": "Valeur", "note": "Note courte."}},
          {{"label": "Repère", "value": "Valeur", "note": "Note courte."}}
        ],
        "anecdote": "Anecdote en français",
        "sources": [
          {{"title": "Source fiable", "url": "https://example.com", "description": "Description en français."}},
          {{"title": "Source fiable", "url": "https://example.com", "description": "Description en français."}}
        ],
        "image": {{"path": "", "original_url": null, "author": null, "license": null, "alt_text": "Illustration descriptive en français"}},
        "estimated_reading_minutes": 5
      }},
      "question": {{ "...": "same schema with lesson_type question" }},
      "manifest": {{}}
    }}
  ]
}}
```

Hard requirements:
- All end-user content in lessons is French.
- Code/schema keys stay English.
- Each lesson should feel like a polished five-minute mobile read.
- Write like an excellent educator: vivid, concise, accurate, curious, never academic.
- Use 4 to 8 small cards per lesson, not one long article.
- Use 3 to 6 takeaways and 2 to 6 key figures/concepts.
- Use 2 to 6 reliable sources per lesson. Prefer stable public references.
- Keep `image.path` empty unless a local `/media/...` asset already exists; the importer will use a default local image.
- Preserve each supplied day number, topic id, topic name, and lesson type exactly.

Topics to generate:

```json
{days}
```

After the file exists, run:

```bash
python generate.py import {out_path}
```
"""
