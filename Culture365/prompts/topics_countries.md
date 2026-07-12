Codex/manual mode: create exactly 365 Culture365 country-or-region topics for `data/inbox/topics.json`.

Requirements:
- Include all sovereign states.
- Include overseas territories, culturally important regions, historically important regions, disputed territories, politically sensitive regions, and major natural regions where relevant.
- Ensure geographic balance across continents and oceans.
- Avoid duplicates and near-duplicates.
- Sensitive topics must be framed neutrally and factually.
- The topic list itself is internal developer data, so write fields in English.
- Use stable, durable choices that will still make sense years from now.
- Match the JSON pack schema produced by `python generate.py init`.

Each topic must have:
- id: stable kebab-case id.
- name: common English name.
- type: "country".
- category: broad region, for example "Europe", "West Africa", "Pacific", "Polar regions".
- rationale: one sentence explaining why it belongs in Culture365.
- sensitivity_note: null unless neutral handling is especially important.
