import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import App from "./App.jsx";
import { sondages } from "./content.js";

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
});

test("the poll page ranks averages and keeps a table view of every poll", () => {
  at("/sondages");
  expect(screen.getByRole("heading", { name: "Moyenne sur 30 jours" })).toBeInTheDocument();
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
