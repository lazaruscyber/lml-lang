import { marked } from "marked";

import metaSrc from "../content/meta.md?raw";
import navSrc from "../content/nav.md?raw";
import heroSrc from "../content/hero.md?raw";
import featuresSrc from "../content/features.md?raw";
import supportSrc from "../content/support.md?raw";
import newsSrc from "../content/news.md?raw";
import heroCodeSrc from "../content/hero-code.md?raw";

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

  const newsParsed = parseFrontmatter(newsSrc);
  const newsTitleMatch = newsParsed.body.match(/^#\s+(.+)$/m);
  const newsTitle = newsTitleMatch ? newsTitleMatch[1].trim() : "News";
  const newsItems = [];
  for (const line of newsParsed.body.split("\n")) {
    const m = line.match(
      /^-\s+(.+?)\s+—\s+\[([^\]]+)\]\(([^)]+)\)\s+—\s+(.+)$/,
    );
    if (m) {
      newsItems.push({ date: m[1], title: m[2], href: m[3], description: m[4] });
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
    newsTitle,
    newsItems,
    code,
  };
}

export { md };
