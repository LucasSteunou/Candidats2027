import perimetre from "../../content/perimetre.json";
import sondages from "../../content/sondages.json";
import themesData from "../../content/themes.json";

// shortcut: every fiche is bundled eagerly (precached with the app); switch to lazy + precache manifest past ~2 MB.
const ficheModules = import.meta.glob("../../content/candidatures/*.json", { eager: true, import: "default" });

export const fiches = Object.fromEntries(Object.values(ficheModules).map((fiche) => [fiche.id, fiche]));
export const themes = themesData.themes;
export { perimetre, sondages };

// perimetre.json is kept in alphabetical order by last name (checked by the Python tests).
export const candidatures = perimetre.candidatures.map((c) => ({ ...c, fiche: fiches[c.id] }));

const DAY = 86_400_000;
export const WINDOW_DAYS = 30;

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const pollDate = (poll) => Date.parse(poll.terrain[1]);

/** A score published as "<1" is shown as published and counts for 0.5 in every computation. */
export const scoreValue = (score) => (score === "<1" ? 0.5 : score);

/** One value per poll: the mean of the hypotheses in which the candidate was tested. `raw` keeps the scores as published. */
export function pollMeans(polls, id) {
  return polls
    .flatMap((poll) => {
      const raw = poll.hypotheses.map((h) => h.scores[id]).filter((v) => v !== undefined);
      const scores = raw.map(scoreValue);
      return scores.length ? [{ poll, date: pollDate(poll), value: mean(scores), scores, raw }] : [];
    })
    .sort((a, b) => a.date - b.date);
}

/** Mean of the poll values in the window ending at `end` (inclusive). */
export function windowAverage(points, end, days = WINDOW_DAYS) {
  const inWindow = points.filter((p) => p.date <= end && p.date > end - days * DAY);
  return inWindow.length ? { value: mean(inWindow.map((p) => p.value)), n: inWindow.length } : null;
}

/** Rolling average at each distinct poll date. */
export function rollingAverage(points, days = WINDOW_DAYS) {
  const dates = [...new Set(points.map((p) => p.date))];
  return dates.map((date) => ({ date, ...windowAverage(points, date, days) }));
}

export const latestPollDate = Math.max(...sondages.sondages.map(pollDate));
export const pollDomain = [
  Math.min(...sondages.sondages.map((p) => Date.parse(p.terrain[0]))) - 4 * DAY,
  latestPollDate + 4 * DAY,
];

export function candidatePolls(id) {
  const points = pollMeans(sondages.sondages, id);
  return { points, line: rollingAverage(points), latest: windowAverage(points, latestPollDate) };
}

export function lastName(nom) {
  return nom.slice(nom.indexOf(" ") + 1);
}

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
export const fmtNumber = (value) => (value === "<1" ? value : number.format(value));
export const fmtPct = (value) => `${fmtNumber(value)} %`;

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** "2016" | "2016-12" | "2016-12-01" -> "2016" | "déc. 2016" | "1er déc. 2016" */
export function fmtDate(value) {
  const [year, month, day] = String(value).split("-");
  if (!month) return year;
  const label = `${MONTHS[Number(month) - 1]} ${year}`;
  if (!day) return label;
  return `${Number(day) === 1 ? "1er" : Number(day)} ${label}`;
}

export function fmtTimestamp(ms) {
  return fmtDate(new Date(ms).toISOString().slice(0, 10));
}
