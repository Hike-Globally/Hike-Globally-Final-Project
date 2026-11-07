# Who Is This Trip For / Who Is This Trip Not For

Two short, honest cards that help a visitor decide whether a trip suits them. They appear on the
trip page directly after **Highlights**.

## For editors

Open a trip in the admin. Directly under the **Highlights** panel you will find two panels, each
marked by a small glyph and a coloured edge: a blue check for **Who Is This Trip For** and a red
cross for **Who Is This Trip Not For**.

| Field           | What it does                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Heading**     | Optional. Leave it empty to use the default wording (“Who Is This Trip For” / “Who Is This Trip Not For”), which shows greyed out in the empty field.               |
| **Description** | The card's content. It uses the same rich-text editor as the rest of the trip. Use a short intro sentence, then a bullet list: each bullet gets a check or a cross. |

- Each card only appears when its **Description** has content. Fill in one side and that card
  spans the full width. Leave both empty and the section is hidden.
- Both fields are per language, like the rest of the trip copy.
- To move the pair, use the **Who is this trip for / not for** row in **Page sections**. Remove
  the row to hide the section without deleting its content.

## On the live page

`TripAudienceSection` (`src/components/sections/trip-audience-section.tsx`, styles in
`trip-audience.css`) renders the pair as matched editorial cards in the same visual language as
the Highlights card:

- white sheet, a hairline border and a short accent rule on the top-left corner. The rule is
  deep blue on the "for" card and ember on the "not for" card, which also has a faint mist tint;
- an icon chip, a small uppercase eyebrow ("The right fit" / "Not the right fit", in
  `src/i18n/dictionaries.ts`) and the heading;
- bullet lists become hairline-separated rows, each led by a square check or cross chip.

The layout uses a **container query**, not a viewport breakpoint. The cards sit side by side when
the section's own column is at least ~44rem wide, and stack otherwise. On a laptop that column
narrows beside the sticky booking card, so this keeps both cards readable at every width. Side by
side, the cards share their row tracks through CSS `subgrid`. When one heading wraps to two lines,
both header dividers and both first lines of copy still line up.

The shared rules (default headings, "only show a side with real content") live in
`src/lib/trip-audience.ts` and are covered by `src/lib/trip-audience.test.ts`.

## Deployment

Run `npm run migrate` before (or as part of) deploying. In production Payload also applies it on
boot through `prodMigrations`. Migration `20261107_120000_trip_audience`:

- adds `trip_for_heading`, `trip_for_description`, `trip_not_for_heading` and
  `trip_not_for_description` to `trips_locales`, plus the `version_` counterparts on
  `_trips_v_locales`;
- adds `audience` to both page-section `kind` enums;
- inserts an **audience** row into every saved page layout, live and in version history, right
  after Highlights. If Highlights was removed, the row goes after Why Choose This Trek, then
  Overview, then at the end.

Nothing changes on any live page until an editor fills in a description. The migration is
re-runnable: columns use `IF NOT EXISTS`, and layouts that already contain the row are skipped.
