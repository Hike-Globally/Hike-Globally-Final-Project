# Author expertise and publisher identity

Blog and trip detail pages now connect the visible person behind the content with their public
structured data. These fields make real expertise discoverable; they do not verify qualifications,
verify the organization, or guarantee a particular E-E-A-T audit score or search ranking.

## Complete the public profiles

In **Team → Users**, edit each author or itinerary expert:

- **Name** — enough to display the profile card, even without a biography.
- **Bio** — firsthand experience relevant to the content. Describe actual experience, not generic claims.
- **Avatar** — an actual portrait, where supplied.
- **Job title** — the person's real role.
- **Education** — the educational background the person has provided and you have checked, including
  the institution where relevant. Leave blank if unknown.
- **Credentials** — one qualification or licence per row, including the issuing body where possible.
  Do not enter aspirations, unverified affiliations, or qualifications they do not hold.
- **Website** and **Social profiles** — full `http://` or `https://` links to that person's public
  profiles, not the organization's profiles. Without a website, the first valid social profile is
  used as the structured-data profile URL. Without either, no profile URL is invented.

Only these public profile facts are rendered. Account emails, roles, password hashes, and sessions
are not included in the profile card or Person JSON-LD. Editing public profile details invalidates
the cached posts and trips so their visible cards and markup refresh together.

## Attribute each detail page

### Blog posts

Select the actual **Author** on the post and enable its author section in **Page sections**. The
profile card displays the available bio, role, education, credentials, and links. `BlogPosting.author`
contains those same facts as a `Person`, including an absolute portrait URL and `hasCredential`.
If the author section is removed, the masthead still displays the byline, but the structured data
only publishes that name rather than hidden expertise details.

### Trips

Select the person who wrote or maintains the itinerary in the **Itinerary expert** sidebar field.
This is optional for existing trips and is **not** automatically assigned during migration. The
profile appears after the trip's body sections (or after the full-width sections if there is no
body column). It does not promise that this person will lead every departure.

`TouristTrip` is not a CreativeWork, so the expert is described as the `author` of its `subjectOf`
`WebPage`, not as an unsupported `TouristTrip.author`. The page identifies Hike Globally as its publisher even without a guide.
The trip does not claim a provider, offer, or availability: Hike Globally is a travel affiliate platform.

## Complete the organization details

In **Settings**, confirm the site name, legal name, logo, public email, telephone, address, and
organization social profiles. The public root layout emits the full Organization on every page,
including `/blog/[slug]` and `/trips/[slug]`, using `/#organization` as the shared identifier.
Blog posts and trip pages reference that same entity and include its configured logo
and social profiles. With no uploaded logo, the bundled `/images/logo.svg` is used.

Organization verification still needs genuine external evidence where applicable. No verification
badge, affiliation, credential, rating, or contact detail is fabricated by this implementation.

## Deploy and verify

The registered `20261119_120000_author_expertise` migration adds the profile fields and both live
and versioned trip-guide relationships. The normal build applies pending migrations before Next
builds pages; it can also be applied with `npm run migrate` in the configured deployment environment.
It does not replace existing biographies, assign experts, or populate qualifications.

After deploying and completing the CMS details:

1. Open an attributed blog post and trip; confirm the correct person's visible profile and links.
2. Inspect each page's JSON-LD: one full Organization, matching publisher `@id`, and the
   corresponding Person with only the facts actually supplied.
3. Validate the deployed pages with a structured-data validator and re-run the original audit.
   Scores depend on real content and external reputation as well as technical markup.

Regression coverage lives in `src/lib/eeat.test.ts`, `src/lib/structured-data.test.ts`, and the
migration tests. Run `npm test` and `npm run typecheck` before deployment.
