from pathlib import Path

from backend.repository import JsonRepository
from backend.schemas import Asset, KeyFigure, Lesson, LessonCard, Source


def sample_lesson(day: int, lesson_type: str) -> Lesson:
    return Lesson(
        day=day,
        lesson_type=lesson_type,
        topic_id=f"{lesson_type}-001",
        topic_name="Sample",
        title="Une leçon d'exemple",
        hook="Une accroche claire.",
        summary="Un résumé utile.",
        takeaways=["Premier point", "Deuxième point", "Troisième point"],
        cards=[
            LessonCard(heading="Début", body="Texte."),
            LessonCard(heading="Contexte", body="Texte."),
            LessonCard(heading="Mécanisme", body="Texte."),
            LessonCard(heading="À retenir", body="Texte."),
        ],
        key_figures=[
            KeyFigure(label="Repère", value="1", note="Note."),
            KeyFigure(label="Repère", value="2", note="Note."),
        ],
        anecdote="Une anecdote mémorable.",
        sources=[
            Source(title="Source A", url="https://example.com/a", description="Description."),
            Source(title="Source B", url="https://example.com/b", description="Description."),
        ],
        image=Asset(path="/media/images/sample.svg", alt_text="Image d'exemple"),
        estimated_reading_minutes=5,
    )


def test_progress_advances_after_both_lessons_are_complete(tmp_path: Path) -> None:
    repo = JsonRepository(tmp_path)
    repo.ensure_dirs()
    repo.save_lesson(1, "country", sample_lesson(1, "country"))
    repo.save_lesson(1, "question", sample_lesson(1, "question"))
    repo.save_manifest(1, {"day": 1, "assets": {}})
    repo.update_last_generated_day(1)

    status = repo.mark_complete(1, "country")
    assert status.current_day == 1
    assert status.completed_lessons["1"] == ["country"]

    status = repo.mark_complete(1, "question")
    assert status.current_day == 2
    assert set(status.completed_lessons["1"]) == {"country", "question"}


def test_generated_day_round_trip(tmp_path: Path) -> None:
    repo = JsonRepository(tmp_path)
    repo.ensure_dirs()
    repo.save_lesson(1, "country", sample_lesson(1, "country"))
    repo.save_lesson(1, "question", sample_lesson(1, "question"))
    repo.save_manifest(1, {"day": 1, "assets": {"country": {}}})

    day = repo.get_day(1)
    assert day.country.title == "Une leçon d'exemple"
    assert day.question.lesson_type == "question"
