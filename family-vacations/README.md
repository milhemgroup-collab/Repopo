# Family Travel Ledger

A self-contained interactive page reconstructing family travel between February 2021
and July 2026 from booking confirmations.

- `index.html` — the site. Open it directly in a browser; no server, no build step.
- `data/trips.json` — the extracted ledger, kept separately so it can be read or
  edited without touching the page. Top-level keys: `meta`, `people`, `airports`,
  `trips`, `milestones`, `crossings` (the four international entries drawn as passport
  stamps), and `seasonality` (the month counts behind Figure 2).

The page carries its own copy of this data inline, so the two must be kept in step —
see **Editing** below.

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

## Travel ephemera

Beyond the plates, the page borrows the anatomy of real travel documents, and each
piece carries information rather than decorating:

- **Passport stamps** — one per international entry (Mexico, Costa Rica, Italy, plus
  Canada as a transit stop, drawn with a dashed ring to mark it as a connection). Dates
  are the arrival leg from the itinerary.
- **Route strips** — each trip's flights drawn as a line of airport chips with a plane
  between them, so `MCO → EWR → MXP` reads as a journey instead of a string. Trips with
  no flights say so plainly.
- **Perforation and barcode** — a notch on the stub seam and a barcode along the bottom
  edge. The barcode is decorative but deterministic: it is generated from the trip id,
  so a given entry always renders the same bars.
- **Figure 2, departures by month** — a real derived finding. July is the peak, February
  is a habit, and spring is completely empty.

## Colour

The chart and map marks use tokens (`--mark-sea`, `--mark-void`) kept separate from the
text tokens, which are tuned for small-text contrast rather than mark separation. Both
mark pairs were checked with the `dataviz` skill's palette validator against each mode's
surface and pass all six checks.

That check caught a real problem: the original light-mode amber and stamp red were only
ΔE 12.1 apart in normal vision — below the readable floor — and they sat next to each
other as the `work` and `cancelled` tags. The fix was to stop using amber as a category
at all. It is the page's single accent (the hub, hover states, milestone figures); the
`work` tag is now neutral ink and relies on the word itself.

## Editing

To add a trip, append an object to the `TRIPS` array near the top of the `<script>` block
in `index.html`, and mirror it into `data/trips.json`. The stats, the diagram, the year
groupings, Figure 2 and the filters all derive from that array, so nothing else needs
updating.

The page is the renderer and the JSON is the record, so drift between them is the failure
mode to watch. To check, load the page in a headless browser, read the `TRIPS` and
`STAMPS` globals, and diff them against `trips.json` — that is how the `place` fields for
`atlanta-2022` and `italy-2025` were caught after they were edited in one file and not
the other. A new international entry needs a row in `crossings` as well as its trip.

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
