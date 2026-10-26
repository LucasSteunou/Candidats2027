import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import App from "./App.jsx";

const at = (hash) => {
  window.location.hash = hash;
  return render(<App />);
};

beforeEach(() => {
  window.location.hash = "/";
  window.scrollTo = () => {}; // not implemented by jsdom
});

test("lists every candidature, with pending fiches marked", () => {
  at("/");
  expect(screen.getByRole("button", { name: /Jean-Luc Mélenchon/ })).toBeInTheDocument();
  expect(screen.getByText("Marine Le Pen")).toBeInTheDocument();
  expect(screen.getAllByText("Fiche en préparation").length).toBeGreaterThan(0);
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
  expect(screen.getByText("60 ans")).toBeInTheDocument();
  expect(screen.getAllByText(/Programme 2027 ·/).length).toBeGreaterThan(0);
});

test("the poll page ranks averages and keeps a table view of every poll", () => {
  at("/sondages");
  expect(screen.getByRole("heading", { name: "Moyenne sur 30 jours" })).toBeInTheDocument();
  expect(screen.getAllByRole("table").length).toBe(3);
  expect(screen.getByText("Elabe pour BFMTV et La Tribune Dimanche")).toBeInTheDocument();
});

test("the methodology page renders the charter and the perimeter", () => {
  at("/methodo");
  expect(screen.getByRole("heading", { name: "Qui a une fiche" })).toBeInTheDocument();
  expect(screen.getByText("Testés en sondage, sans fiche")).toBeInTheDocument();
});
