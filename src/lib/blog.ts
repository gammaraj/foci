import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  tags: string[];
}

const postsDir = path.join(process.cwd(), "content/posts");

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".mdx"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      readingTime: data.readingTime,
      tags: data.tags ?? [],
    } as PostMeta;
  });
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string) {
  // Prevent path traversal: only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) return null;
  const filePath = path.join(postsDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    meta: {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      readingTime: data.readingTime,
      tags: data.tags ?? [],
    } as PostMeta,
    content,
  };
}

export function getRelatedPosts(currentSlug: string, limit = 3): PostMeta[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === currentSlug);
  if (!current) return all.filter((p) => p.slug !== currentSlug).slice(0, limit);
  const currentTags = new Set(current.tags);
  const others = all.filter((p) => p.slug !== currentSlug);
  const scored = others.map((p) => ({
    post: p,
    score: p.tags.filter((t) => currentTags.has(t)).length,
  }));
  scored.sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime());
  return scored.slice(0, limit).map((s) => s.post);
}
