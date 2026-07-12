Generate a Culture365 general knowledge question lesson for a manual content pack.

Use the topic JSON supplied in the request file produced by `python generate.py 14`.

Output requirements:
- Every end-user string must be written in French.
- Write like an excellent science communicator or storyteller.
- The reader should often think: "C'est fascinant."
- Keep the lesson timeless; avoid news and fragile current examples.
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
- 2 to 6 key figures or key concepts
- interesting anecdote
- 2 to 6 reliable sources with short French descriptions
