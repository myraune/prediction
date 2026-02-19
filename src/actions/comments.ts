"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCommentsAction(marketId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { marketId, parentId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    return { comments };
  } catch {
    return { comments: [] };
  }
}

export async function createCommentAction(data: {
  marketId: string;
  content: string;
  parentId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const { marketId, content, parentId } = data;
  if (!content.trim()) return { error: "Comment cannot be empty" };
  if (content.length > 1000) return { error: "Comment too long (max 1000 chars)" };

  try {
    await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        marketId,
        parentId: parentId ?? null,
      },
    });

    revalidatePath(`/markets/${marketId}`);
    return { success: true };
  } catch {
    return { error: "Failed to post comment" };
  }
}

export async function deleteCommentAction(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, marketId: true },
    });

    if (!comment) return { error: "Comment not found" };
    if (comment.userId !== session.user.id) return { error: "Not authorized" };

    await prisma.comment.delete({ where: { id: commentId } });

    revalidatePath(`/markets/${comment.marketId}`);
    return { success: true };
  } catch {
    return { error: "Failed to delete comment" };
  }
}
