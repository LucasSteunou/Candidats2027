import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import App from "./App.jsx";

const lesson = (type) => ({
  day: 1,
  lesson_type: type,
  topic_id: type,
  topic_name: type,
  language: "fr",
  title: type === "country" ? "Le Japon en cinq minutes" : "Pourquoi les volcans entrent-ils en éruption ?",
  hook: "Une accroche courte et fascinante.",
  summary: "Un résumé bref.",
  takeaways: ["Un", "Deux", "Trois"],
  cards: [
    { heading: "Carte 1", body: "Texte." },
    { heading: "Carte 2", body: "Texte." },
    { heading: "Carte 3", body: "Texte." },
    { heading: "Carte 4", body: "Texte." },
  ],
  key_figures: [
    { label: "Repère", value: "1", note: "Note." },
    { label: "Repère", value: "2", note: "Note." },
  ],
  anecdote: "Une anecdote.",
  sources: [
    { title: "Source A", url: "https://example.com/a", description: "Description." },
    { title: "Source B", url: "https://example.com/b", description: "Description." },
  ],
  image: { path: "", alt_text: "Image" },
  estimated_reading_minutes: 5,
});

beforeEach(() => {
  window.location.hash = "/";
  global.fetch = vi.fn((url) => {
    if (String(url).endsWith("/api/status")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            current_day: 1,
            last_generated_day: 1,
            generated_days: [1],
            completed_lessons: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }
    if (String(url).endsWith("/api/day/current")) {
      return Promise.resolve(
        new Response(JSON.stringify({ day: 1, country: lesson("country"), question: lesson("question"), manifest: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(new Response("Not found", { status: 404 }));
  });
});

test("renders the current day cards", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText("Jour 1")).toBeInTheDocument());
  expect(screen.getByText("Pays du jour")).toBeInTheDocument();
  expect(screen.getByText("Question du jour")).toBeInTheDocument();
});
