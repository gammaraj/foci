# Search Console & Bing Webmaster

Ops checklist for SEO verification (not committed as secrets).

## Google Search Console

1. Verify `usefoci.com` (DNS TXT or HTML tag).
2. If using the HTML tag, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel to the token from Google (the `content=` value only). Root layout already emits `metadata.verification.google` when set.
3. Submit sitemap: `https://usefoci.com/sitemap.xml`
4. Confirm RSS discovery: `https://usefoci.com/feed.xml`
5. Monitor queries for comparison intent and align with evergreen pages:
   - `/vs/forest`, `/vs/todoist`, `/vs/focusatwill`
   - `/alternatives/forest`, `/alternatives/pomodoro-apps`, `/alternatives/focus-apps-for-students`

## Bing Webmaster Tools

1. Import from Google Search Console, or verify with the Bing meta tag.
2. Set `NEXT_PUBLIC_BING_SITE_VERIFICATION` in Vercel to the `msvalidate.01` content value.
3. Submit the same sitemap URL.
4. IndexNow is already configured — after deploys run `npm run notify:indexnow`.

## After publishing a blog post

1. Ensure the post appears in `content/posts/`, `public/llms.txt`, and `public/llms-full.txt` (CI: `npm run check:content-integrity`).
2. Deploy.
3. Run `npm run notify:indexnow`.
