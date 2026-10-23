import json
from pathlib import Path

from backend.repository import JsonRepository
from backend.schemas import Asset
from generator.manual import create_batch_request, create_topics_request, import_pack, validate_pack
from generator.static_export import export_static
from tests.test_repository import sample_lesson


def topic(index: int, lesson_type: str) -> dict:
    return {
        "id": f"{lesson_type}-{index:03d}",
        "name": f"{lesson_type.title()} {index}",
        "type": lesson_type,
        "category": "General",
        "rationale": "Useful Culture365 topic.",
        "sensitivity_note": None,
    }


def test_import_manual_pack_writes_topics_lessons_and_state(tmp_path: Path) -> None:
    repo = JsonRepository(tmp_path)
    repo.ensure_dirs()
    country = sample_lesson(1, "country").model_copy(update={"image": Asset(path="", alt_text="Image du pays")})
    question = sample_lesson(1, "question").model_copy(update={"image": Asset(path="", alt_text="Image de la question")})
    pack_path = tmp_path / "pack.json"
    pack_path.write_text(
        dump_json(
            {
                "countries": [topic(i, "country") for i in range(1, 366)],
                "questions": [topic(i, "question") for i in range(1, 366)],
                "days": [{"day": 1, "country": country.model_dump(mode="json"), "question": question.model_dump(mode="json"), "manifest": {}}],
            }
        ),
        encoding="utf-8",
    )

    pack = import_pack(pack_path, repo)

    assert len(pack.countries or []) == 365
    assert repo.status().last_generated_day == 1
    day = repo.get_day(1)
    assert day.country.image.path == "/media/images/default-country.svg"
    assert day.question.image.path == "/media/images/default-question.svg"


def test_create_requests(tmp_path: Path, monkeypatch) -> None:
    import generator.manual as manual

    repo = JsonRepository(tmp_path)
    repo.ensure_dirs()
    repo.write_json(repo.topics_dir / "countries.json", {"topics": [topic(i, "country") for i in range(1, 366)]})
    repo.write_json(repo.topics_dir / "questions.json", {"topics": [topic(i, "question") for i in range(1, 366)]})
    monkeypatch.setattr(manual, "REQUESTS_DIR", tmp_path / "data" / "requests")
    monkeypatch.setattr(manual, "INBOX_DIR", tmp_path / "data" / "inbox")

    topics_request = create_topics_request(repo)
    batch_request = create_batch_request(repo, 14)

    assert topics_request.exists()
    assert batch_request.exists()
    assert "country-001" in batch_request.read_text(encoding="utf-8")


def test_validate_rejects_short_topic_lists(tmp_path: Path) -> None:
    pack_path = tmp_path / "bad-pack.json"
    pack_path.write_text(dump_json({"countries": [topic(1, "country")]}), encoding="utf-8")

    try:
        validate_pack(pack_path)
    except ValueError as exc:
        assert "365" in str(exc)
    else:
        raise AssertionError("Expected short topic list to fail validation.")


def test_export_static_writes_public_content_and_cache_manifest(tmp_path: Path) -> None:
    repo = JsonRepository(tmp_path)
    repo.ensure_dirs()
    repo.save_lesson(1, "country", sample_lesson(1, "country").model_copy(update={"image": Asset(path="/media/images/default-country.svg", alt_text="Image")}))
    repo.save_lesson(1, "question", sample_lesson(1, "question").model_copy(update={"image": Asset(path="/media/images/default-question.svg", alt_text="Image")}))
    repo.save_manifest(1, {"day": 1, "assets": {}})
    repo.update_last_generated_day(1)

    media_dir = tmp_path / "assets"
    (media_dir / "images").mkdir(parents=True)
    (media_dir / "images" / "default-country.svg").write_text("<svg/>", encoding="utf-8")
    (media_dir / "images" / "default-question.svg").write_text("<svg/>", encoding="utf-8")
    public_dir = tmp_path / "frontend" / "public"

    state = export_static(days=1, repo=repo, public_dir=public_dir, media_dir=media_dir)

    assert state["generated_days"] == [1]
    assert (public_dir / "content" / "generated" / "day-001" / "country.json").exists()
    assert (public_dir / "media" / "images" / "default-country.svg").exists()
    offline_assets = json.loads((public_dir / "offline-assets.json").read_text(encoding="utf-8"))
    assert "/content/generated/day-001/country.json" in offline_assets
    assert "/media/images/default-question.svg" in offline_assets


def dump_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False)
