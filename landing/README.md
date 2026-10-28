# HiveConcerts pre-launch page

A one-page site for hiveconcerts.com. Visitors name who they want to see live (artist, band, orchestra or show) and a city, pick the kind of show and their role (fan, performer, organiser, sponsor, venue/service), and leave an email. Votes are stored in a Cloudflare D1 database, giving real demand data before the app launches.

Runs on Cloudflare Pages (free tier): static page + one serverless function + D1.

```
public/index.html          the page
public/privacy.html        privacy notice
public/og.png              social preview image
functions/api/signup.js    POST /api/signup — validates and stores a vote
schema.sql                 D1 table
wrangler.toml              Pages + D1 config
```

## Deploy (about 15 minutes)

1. **Move hiveconcerts.com DNS to Cloudflare** (free plan): add the site in the Cloudflare dashboard and change the nameservers at your registrar to the two Cloudflare gives you.
2. Install the CLI and sign in:
   ```bash
   npm i -g wrangler
   wrangler login
   ```
3. Create the database, then paste the `database_id` it prints into `wrangler.toml`:
   ```bash
   wrangler d1 create hiveconcerts-signups
   wrangler d1 execute hiveconcerts-signups --remote --file=schema.sql
   ```
4. Deploy:
   ```bash
   wrangler pages deploy
   ```
   The first run creates the Pages project and gives you a `*.pages.dev` URL. Test a vote there.
5. In Cloudflare: **Workers & Pages → hiveconcerts-landing → Custom domains → Set up a custom domain** → `hiveconcerts.com` (and `www.hiveconcerts.com`).

## See the demand

Top requested shows:
```bash
wrangler d1 execute hiveconcerts-signups --remote --command \
"SELECT artist, city, COUNT(*) AS votes FROM signups GROUP BY artist_key, city_key ORDER BY votes DESC LIMIT 50"
```

Sign-ups by role, by kind of show, and by visitor country:
```bash
wrangler d1 execute hiveconcerts-signups --remote --command "SELECT role, COUNT(*) FROM signups GROUP BY role"
wrangler d1 execute hiveconcerts-signups --remote --command "SELECT format, COUNT(*) FROM signups GROUP BY format"
wrangler d1 execute hiveconcerts-signups --remote --command "SELECT country, COUNT(*) AS n FROM signups GROUP BY country ORDER BY n DESC"
```

Export everything to CSV-ready JSON:
```bash
wrangler d1 execute hiveconcerts-signups --remote --json --command "SELECT * FROM signups" > signups.json
```

## When the main app launches

The Next.js app (Phase 1 kit) replaces this page. Import the `signups` rows as the first Suggestions and invite these emails to pledge. The emails were collected with the promise "We'll only email you about this show and the HiveConcerts launch", so keep to that.

## Before going live
- **Set up the privacy mailbox.** The privacy notice (`public/privacy.html`) tells people to email `privacy@hiveconcerts.com`. Create it for free with Cloudflare **Email Routing** (forward it to your own inbox) before you share the page.
- Read the privacy notice and adjust anything that doesn't match how you'll operate (retention period, response time). It's a plain-language starting point, not legal advice; get it checked once HiveConcerts has a registered company.
- The social preview image is `public/og.png` (1200×630). After deploying, paste the link into a WhatsApp chat to check the preview. If WhatsApp shows an old version, add `?v=2` to the link once to refresh it.
