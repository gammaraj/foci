#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "content", "posts");
const sitemapPath = path.join(repoRoot, "src", "app", "sitemap.ts");
const llmsPath = path.join(repoRoot, "public", "llms.txt");
const llmsFullPath = path.join(repoRoot, "public", "llms-full.txt");
const homePagePath = path.join(repoRoot, "src", "app", "page.tsx");
const blogPostPagePath = path.join(repoRoot, "src", "app", "blog", "[slug]", "page.tsx");

const errors = [];

function fail(message) {
  errors.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function validateSitemap(postSlugs) {
  const sitemap = read(sitemapPath);

  const requiredStaticUrls = [
    "url: siteUrl",
    "`${siteUrl}/app`",
    "`${siteUrl}/blog`",
    "`${siteUrl}/about`",
    "`${siteUrl}/privacy`",
    "`${siteUrl}/terms`",
    "`${siteUrl}/llms.txt`",
    "`${siteUrl}/llms-full.txt`",
  ];

  for (const pattern of requiredStaticUrls) {
    if (!sitemap.includes(pattern)) {
      fail(`Sitemap is missing required route pattern: ${pattern}`);
    }
  }

  if (!sitemap.includes("const allPosts = getAllPosts()")) {
    fail("Sitemap must source blog entries from getAllPosts() to ensure completeness.");
  }

  if (!sitemap.includes("`${siteUrl}/blog/${post.slug}`")) {
    fail("Sitemap must include generated /blog/${post.slug} URLs.");
  }

  if (postSlugs.length === 0) {
    fail("No blog posts found, sitemap completeness cannot be verified.");
  }
}

function validateSeoAndAeo(posts) {
  for (const post of posts) {
    const label = `${post.slug}.mdx`;

    if (!post.frontmatter.title || typeof post.frontmatter.title !== "string") {
      fail(`${label}: missing frontmatter title`);
    } else {
      const length = post.frontmatter.title.trim().length;
      if (length < 25 || length > 90) {
        fail(`${label}: title length should be between 25 and 90 chars for SEO (current: ${length})`);
      }
    }

    if (!post.frontmatter.description || typeof post.frontmatter.description !== "string") {
      fail(`${label}: missing frontmatter description`);
    } else {
      const length = post.frontmatter.description.trim().length;
      if (length < 90 || length > 220) {
        fail(`${label}: description length should be between 90 and 220 chars for SEO (current: ${length})`);
      }
    }

    if (!post.frontmatter.date || Number.isNaN(Date.parse(post.frontmatter.date))) {
      fail(`${label}: missing or invalid frontmatter date`);
    }

    if (!post.frontmatter.readingTime || !/^\d+\s+min\s+read$/i.test(String(post.frontmatter.readingTime).trim())) {
      fail(`${label}: readingTime should match '<number> min read' (current: ${post.frontmatter.readingTime ?? "missing"})`);
    }

    if (!Array.isArray(post.frontmatter.tags) || post.frontmatter.tags.length < 1) {
      fail(`${label}: include at least 1 tag for SEO topical relevance`);
    }

    const h2Count = (post.content.match(/^##\s+/gm) || []).length;
    if (h2Count < 1) {
      fail(`${label}: include at least 1 H2 section to improve answerability (AEO)`);
    }
  }

  const homePage = read(homePagePath);
  const homeFaqsPath = path.join(repoRoot, "src", "lib", "home-faqs.ts");
  const homeFaqs = fs.existsSync(homeFaqsPath) ? read(homeFaqsPath) : "";
  const hasFaqPage =
    homePage.includes('"@type": "FAQPage"') ||
    homeFaqs.includes('"@type": "FAQPage"') ||
    (homePage.includes("homeFaqsToJsonLd") && homeFaqs.includes("FAQPage"));
  if (!hasFaqPage) {
    fail("Home page is missing FAQPage JSON-LD needed for AEO rich answers.");
  }
  if (!homePage.includes('"@type": "HowTo"')) {
    fail("Home page is missing HowTo JSON-LD needed for AEO how-to answers.");
  }
  if (!homePage.includes("<HomeFaq") && !homePage.includes("HomeFaq")) {
    fail("Home page must render a visible FAQ section (HomeFaq) matching FAQ JSON-LD.");
  }

  const blogPostPage = read(blogPostPagePath);
  if (!blogPostPage.includes('"@type": "BlogPosting"')) {
    fail("Blog post page is missing BlogPosting JSON-LD.");
  }
  if (!blogPostPage.includes('"@type": "BreadcrumbList"')) {
    fail("Blog post page is missing BreadcrumbList JSON-LD.");
  }
}

function extractBlogUrls(text) {
  return new Set((text.match(/https:\/\/usefoci\.com\/blog\/[a-z0-9-]+/g) || []));
}

function validateLlmsSync(postSlugs) {
  const llmsRaw = read(llmsPath);
  const llmsFullRaw = read(llmsFullPath);

  const llms = matter(llmsRaw);
  const llmsFull = matter(llmsFullRaw);

  const llmsVersion = llms.data.version ? String(llms.data.version).slice(0, 10) : "";
  const llmsFullVersion = llmsFull.data.version ? String(llmsFull.data.version).slice(0, 10) : "";

  if (!llmsVersion || !llmsFullVersion) {
    fail("Both llms files must include frontmatter version.");
  } else if (llmsVersion !== llmsFullVersion) {
    fail(`llms version mismatch: llms.txt=${llmsVersion}, llms-full.txt=${llmsFullVersion}`);
  }

  const llmsUrls = extractBlogUrls(llmsRaw);
  const llmsFullUrls = extractBlogUrls(llmsFullRaw);

  for (const slug of postSlugs) {
    const url = `https://usefoci.com/blog/${slug}`;
    if (!llmsUrls.has(url)) {
      fail(`llms.txt missing blog URL: ${url}`);
    }
    if (!llmsFullUrls.has(url)) {
      fail(`llms-full.txt missing blog URL: ${url}`);
    }
  }

  for (const url of llmsUrls) {
    if (!llmsFullUrls.has(url)) {
      fail(`llms-full.txt missing URL present in llms.txt: ${url}`);
    }
  }
}

function getPosts() {
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));
  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = read(path.join(postsDir, file));
    const parsed = matter(raw);

    return {
      slug,
      frontmatter: parsed.data,
      content: parsed.content,
    };
  });
}

function main() {
  const posts = getPosts();
  const postSlugs = posts.map((post) => post.slug);

  validateSitemap(postSlugs);
  validateSeoAndAeo(posts);
  validateLlmsSync(postSlugs);

  if (errors.length > 0) {
    console.error("\nContent integrity checks failed:\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("All content integrity checks passed.");
}

main();
