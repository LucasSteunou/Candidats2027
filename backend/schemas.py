from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator

LessonType = Literal["country", "question"]


class Asset(BaseModel):
    path: str = Field(description="Local app path, for example /media/images/day-001.jpg.")
    original_url: str | None = None
    author: str | None = None
    license: str | None = None
    alt_text: str


class Source(BaseModel):
    title: str
    url: HttpUrl | str
    description: str


class LessonCard(BaseModel):
    heading: str
    body: str


class KeyFigure(BaseModel):
    label: str
    value: str
    note: str


class Lesson(BaseModel):
    day: int = Field(ge=1, le=365)
    lesson_type: LessonType
    topic_id: str
    topic_name: str
    language: Literal["fr"] = "fr"
    title: str
    hook: str
    summary: str
    takeaways: list[str] = Field(min_length=3, max_length=6)
    cards: list[LessonCard] = Field(min_length=4, max_length=8)
    key_figures: list[KeyFigure] = Field(min_length=2, max_length=6)
    anecdote: str
    sources: list[Source] = Field(min_length=2, max_length=6)
    image: Asset
    estimated_reading_minutes: int = Field(ge=3, le=8)

    @field_validator("title", "hook", "summary", "anecdote")
    @classmethod
    def require_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Text fields cannot be empty.")
        return value


class Topic(BaseModel):
    id: str
    name: str
    type: LessonType
    category: str
    rationale: str
    sensitivity_note: str | None = None


class TopicList(BaseModel):
    topics: list[Topic] = Field(min_length=365, max_length=365)


class ReviewResult(BaseModel):
    issues_found: list[str]
    lesson: Lesson


class GenerationState(BaseModel):
    last_generated_day: int = Field(default=0, ge=0, le=365)


class ProgressState(BaseModel):
    current_day: int = Field(default=1, ge=1, le=366)
    completed_lessons: dict[str, list[LessonType]] = Field(default_factory=dict)


class AppState(BaseModel):
    generation: GenerationState = Field(default_factory=GenerationState)
    progress: ProgressState = Field(default_factory=ProgressState)


class StatusResponse(BaseModel):
    current_day: int
    last_generated_day: int
    generated_days: list[int]
    completed_lessons: dict[str, list[LessonType]]


class DayResponse(BaseModel):
    day: int
    country: Lesson
    question: Lesson
    manifest: dict
