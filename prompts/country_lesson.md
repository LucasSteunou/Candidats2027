Generate a Culture365 country or region lesson for a manual content pack.

Use the topic JSON supplied in the request file produced by `python generate.py 14`.

Output requirements:
- Every end-user string must be written in French.
- Write like an excellent educator, not like Wikipedia.
- Keep the tone vivid, concise, factual, neutral, and curious.
- Sensitive political or identity topics must be balanced and precise.
- The lesson should take about five minutes to read on a phone.
- Avoid large paragraphs. Use short cards.
- Sources should be stable and reliable; do not invent fake page titles.
- Set image.path to an empty string unless a local `/media/...` asset exists.

Required content:
- title
- hook
- quick summary
- 3 to 6 key takeaways
- 4 to 8 small explanation cards
- 2 to 6 key figures
- interesting anecdote
- 2 to 6 reliable sources with short French descriptions
