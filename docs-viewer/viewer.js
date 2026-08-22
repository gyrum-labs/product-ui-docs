/*
 * docs-viewer
 *
 * Zero-build static documentation browser. Fetches _index.json for the tree
 * shape, renders a collapsible left sidebar, and loads the clicked file into
 * the right pane — markdown through marked + mermaid + highlight.js, known
 * source extensions through highlight.js, everything else as plain text.
 *
 * Design notes for future readers:
 *
 *   - No modules, no bundler. Target is modern evergreen browsers. Keeping the
 *     file vanilla means `bash serve.sh` and a browser are the entire toolchain
 *     — which is the whole point of a documentation viewer.
 *
 *   - Library availability is checked once at boot. If a library is missing,
 *     the viewer degrades rather than throws: markdown is escaped and shown as
 *     plain text, and the user gets a banner explaining how to vendor locally.
 *
 *   - Deep-linking is via location.hash so no router is needed.
 */

(function () {
  "use strict";

  var SOURCE_EXTS = {
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    json: "json",
    sh: "bash",
    bash: "bash",
    yml: "yaml",
    yaml: "yaml",
    css: "css",
    html: "xml",
    xml: "xml",
    py: "python",
    go: "go",
    rs: "rust",
    toml: "ini",
  };

  var state = {
    root: "..",
    degraded: { marked: false, mermaid: false, hljs: false },
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      node.appendChild(c);
    });
    return node;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showBanner(message) {
    var banner = document.getElementById("banner");
    banner.textContent = message;
    banner.hidden = false;
  }

  function detectDegradedMode() {
    if (typeof marked === "undefined") state.degraded.marked = true;
    if (typeof mermaid === "undefined") state.degraded.mermaid = true;
    if (typeof hljs === "undefined") state.degraded.hljs = true;

    var missing = Object.keys(state.degraded).filter(function (k) {
      return state.degraded[k];
    });
    if (missing.length > 0) {
      showBanner(
        "Offline mode: " +
          missing.join(", ") +
          " failed to load. Vendor local copies into lib/ — see docs-viewer/README.md for instructions.",
      );
    }
    if (!state.degraded.mermaid) {
      mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
    }
  }

  function buildTreeNode(node) {
    if (node.type === "file") {
      var link = el("a", { href: "#" + node.path, "data-path": node.path, text: node.name });
      link.addEventListener("click", function (event) {
        event.preventDefault();
        loadFile(node.path);
      });
      return el("li", { class: "file" }, [link]);
    }
    var toggle = el("span", { class: "dir-toggle open", text: node.name });
    var ul = el("ul", null, (node.children || []).map(buildTreeNode));
    toggle.addEventListener("click", function () {
      var open = toggle.classList.toggle("open");
      ul.style.display = open ? "" : "none";
    });
    return el("li", { class: "dir" }, [toggle, ul]);
  }

  function renderTree(tree) {
    var container = document.getElementById("tree");
    container.innerHTML = "";
    var ul = el("ul", null, tree.map(buildTreeNode));
    container.appendChild(ul);
  }

  function markActive(path) {
    document.querySelectorAll("#tree a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-path") === path);
    });
  }

  function extOf(path) {
    var idx = path.lastIndexOf(".");
    return idx >= 0 ? path.slice(idx + 1).toLowerCase() : "";
  }

  function renderMarkdown(text, content) {
    if (state.degraded.marked) {
      content.innerHTML = "<pre>" + escapeHtml(text) + "</pre>";
      return;
    }
    var inner = el("div", { class: "inner" });
    inner.innerHTML = marked.parse(text);
    content.innerHTML = "";
    content.appendChild(inner);
    applyMermaid(inner);
    applyHighlight(inner);
  }

  function applyMermaid(root) {
    if (state.degraded.mermaid) return;
    // marked renders fenced `mermaid` blocks as <pre><code class="language-mermaid">.
    // Mermaid wants bare <div class="mermaid"> elements with the source as text,
    // so swap the nodes before running mermaid.
    var blocks = root.querySelectorAll("pre code.language-mermaid");
    blocks.forEach(function (code) {
      var div = document.createElement("div");
      div.className = "mermaid";
      div.textContent = code.textContent;
      code.parentNode.parentNode.replaceChild(div, code.parentNode);
    });
    var diagrams = root.querySelectorAll(".mermaid");
    if (diagrams.length > 0) {
      mermaid.run({ nodes: diagrams }).catch(function (err) {
        console.error("mermaid render failed", err);
      });
    }
  }

  function applyHighlight(root) {
    if (state.degraded.hljs) return;
    root.querySelectorAll("pre code").forEach(function (code) {
      if (!code.className.includes("language-mermaid")) {
        hljs.highlightElement(code);
      }
    });
  }

  function renderSource(text, lang, content) {
    var pre = el("pre");
    var code = el("code", lang ? { class: "language-" + lang } : null);
    code.textContent = text;
    pre.appendChild(code);
    content.innerHTML = "";
    content.appendChild(pre);
    if (!state.degraded.hljs) hljs.highlightElement(code);
  }

  function renderError(message, content) {
    content.innerHTML = "";
    content.appendChild(el("div", { class: "error", text: message }));
  }

  function loadFile(path) {
    var content = document.getElementById("content");
    var url = state.root.replace(/\/$/, "") + "/" + path;
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " fetching " + url);
        return res.text();
      })
      .then(function (text) {
        var ext = extOf(path);
        if (ext === "md" || ext === "markdown") {
          renderMarkdown(text, content);
        } else if (SOURCE_EXTS[ext]) {
          renderSource(text, SOURCE_EXTS[ext], content);
        } else {
          renderSource(text, null, content);
        }
        document.getElementById("path").textContent = path;
        markActive(path);
        if (window.location.hash.slice(1) !== path) {
          window.location.hash = "#" + path;
        }
      })
      .catch(function (err) {
        renderError("Failed to load " + path + ": " + err.message, content);
      });
  }

  function renderMissingIndex(err) {
    var content = document.getElementById("content");
    content.innerHTML = "";
    var inner = el("div", { class: "inner" });
    inner.innerHTML =
      "<h2>Index not found</h2>" +
      "<p>The viewer could not load <code>_index.json</code>: " +
      escapeHtml(err.message) +
      ".</p>" +
      "<p>This file lists the documentation tree the viewer renders. In a project " +
      "bootstrapped by <code>gyrum-setup</code>, it is regenerated by " +
      "<code>scripts/update-docs.sh</code> (planned: PR 3 of the devtools repo). " +
      "Until that script ships, a baseline <code>_index.json</code> is committed " +
      "alongside the viewer template.</p>";
    content.appendChild(inner);
  }

  function boot() {
    detectDegradedMode();
    fetch("_index.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.root) state.root = data.root;
        renderTree(data.tree || []);
        var initial = window.location.hash.slice(1);
        if (initial) loadFile(initial);
      })
      .catch(renderMissingIndex);
  }

  window.addEventListener("hashchange", function () {
    var path = window.location.hash.slice(1);
    if (path) loadFile(path);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
