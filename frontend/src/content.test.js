import { expect, test } from "vitest";

import { fmtDate, pollMeans, rollingAverage, windowAverage } from "./content.js";

const poll = (end, ...hypotheses) => ({ terrain: [end, end], hypotheses: hypotheses.map((scores) => ({ scores })) });
const polls = [
  poll("2026-09-01", { a: 10 }),
  poll("2026-10-10", { a: 20, b: 5 }, { a: 30 }),
  poll("2026-10-20", { b: 7 }),
];

test("a poll counts once, whatever its number of hypotheses", () => {
  expect(pollMeans(polls, "a").map((p) => p.value)).toEqual([10, 25]);
});

test("the 30-day window drops older polls", () => {
  const points = pollMeans(polls, "a");
  expect(windowAverage(points, Date.parse("2026-10-20"))).toEqual({ value: 25, n: 1 });
  expect(rollingAverage(points).map((p) => p.value)).toEqual([10, 25]);
  expect(windowAverage(pollMeans(polls, "c"), Date.parse("2026-10-20"))).toBeNull();
});

test("partial dates read naturally", () => {
  expect([fmtDate("2016"), fmtDate("2016-12"), fmtDate("2016-12-01"), fmtDate("2026-05-03")]).toEqual([
    "2016",
    "déc. 2016",
    "1er déc. 2016",
    "3 mai 2026",
  ]);
});
