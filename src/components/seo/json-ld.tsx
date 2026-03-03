/** Reusable JSON-LD structured data components for SEO */

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Viking Market",
    url: "https://viking-market.com",
    logo: "https://viking-market.com/icon-3.svg",
    description:
      "Norway's prediction market. Trade on real-world events — from Norwegian politics to global markets.",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Viking Market",
    url: "https://viking-market.com",
    description:
      "Norway's prediction market. Buy and sell shares on real-world events.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://viking-market.com/markets?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function MarketJsonLd({
  title,
  description,
  url,
  category,
  dateCreated,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  category: string;
  dateCreated: string;
  dateModified: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished: dateCreated,
    dateModified,
    author: {
      "@type": "Organization",
      name: "Viking Market",
    },
    publisher: {
      "@type": "Organization",
      name: "Viking Market",
      logo: {
        "@type": "ImageObject",
        url: "https://viking-market.com/icon-3.svg",
      },
    },
    articleSection: category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
