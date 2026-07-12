Codex/manual mode: create exactly 365 timeless Culture365 general knowledge questions for `data/inbox/topics.json`.

Requirements:
- Cover history, geography, economics, geopolitics, physics, biology, medicine, environment, computer science, AI, psychology, philosophy, religion, literature, arts, music, finance, energy, space, institutions, law, and society.
- Avoid current events and questions that will become obsolete quickly.
- Avoid duplicate concepts and obvious overlaps.
- Prefer questions that can teach a powerful mental model in about five minutes.
- The topic list itself is internal developer data, so write fields in English.
- Match the JSON pack schema produced by `python generate.py init`.

Each topic must have:
- id: stable kebab-case id.
- name: the question in English.
- type: "question".
- category: main knowledge domain.
- rationale: one sentence explaining why this question is valuable.
- sensitivity_note: null unless neutral handling is especially important.
