"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBlogPost(data: {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  metaTitleNo?: string;
  metaDescNo?: string;
  category?: string;
  linkedMarketId?: string;
  published?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Check admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  const slug = data.slug || slugify(data.title);

  // Check slug uniqueness
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) return { error: "A post with this slug already exists" };

  try {
    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        metaTitleNo: data.metaTitleNo || null,
        metaDescNo: data.metaDescNo || null,
        category: data.category || "ANALYSIS",
        linkedMarketId: data.linkedMarketId || null,
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
      },
    });
    return { success: true, id: post.id, slug: post.slug };
  } catch {
    return { error: "Failed to create post" };
  }
}

export async function updateBlogPost(
  id: string,
  data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    metaTitleNo?: string;
    metaDescNo?: string;
    category?: string;
    linkedMarketId?: string;
    published?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return { error: "Post not found" };

    // If publishing for the first time, set publishedAt
    const isNewlyPublished = data.published && !existing.published;

    await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        metaTitleNo: data.metaTitleNo ?? undefined,
        metaDescNo: data.metaDescNo ?? undefined,
        linkedMarketId: data.linkedMarketId ?? undefined,
        publishedAt: isNewlyPublished ? new Date() : undefined,
      },
    });
    return { success: true };
  } catch {
    return { error: "Failed to update post" };
  }
}

export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    await prisma.blogPost.delete({ where: { id } });
    return { success: true };
  } catch {
    return { error: "Failed to delete post" };
  }
}
