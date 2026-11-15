# Copy Neon media to Vercel Blob

This is a manual production operation. The script is **not** run by the build or deployment. It
copies `media_files` into a **public** Vercel Blob store, never deletes or updates database rows, and
never overwrites an existing Blob object. It downloads each destination via the same public URL
format the Payload adapter uses and checks the SHA-256 hash, length, and MIME type. Existing objects
are checked too; a mismatch stops the run rather than replacing either copy. It can be re-run after
an interruption. A successful copy is not itself a production cutover.

## Before starting

1. Make a restorable Neon backup/snapshot and confirm how to restore it. Keep the Postgres media
   files after cutover. Check Neon and Blob allowances: the copy reads all file bytes from Neon and
   downloads the copies from Blob for verification.
2. Ensure you have the correct **production Neon database and branch**, and the correct **public**
   Blob store. The existing app is configured to serve public media; this must not be used for
   confidential files. Check the Blob store's access setting in Vercel. A private store won't work.
3. Schedule a maintenance window. Stop all CMS media uploads, edits, replacements and deletions,
   including from other deployments or scripts. Keep them paused through the copy, cutover and
   checks. A database snapshot alone cannot prevent uploads made after copying from being missed.
4. On a trusted computer, obtain this project version with the script, install Node 24 and run
   `npm ci`. Do not commit or upload secrets. Use a local `.env.local` file (already gitignored),
   with these values, obtained securely from your Neon and Vercel dashboards:

   ```dotenv
   DATABASE_URI=your-production-neon-connection-string
   BLOB_READ_WRITE_TOKEN=your-public-blob-store-read-write-token
   ```

   Replace the examples with real values, without quotes unless required by dotenv syntax. The
   Blob connection may have given the token a different environment variable name in Vercel;
   use its **value** under the exact local name above. Never paste either secret into chat or
   commit the file. Use your actual Neon connection string with its required TLS settings.

## Inventory, copy, verify

Run these commands from the repository root on your trusted computer:

```sh
node --env-file=.env.local scripts/migrate-media-to-blob.mjs
```

This first command is read-only: it prints the database name, database role, Blob store ID, count,
size, and how many paths already exist in the store. Check these against the intended production
resources and the 293-file / 66 MB inventory. The store ID can be checked against the identifier
in the Blob token (`vercel_blob_rw_<store-id>_...`) without sharing the token. A mismatch in counts
or destination is a reason to stop. The dry run doesn't compare contents of existing objects.

With media edits still paused, run:

```sh
node --env-file=.env.local scripts/migrate-media-to-blob.mjs --copy
```

Wait for `Complete` and a verified count matching the inventory. If it stops or reports a collision
mismatch, don't cut over. Investigate; it will not overwrite the existing Blob. A retry checks
objects already copied. The program checks the public URL constructed by the current Payload Blob
adapter, not just the upload response. The script doesn't verify that every Payload media record
references a file, nor does it change any records; test representative CMS media separately.

## Cutover and rollback

1. Only after all files verify, configure the **production** Vercel environment variable
   `BLOB_READ_WRITE_TOKEN` with the token value for this same store. If `MEDIA_STORAGE` is set to
   `database`, change/remove that override as appropriate. Do not share token values. Redeploy so
   runtime functions receive the settings. Leave other environments unchanged unless deliberately
   migrating them too.
2. Confirm production logs say `[media] storage mode: blob`. Check the Payload admin and published
   pages, including large images, video, media variants, and any direct `/api/media/file/...` links.
   Confirm new URLs resolve to the expected store. Test a new upload and deletion. Note that testing
   deletion removes that test object from Blob; do not delete real media. Purge stale caches if
   needed. Verify behavior on the actual deployment, not just the copied file URLs.
3. If tests fail, keep edits paused and restore the previous production environment settings
   (including `MEDIA_STORAGE=database` if necessary), redeploy, and test the old site. Retained
   Postgres files provide the rollback source. If any media were written or modified in Blob after
   cutover, reconcile those changes before reverting, otherwise they will be missing or stale in
   Postgres. Do not delete database files without a separate verified cleanup plan.
4. Once satisfied, resume media edits and monitor Neon network transfer over the following days.
   Transferring files may not be the only cause of Neon traffic.
