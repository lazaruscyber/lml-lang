import "./style.css";
import { loadSite, md } from "./content.js";

const KEYWORDS = /^(open|let|mutable|print)$/;

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
  const links = site.navLinks.map((l) => `<a href="${l.href}">${l.label}</a>`).join("");
  return `
    <nav>
      <a href="/" style="display: flex; align-items: center;">
        <img src="/logo.png?v=3" alt="Logo" height="64" style="margin: 0" />
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
            ${col.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
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
            <a href="/" class="site-footer-logo">
              <img src="/logo.png?v=3" alt="${f.brand || "Logo"}" height="40" />
            </a>
            ${f.blurbHtml}
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
          <h2>${f.titleHtml}</h2>
          ${f.bodyHtml}
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
        ${site.ctas.map((c) => `<a href="${c.href}">${c.label}</a>`).join("")}
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

function newsHtml(site) {
  const items = site.newsItems
    .map(
      (item) => `
        <li class="post">
          <div class="post-header">
            <div class="meta">
              <time>${item.date}</time>
            </div>
            <div class="matter">
              <h4 class="title small">
                <a href="${item.href}">${item.title}</a>
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
      <h1>${site.newsTitle}</h1>
      <hr/>
      <ul class="posts flat">
        ${items}
      </ul>
    </article>
    </div>
    ${footerHtml(site)}
  `;
}

function applyMeta(site) {
  const isNews = location.pathname.endsWith("/news") || location.pathname.endsWith("/news.html");
  document.title = isNews ? `News | ${site.meta.title || site.brand}` : site.meta.title || site.brand;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && site.meta.description) desc.setAttribute("content", site.meta.description);
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme && site.meta.themeColor) theme.setAttribute("content", site.meta.themeColor);
}

function render() {
  const site = loadSite();
  applyMeta(site);
  const root = document.getElementById("app");
  const isNews = location.pathname.endsWith("/news") || location.pathname.endsWith("/news.html");
  root.innerHTML = isNews ? newsHtml(site) : homeHtml(site);
}

render();

if (import.meta.hot) {
  import.meta.hot.accept("./content.js", () => {
    render();
  });
}
