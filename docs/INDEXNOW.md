# IndexNow Setup

IndexNow is configured to instantly notify search engines (Bing, Yandex, Naver, Seznam.cz) when your content changes.

## Configuration

- **API Key**: `893d4c6a-a4f4-4215-829e-df8b4dd1a1f6`
- **Key File**: `/public/893d4c6a-a4f4-4215-829e-df8b4dd1a1f6.txt`
- **API Endpoint**: `/api/indexnow`

## Usage

### Programmatic Submission

```typescript
import { notifyBlogPost, notifyBlogPosts, notifyCorePages, submitUrlToIndexNow } from "@/lib/indexnow";

// Notify about a single blog post
await notifyBlogPost("pomodoro-technique-guide");

// Notify about multiple blog posts
await notifyBlogPosts(["pomodoro-technique-guide", "flowtime-technique-guide"]);

// Notify about core pages
await notifyCorePages();

// Submit any URL
await submitUrlToIndexNow("https://usefoci.com/app");
```

### Manual Submission via API

Requires `INDEXNOW_API_SECRET` (set in Vercel env). Use Bearer auth or `x-indexnow-secret` header.

```bash
# Submit a single URL
curl -X POST https://usefoci.com/api/indexnow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INDEXNOW_API_SECRET" \
  -d '{"url": "https://usefoci.com/blog/pomodoro-technique-guide"}'

# Submit multiple URLs
curl -X POST https://usefoci.com/api/indexnow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INDEXNOW_API_SECRET" \
  -d '{"urls": ["https://usefoci.com/", "https://usefoci.com/blog"]}'
```

## When to Notify

Trigger IndexNow submissions when:
- ✅ Publishing new blog posts
- ✅ Updating existing blog content
- ✅ Adding new pages
- ✅ Updating core pages (homepage, app page)
- ✅ After deployment of significant changes

### After deploy (recommended)

```bash
# Direct IndexNow API (uses public key file) — or set INDEXNOW_API_SECRET to hit /api/indexnow
npm run notify:indexnow
```

This submits homepage, `/app`, `/blog`, `/about`, `/feed.xml`, evergreen `/vs/*` + `/alternatives/*`, `llms*.txt`, and every blog post URL.

### In a Content Management System

```typescript
// When publishing a new post
async function publishPost(slug: string) {
  // ... save post logic ...
  
  // Notify search engines
  await notifyBlogPost(slug);
}
```

## Verification

Check if IndexNow is working:
1. Visit https://www.bing.com/indexnow to verify your key
2. Check Bing Webmaster Tools for submission status
3. Monitor API responses for successful submissions (200 status)

## Limitations

- Maximum 10,000 URLs per request
- URLs must belong to usefoci.com domain
- Rate limits apply (exact limits vary by search engine)

## Documentation

- [IndexNow Documentation](https://www.indexnow.org/documentation)
- [Bing IndexNow Guide](https://www.bing.com/indexnow)
