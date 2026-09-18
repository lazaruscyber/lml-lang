import { marked } from "marked";

import metaSrc from "../content/meta.md?raw";
import navSrc from "../content/nav.md?raw";
import heroSrc from "../content/hero.md?raw";
import featuresSrc from "../content/features.md?raw";
import supportSrc from "../content/support.md?raw";
import heroCodeSrc from "../content/hero-code.md?raw";

const pageFiles = import.meta.glob("../content/pages/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

marked.setOptions({ gfm: true, breaks: false });

function parseFrontmatter(src) {
  const match = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: src.trim() };
  const data = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: match[2].trim() };
}

function md(src) {
  return marked.parse(src);
}

function splitSections(src) {
  const parts = src.trim().split(/\n(?=##\s)/);
  return parts.map((block) => block.trim()).filter(Boolean);
}

function firstHeadingAndRest(block) {
  const lines = block.split("\n");
  const heading = lines[0].replace(/^#+\s+/, "");
  const rest = lines.slice(1).join("\n").trim();
  return { heading, rest };
}

function parsePostItems(body) {
  const items = [];
  for (const line of body.split("\n")) {
    const m = line.match(
      /^-\s+(.+?)\s+—\s+\[([^\]]+)\]\(([^)]+)\)\s+—\s+(.+)$/,
    );
    if (m) {
      items.push({ date: m[1], title: m[2], href: m[3], description: m[4] });
    }
  }
  return items;
}

function loadPages() {
  const pages = {};
  for (const [path, raw] of Object.entries(pageFiles)) {
    const file = path.split("/").pop().replace(/\.md$/, "");
    const { data, body } = parseFrontmatter(raw);
    const headingMatch = body.match(/^#\s+(.+)$/m);
    const title = data.title || (headingMatch ? headingMatch[1].trim() : file);
    const layout = data.layout || "page";
    pages[file] = {
      slug: file,
      title,
      layout,
      html: md(body),
      items: layout === "posts" ? parsePostItems(body) : [],
    };
  }
  return pages;
}

export function loadSite() {
  const meta = parseFrontmatter(metaSrc).data;
  const navParsed = parseFrontmatter(navSrc);
  const navBody = navParsed.body;
  const brandMatch = navBody.match(/^#\s+(.+)$/m);
  const brand = brandMatch ? brandMatch[1].trim() : "";
  const navLinks = [...navBody.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({
    label: m[1],
    href: m[2],
  }));

  const heroBlocks = splitSections(heroSrc);
  const subtitle = heroBlocks[0] ? firstHeadingAndRest(heroBlocks[0]).heading : "";
  const ctas = [...heroSrc.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({
    label: m[1],
    href: m[2],
  }));

  const features = splitSections(featuresSrc).map((block) => {
    const { heading, rest } = firstHeadingAndRest(block);
    return { titleHtml: md(heading).replace(/^<p>|<\/p>\n?$/g, ""), bodyHtml: md(rest) };
  });

  const footerParsed = parseFrontmatter(supportSrc);
  const footerChunks = footerParsed.body.split(/\n(?=#{1,2}\s)/).map((c) => c.trim()).filter(Boolean);
  let footerBrand = "";
  let footerBlurb = "";
  const footerColumns = [];
  for (const chunk of footerChunks) {
    const { heading, rest } = firstHeadingAndRest(chunk);
    if (chunk.startsWith("# ")) {
      footerBrand = heading;
      footerBlurb = rest;
    } else if (chunk.startsWith("## ")) {
      footerColumns.push({
        title: heading,
        links: [...rest.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({
          label: m[1],
          href: m[2],
        })),
      });
    }
  }

  const codeMatch = heroCodeSrc.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].replace(/\n$/, "") : heroCodeSrc.trim();

  return {
    meta,
    brand,
    navLinks,
    subtitle,
    ctas,
    features,
    footer: {
      brand: footerBrand,
      blurbHtml: footerBlurb ? md(footerBlurb) : "",
      columns: footerColumns,
      copyright: footerParsed.data.copyright || "",
    },
    pages: loadPages(),
    code,
  };
}

export { md };
