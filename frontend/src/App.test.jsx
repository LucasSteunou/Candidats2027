import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import App from "./App.jsx";
import { sondages } from "./content.js";
import { cutText, withUnits } from "./ui.jsx";

const at = (hash) => {
  window.location.hash = hash;
  return render(<App />);
};

beforeEach(() => {
  window.location.hash = "/";
  window.scrollTo = () => {}; // not implemented by jsdom
});

test("lists every candidature with a link to its fiche", () => {
  at("/");
  expect(screen.getByRole("button", { name: /Jean-Luc Mélenchon/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Karim Bouamrane/ })).toBeInTheDocument();
});

test("a fiche shows the programme and opens a source sheet", () => {
  at("/c/melenchon");
  expect(screen.getByRole("heading", { name: "Jean-Luc Mélenchon" })).toBeInTheDocument();
  expect(screen.getByText("Économie, travail et finances publiques")).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole("button", { name: /^Source \d+ :/ })[0]);
  const sheet = screen.getByRole("dialog");
  expect(within(sheet).getByRole("link", { name: /Ouvrir la source/ })).toHaveAttribute("href", expect.stringMatching(/^https:/));
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("the comparator answers key questions with units and origin", () => {
  at("/comparer/economie");
  expect(screen.getByRole("heading", { name: "Âge légal de départ visé" })).toBeInTheDocument();
  expect(screen.getAllByText("60 ans").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Programme 2027 ·/).length).toBeGreaterThan(0);
  const sections = document.querySelectorAll("details.theme");
  expect(sections.length).toBeGreaterThan(1);
  expect([...sections].every((d) => !d.open)).toBe(true); // collapsed until opened, like the programmes
});

test("the poll page ranks averages and keeps a table view of every poll", () => {
  at("/sondages");
  expect(screen.getByText("Moyenne sur 30 jours")).toBeInTheDocument();
  expect(screen.getAllByRole("table").length).toBe(sondages.sondages.length);
  expect(screen.getByText("Elabe pour BFMTV et La Tribune Dimanche")).toBeInTheDocument();
  expect(screen.getAllByText("<1").length).toBeGreaterThan(0); // a published « moins de 1 % » is never shown as 0
  expect(screen.getByRole("heading", { name: "Comment lire les tableaux" })).toBeInTheDocument();
  expect(screen.getAllByText("É. Philippe et G. Attal").length).toBeGreaterThan(0); // the scenario legend sits under the table
});

test("a chart point announces its poll when focused", () => {
  at("/c/le-pen/popularite");
  const point = screen.getAllByRole("img", { name: /Intentions de vote pour Marine Le Pen/ })[0].querySelector("circle.trend-dot");
  fireEvent.focus(point);
  expect(screen.getAllByText(/terrain du .* Moyenne 30 jours/).length).toBeGreaterThan(0);
});

test("the methodology page renders the charter and the perimeter", () => {
  at("/methodo");
  expect(screen.getByRole("heading", { name: "Qui a une fiche" })).toBeInTheDocument();
  expect(screen.getByText("Testés en sondage, sans fiche")).toBeInTheDocument();
});

test("a long text is cut at a word and opens with « Lire la suite »", () => {
  at("/c/le-pen");
  const more = screen.getAllByRole("button", { name: "Lire la suite" })[0];
  const text = more.closest(".clamp-foot").previousElementSibling;
  expect(text.textContent.endsWith("…")).toBe(true);
  fireEvent.click(more);
  expect(more).toHaveAttribute("aria-expanded", "true");
  expect(more).toHaveTextContent("Réduire");
  expect(text.textContent.endsWith("…")).toBe(false);
});

test("a cut hides at least two lines, never stops inside « », and units stay with their figure", () => {
  expect(cutText("mot ".repeat(60), 240)).toBeNull(); // 240 characters: under the threshold, shown in full
  const quoted = `${"mot ".repeat(50)}« une citation qui continue ${"encore ".repeat(60)}»`;
  const cut = cutText(quoted, 240);
  expect(cut.endsWith("…")).toBe(true);
  expect(cut).not.toContain("«");
  expect(withUnits("19,58 % et 9 Md€")).toBe("19,58\u202F% et 9\u202FMd€");
});
