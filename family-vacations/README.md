# Family Travel Ledger

A self-contained interactive page reconstructing family travel between February 2021
and July 2026 from booking confirmations.

- `index.html` — the site. Open it directly in a browser; no server, no build step.
- `data/trips.json` — the extracted ledger, kept separately so it can be read or
  edited without touching the page.

## What it's built from

**Gmail is the only substantive source.** Airline confirmations, hotel folios, Airbnb
host messages, cancellation notices, and a handful of emails written by hand about the
Austin plan.

| Source | Contribution |
| --- | --- |
| Gmail | Everything. 16 entries, 2021–2026. |
| Google Calendar | Nothing. Searched the full range for vacation/trip/flight/beach/travel — zero matching events. |
| Google Drive | Two PDFs of the same cancelled Aug 2022 Southwest booking. |
| Photos | Nothing usable — see below. |

## The photo audit

Around 120 images across two Drive folders. The result was zero usable photographs, and
the page says so rather than hiding it:

- One cluster is dated **Nov 2019**, outside the agreed range.
- The other is an **Oct 2023 camera-roll dump**, not trip photography.
- Four images date-match the St. Louis trip exactly. On inspection all four are
  **screenshots** — a rental-car confirmation, a work all-hands email, and a private
  family message thread. None were embedded.
- Most files are HEIC, which browsers cannot render anyway.

The iOS filename stamp (`20231011_164021000_iOS.jpg`) is the true capture date. Drive's
`modifiedTime` is upload noise and should be ignored when matching.

## Privacy

Confirmation codes, ticket numbers, loyalty-program numbers, card digits and email
addresses were stripped at extraction. They are not in `index.html`, not in
`trips.json`, and not in the git history. Keep it that way when editing.

Children's names appeared in one screenshot during the photo audit and were
deliberately left out of both files.

## Design notes

The identity is a flight manifest / departure board rather than a travel poster, because
the paper trail *is* the subject. Three typefaces do three jobs: a grotesque for signage,
monospace for codes and times, a serif for prose. All are system stacks — the page loads
no external fonts, scripts, styles or images, so it works offline and satisfies a strict
CSP.

Because there were no usable photographs, each destination gets an illustrated **plate**
— a layered SVG scene drawn in the manifest palette, so the set reads as printed
ticket stock rather than stock photography. Thirteen plates cover every place in the
ledger: the Salute domes and a gondola's ferro for Venice, Rainier behind the Sound for
Seattle, a night launch off the Space Coast, the Gateway Arch, Popocatépetl above the
cathedral towers in Mexico City. Each plate pairs with the smaller monoline souvenir
emblem. Plates live as `<symbol id="p-*">` and emblems as `<g id="r-*">` in the sprite at
the top of the file; a trip's `relic` key selects both.

Plates are composed at 320×200 and rendered at a fixed height rather than stretched to
fill, because `preserveAspectRatio="slice"` in a tall container crops away the very
landmark that identifies the place.

Figure 1 is a radial route diagram, not a map. Every destination sits at its true compass
bearing from Orlando with distance on a log scale, so the short Florida hops stay legible
next to the Atlantic crossing. Distances and bearings are computed at runtime from
coordinates — no distance on the page is hand-typed.

## Editing

To add a trip, append an object to the `TRIPS` array near the top of the `<script>` block
in `index.html`, and mirror it into `data/trips.json`. The stats, the diagram, the year
groupings and the filters all derive from that array, so nothing else needs updating.

Fields: `id`, `start`, `end` (ISO), `place`, `region`, `country`, `lat`, `lon`, `party`
(keys into `PEOPLE`), `kind` (`vacation` · `cancelled` · `work` · `visit` · `outing`),
`relic` (a key in `RELIC_NOTES`), `lodging[]`, `legs[[from,to]]` (IATA codes present in
`AIRPORTS`), `carrier`, `headline`, `note`, `evidence`, and optional `approx: true` when
the dates come from a reminder rather than a booking.

To add a photo later, drop it beside `index.html` and reference it from the trip's stub —
but convert HEIC to JPEG first, and check what the image actually shows before publishing.

## Validate

```sh
python -m json.tool family-vacations/data/trips.json >/dev/null
```
