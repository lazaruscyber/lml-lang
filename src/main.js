import "./style.css";
import { loadSite, md } from "./content.js";

function withBase(href) {
  if (!href || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("#") || href.startsWith("//")) {
    return href;
  }
  if (!href.startsWith("/")) return href;
  const base = import.meta.env.BASE_URL;
  if (href === "/") return base;
  return `${base.replace(/\/$/, "")}${href}`;
}

function rebaseHrefs(html) {
  return html.replace(/href="(\/[^"]*)"/g, (_full, href) => `href="${withBase(href)}"`);
}

const asset = (path) => `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

const KEYWORDS = /^(open|let|mutable|print|type|of|rec|match|with|fun|if|then|else)$/;

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightCode(src) {
  const lines = src.split("\n");
  return lines
    .map((line) => {
      const commentIdx = line.indexOf("//");
      let code = line;
      let comment = "";
      if (commentIdx !== -1) {
        code = line.slice(0, commentIdx);
        comment = line.slice(commentIdx);
      }

      let out = "";
      const re =
        /("(?:\\.|[^"\\])*")|(\b\d+\b)|(#\[[^\]]*\])|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[a-z_][A-Za-z0-9_]*\b)(\s*\()?|([^A-Za-z0-9_"#]+)|(#)/g;
      let m;
      while ((m = re.exec(code))) {
        if (m[1]) {
          out += `<span class="tok-string">${escapeHtml(m[1])}</span>`;
        } else if (m[2]) {
          out += `<span class="tok-number">${escapeHtml(m[2])}</span>`;
        } else if (m[3]) {
          out += `<span class="tok-attr">${escapeHtml(m[3])}</span>`;
        } else if (m[4]) {
          out += `<span class="tok-type">${escapeHtml(m[4])}</span>`;
        } else if (m[5]) {
          const word = m[5];
          const paren = m[6] || "";
          if (KEYWORDS.test(word)) {
            out += `<span class="tok-keyword">${escapeHtml(word)}</span>${escapeHtml(paren)}`;
          } else if (paren) {
            out += `<span class="tok-fn">${escapeHtml(word)}</span>${escapeHtml(paren)}`;
          } else {
            out += escapeHtml(word);
          }
        } else {
          out += escapeHtml(m[0]);
        }
      }
      if (comment) {
        out += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
      }
      return out || " ";
    })
    .join("\n");
}

function navHtml(site) {
  const links = site.navLinks.map((l) => `<a href="${withBase(l.href)}">${l.label}</a>`).join("");
  return `
    <nav>
      <a href="${withBase("/")}" style="display: flex; align-items: center;">
        <img src="${asset("/logo.png?v=3")}" alt="Logo" height="64" style="margin: 0" />
      </a>
      <div style="flex: 1"></div>
      <menu style="display: flex; flex-wrap: wrap;">
        ${links}
      </menu>
    </nav>
  `;
}

function heroCodeHtml(code) {
  return `
    <div class="hero-code" id="demo">
      <pre><code>${highlightCode(code)}</code></pre>
    </div>
  `;
}

function footerHtml(site) {
  const f = site.footer;
  const columns = f.columns
    .map(
      (col) => `
        <div class="site-footer-col">
          <h3>${col.title}</h3>
          <ul>
            ${col.links.map((l) => `<li><a href="${withBase(l.href)}">${l.label}</a></li>`).join("")}
          </ul>
        </div>
      `,
    )
    .join("");

  return `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="site-footer-top">
          <div class="site-footer-brand">
            <a href="${withBase("/")}" class="site-footer-logo">
              <img src="${asset("/logo.png?v=3")}" alt="${f.brand || "Logo"}" height="40" />
            </a>
            ${rebaseHrefs(f.blurbHtml)}
          </div>
          <div class="site-footer-cols">
            ${columns}
          </div>
        </div>
        <div class="site-footer-bottom">
          <p>${f.copyright}</p>
        </div>
      </div>
    </footer>
  `;
}

function homeHtml(site) {
  const features = site.features
    .map(
      (f) => `
        <div class="selling-point">
          <h2>${rebaseHrefs(f.titleHtml)}</h2>
          ${rebaseHrefs(f.bodyHtml)}
        </div>
      `,
    )
    .join("");

  return `
    <div class="page">
    ${navHtml(site)}
    <article>
      <h2 class="subtitle">${md(site.subtitle).replace(/^<p>|<\/p>\n?$/g, "")}</h2>
      ${heroCodeHtml(site.code)}
      <div class="action">
        ${site.ctas.map((c) => `<a href="${withBase(c.href)}">${c.label}</a>`).join("")}
      </div>
      <hr/>
      <section class="content">
        <div class="selling-points">
          ${features}
        </div>
      </section>
    </article>
    </div>
    ${footerHtml(site)}
  `;
}

function postsHtml(site, page) {
  const items = page.items
    .map(
      (item) => `
        <li class="post">
          <div class="post-header">
            <div class="meta">
              <time>${item.date}</time>
            </div>
            <div class="matter">
              <h4 class="title small">
                <a href="${withBase(item.href)}">${item.title}</a>
              </h4>
              <span class="description">${item.description}</span>
            </div>
          </div>
        </li>
      `,
    )
    .join("");

  return `
    <div class="page">
    ${navHtml(site)}
    <article>
      <h1>${page.title}</h1>
      <hr/>
      <ul class="posts flat">
        ${items}
      </ul>
    </article>
    </div>
    ${footerHtml(site)}
  `;
}

function articleHtml(site, page) {
  return `
    <div class="page">
    ${navHtml(site)}
    <article class="page-body">
      ${rebaseHrefs(page.html)}
    </article>
    </div>
    ${footerHtml(site)}
  `;
}

function missingHtml(site, slug) {
  return `
    <div class="page">
    ${navHtml(site)}
    <article class="page-body">
      <h1>Page not found</h1>
      <p>Create <code>content/pages/${slug}.md</code> and add a navbar link in <code>content/nav.md</code>.</p>
    </article>
    </div>
    ${footerHtml(site)}
  `;
}

function currentSlug() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let path = location.pathname.replace(/\.html$/, "").replace(/\/+$/, "");
  if (base && path.startsWith(base)) path = path.slice(base.length);
  path = path.replace(/^\//, "");
  return path;
}

function applyMeta(site, page) {
  const base = site.meta.title || site.brand || "LightML";
  document.title = page ? `${page.title} | ${base}` : base;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && site.meta.description) desc.setAttribute("content", site.meta.description);
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme && site.meta.themeColor) theme.setAttribute("content", site.meta.themeColor);
}

function render() {
  const site = loadSite();
  const root = document.getElementById("app");
  const slug = currentSlug();
  if (!slug) {
    applyMeta(site, null);
    root.innerHTML = homeHtml(site);
    return;
  }
  const page = site.pages[slug];
  if (!page) {
    applyMeta(site, { title: "Not found" });
    root.innerHTML = missingHtml(site, slug);
    return;
  }
  applyMeta(site, page);
  root.innerHTML = page.layout === "posts" ? postsHtml(site, page) : articleHtml(site, page);
}

function isInternalPath(url) {
  return url.origin === location.origin && !url.pathname.split("/").pop().includes(".");
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target && link.target !== "_self") return;
  let url;
  try {
    url = new URL(link.href, location.origin);
  } catch {
    return;
  }
  if (!isInternalPath(url)) return;
  if (url.pathname === location.pathname && url.hash) return;
  event.preventDefault();
  history.pushState({}, "", url.pathname + url.search + url.hash);
  render();
  if (url.hash) {
    document.getElementById(url.hash.slice(1))?.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
});

window.addEventListener("popstate", render);

render();

if (import.meta.hot) {
  import.meta.hot.accept("./content.js", () => {
    render();
  });
}
