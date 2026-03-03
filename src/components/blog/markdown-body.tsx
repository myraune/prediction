"use client";

/**
 * Simple markdown-to-HTML renderer for blog posts.
 * Handles: headings, bold, italic, links, lists, paragraphs, blockquotes, code.
 * No external dependency needed.
 */
export function markdownToHtml(md: string): string {
  let html = md
    // Code blocks (``` ... ```)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm my-4"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-8 mb-3">$1</h1>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-[var(--color-viking)] pl-4 my-4 text-muted-foreground italic">$1</blockquote>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--color-viking)] hover:underline">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-t my-6" />')
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Wrap consecutive <li> in <ul>/<ol>
  html = html.replace(/((?:<li class="ml-4 list-disc">.+<\/li>\n?)+)/g, '<ul class="my-3 space-y-1">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal">.+<\/li>\n?)+)/g, '<ol class="my-3 space-y-1">$1</ol>');

  // Paragraphs — wrap remaining text lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed;
      return `<p class="my-3 leading-relaxed">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div
      className="prose-sm text-sm text-foreground"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}
