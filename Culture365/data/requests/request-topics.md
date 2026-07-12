# Culture365 Topic Pack Request

Create the file `data/inbox/topics.json`.

Return valid JSON with this exact top-level shape:

```json
{
  "countries": [
    {
      "id": "france",
      "name": "France",
      "type": "country",
      "category": "Western Europe",
      "rationale": "A sovereign state with major cultural, political, and historical influence.",
      "sensitivity_note": null
    }
  ],
  "questions": [
    {
      "id": "why-do-volcanoes-erupt",
      "name": "Why do volcanoes erupt?",
      "type": "question",
      "category": "Geology",
      "rationale": "A timeless question that explains plate tectonics and planetary activity.",
      "sensitivity_note": null
    }
  ]
}
```

Requirements:
- Exactly 365 `countries` and exactly 365 `questions`.
- Internal topic fields are in English.
- Include all sovereign states plus important regions, territories, disputed areas, and natural regions.
- Questions must be timeless and cover history, geography, economics, geopolitics, physics, biology, medicine, environment, computer science, AI, psychology, philosophy, religion, literature, arts, music, finance, energy, space, institutions, law, and society.
- No duplicates or near-duplicates.
- Sensitive topics must use a neutral `sensitivity_note`.

After the file exists, run:

```bash
python generate.py import data/inbox/topics.json
```
