import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { OG_CONTENT_TYPE, OG_SIZE, renderBlogOgImage } from "@/lib/og-blog-image";

export const alt = "Foci blog article";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return renderBlogOgImage({
      title: "Foci Blog",
      description: "Focus, productivity, and time management guides.",
    });
  }

  const { meta } = post;
  const formattedDate = new Date(meta.date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return renderBlogOgImage({
    title: meta.title,
    description: meta.description,
    tag: meta.tags[0],
    date: formattedDate,
  });
}
