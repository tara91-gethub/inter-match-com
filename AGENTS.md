# Agent Handoff Notes

This file is for future AI/code agents working on this project. Keep it updated whenever the website structure, deployment, forms, images, or workflow changes.

## Critical Safety Rule

Work only in this project:

`C:\Users\taran\Desktop\Inter-match - com\astrowind-main`

Never read, edit, build, commit, or push anything inside:

`C:\Users\taran\Desktop\match\astrowind-main`

That is the separate live New Zealand website.

## Project Summary

This is the international/Southeast Asia site for The Matchmaking Bureau.

- Production domain: `https://www.matchmakingbureau.com`
- Vercel URL: `https://inter-match-com.vercel.app`
- GitHub repo: `https://github.com/tara91-gethub/inter-match-com`
- Framework: Astro / AstroWind
- Package manager: npm
- Main branch: `main`

## Common Commands

Run these from `C:\Users\taran\Desktop\Inter-match - com\astrowind-main`.

```bash
npm install
npm run build
npm run dev
git status --short
git log --oneline -5
git push origin main
```

Before pushing, run:

```bash
npm run build
```

## Main Site Structure

- `src/pages/index.astro` - homepage
- `src/pages/about.astro` - About / philosophy / Meet Del
- `src/pages/contact.astro` - application form
- `src/pages/thank-you.astro` - successful form submission page
- `src/pages/membership.astro` - membership page
- `src/pages/process.astro` - process page
- `src/pages/matchmaking-process.astro` - detailed candidate-facing process explanation
- `src/pages/faq.astro` - FAQ page
- `src/pages/[country]/` - country and city pages
- `src/content/post/` - blog posts
- `src/assets/images/` - all local images
- `api/contact.js` - Vercel serverless contact form handler

## Contact Form

The site does not use FormSubmit. It sends email through Hostinger SMTP using the Vercel serverless function at `api/contact.js`.

Expected Vercel environment variables:

- `SMTP_HOST=smtp.hostinger.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=admin@matchmakingbureau.com`
- `SMTP_PASS=<secret>`
- `CONTACT_TO=admin@matchmakingbureau.com`

The contact form should:

- POST to `/api/contact`
- Send email to `admin@matchmakingbureau.com`
- Redirect successful submissions to `/thank-you`
- Show a loading/submitting state after the button is clicked
- Keep only full name and email strictly required
- Allow all location options without blocking submission

Location options currently include:

- Manila
- Cebu
- Bangkok
- Jakarta
- Kuala Lumpur
- Singapore
- Ho Chi Minh City
- Other

Country/city SEO pages currently include:

- Philippines: `/philippines`, `/philippines/manila`, `/philippines/cebu`
- Thailand: `/thailand`, `/thailand/bangkok`, `/thailand/chiang-mai`
- Indonesia: `/indonesia`, `/indonesia/jakarta`, `/indonesia/bali`
- Malaysia: `/malaysia`, `/malaysia/kuala-lumpur`, `/malaysia/penang`
- Singapore: `/singapore`
- Vietnam: `/vietnam`, `/vietnam/ho-chi-minh-city`, `/vietnam/hanoi`, `/vietnam/da-nang`

## About Page / Del

The About page includes Del as the matchmaker.

Current local images:

- `src/assets/images/matchmaker-del-full.jpg` - professional suited portrait
- `src/assets/images/matchmaker-del.jpg` - relaxed outdoor portrait

Current layout:

- Top About intro uses Del's professional portrait on the right.
- Main Meet Del section uses the professional portrait.
- Discretion Promise section uses the relaxed outdoor portrait.

## Images

All page images should be local files under `src/assets/images/` and imported with Astro's image handling.

Avoid:

- External Google CDN image URLs
- `/src/assets/...` string paths in rendered HTML
- Unsplash+ watermarked images

Use:

```astro
import imageName from '~/assets/images/example.jpg'; import {Image} from 'astro:assets';

<Image src={imageName} alt="Useful alt text" />
```

Known image notes:

- Several watermarked Unsplash+ country/city images were replaced with clean local images.
- `src/assets/images/IMAGE_CREDITS.md` tracks replacement image sources.
- Default social sharing image: `src/assets/images/og-default-international.jpg`

## SEO / Social Preview

Use `https://www.matchmakingbureau.com` as the canonical production domain everywhere: config, sitemap, robots.txt, schema, and social metadata.

The default social sharing preview is configured to use:

`src/assets/images/og-default-international.jpg`

Current homepage sharing metadata:

- Title: `Private Matchmaking in Southeast Asia`
- Description: `Private matchmaking across Southeast Asia for discerning professionals in the Philippines, Thailand, Indonesia, Malaysia, Singapore and Vietnam.`
- Image size: 1200 x 630

## Vercel Analytics

Vercel Analytics is installed with npm:

```bash
npm i @vercel/analytics
```

It is added globally in:

`src/layouts/Layout.astro`

using:

```astro
import VercelAnalytics from '@vercel/analytics/astro';
<VercelAnalytics />
```

## IndexNow / Bing

IndexNow should use a Vercel environment variable instead of committing the key value to Git.

Accepted environment variable names:

- `INDEXNOW_KEY`
- `INDEX_NOW_KEY`
- `BING_INDEXNOW_KEY`

The public key file URL is:

`https://www.matchmakingbureau.com/indexnow.txt`

Implementation:

- `api/indexnow-key.js` returns the IndexNow key as `text/plain`.
- `vercel.json` rewrites `/indexnow.txt` to `/api/indexnow-key`.

If Bing cannot verify IndexNow, confirm the Vercel env var is set in Production and the latest deployment is live, then open `/indexnow.txt` in the browser. It should show only the key.

## Design Direction

The site should feel:

- Premium
- Private
- Discreet
- Human
- Clean and professional

Prefer restrained luxury styling: dark navy, gold accents, serif headings, generous spacing, real images, and clear CTAs.

Do not over-personalize the country/city SEO pages with Del content. Keep Del mainly on the About page, with small homepage teasers only if requested.

## Recent Change History

- Added Del profile section to About page.
- Added second Del portrait and repositioned images.
- Replaced top About placeholder image with Del's professional portrait and stronger copy.
- Moved relaxed Del portrait into the Discretion Promise section.
- Added Vercel Analytics.
- Fixed contact form so it sends through Hostinger SMTP.
- Added `/thank-you` page and successful form redirects.
- Added visible submitting state to the contact form button.
- Replaced watermarked city/country images.
- Added IndexNow key-file route using a Vercel environment variable.
- Added blog post `international-matchmaking-relocation`.
- Added detailed `/matchmaking-process` page and linked it from `/process`, FAQ, and footer.
- Standardized canonical/sitemap/schema URLs to `https://www.matchmakingbureau.com`.
- Removed thin `/category/...` archive pages from the build and sitemap; keep real country/city pages indexed instead.
- Improved schema markup: richer Article schema, Organization contact email/contactPoint, and shared Organization `@id` references in Service schemas.
- Added new city SEO pages for Bali, Hanoi, Da Nang, Chiang Mai, and Penang using the existing `RegionPage` pattern.

## Working Style With The Site Owner

The owner prefers practical, direct updates and wants changes pushed when complete. Keep reports short, clear, and specific.

When changing files:

1. Confirm you are in the international project folder.
2. Make the smallest clean change.
3. Run `npm run build`.
4. Commit with a clear message.
5. Push to `origin main`.
6. Report the live URL and commit hash.
