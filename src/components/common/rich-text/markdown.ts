import { marked } from "marked";
import TurndownService from "turndown";

/**
 * Bridges the gap between the (HTML-based) TipTap editor and YouTrack, which
 * stores issue descriptions as Markdown and references attachments by file name,
 * e.g. `![](WhatsApp Image 2026-06-05 at 4.13.28 PM_1.jpeg){width=70%}`.
 *
 * - On read/edit we convert that Markdown to HTML the editor understands,
 *   tagging inline attachment references with `data-attachment-ref` so they can
 *   be resolved to auth-protected blob URLs.
 * - On save we convert the editor HTML back to YouTrack-flavoured Markdown.
 *
 * YouTrack's image syntax is non-standard (the file name may contain spaces and
 * carry a trailing `{width=…}`), so attachment images/files are handled with
 * dedicated rules rather than relying on a strict CommonMark parser.
 */

const ABSOLUTE_TARGET = /^(https?:|data:|blob:|mailto:|tel:|\/|#)/i;
const FILE_LIKE = /\.[a-z0-9]{1,8}$/i;

marked.setOptions({ gfm: true, breaks: true });

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Parses YouTrack's `{width=70%}` / `{width=300}` attribute block into a CSS
// width value (px is assumed for bare numbers).
function parseWidth(attrs: string | undefined): string {
  if (!attrs) return "";
  const m = /width\s*=\s*([0-9]+(?:%|px)?)/i.exec(attrs);
  if (!m) return "";
  return /^\d+$/.test(m[1]) ? `${m[1]}px` : m[1];
}

function extLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "";
  return ext && ext !== fileName.toUpperCase() ? ext.slice(0, 4) : "FILE";
}

function isAttachmentTarget(target: string): boolean {
  return !ABSOLUTE_TARGET.test(target);
}

function imageHtml(alt: string, target: string, attrs: string | undefined): string {
  const width = parseWidth(attrs);
  const style = width ? ` style="width:${width}"` : "";
  if (isAttachmentTarget(target)) {
    // Real bytes resolved later; leave src empty so no broken-image request.
    return `<img src="" data-attachment-ref="${escapeAttr(target)}" alt="${escapeAttr(alt)}"${style}>`;
  }
  return `<img src="${escapeAttr(target)}" alt="${escapeAttr(alt)}"${style}>`;
}

function fileCardHtml(text: string, target: string): string {
  const name = text || target;
  return (
    `<a class="rte-file" href="#" download="${escapeAttr(target)}" ` +
    `data-attachment-ref="${escapeAttr(target)}" data-file-name="${escapeAttr(target)}" data-file-size="0">` +
    `<span class="rte-file-icon">${escapeHtmlText(extLabel(target))}</span>` +
    `<span class="rte-file-info">` +
    `<span class="rte-file-name">${escapeHtmlText(name)}</span>` +
    `<span class="rte-file-meta">File</span>` +
    `</span>` +
    `<span class="rte-file-download">Download</span>` +
    `</a>`
  );
}

// Finds the index of `ch` starting at `from`, bailing at a line break (URLs and
// labels never span lines).
function indexOfOnLine(s: string, ch: string, from: number): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === "\n") return -1;
    if (s[i] === ch) return i;
  }
  return -1;
}

// Given the index of an opening `(`, returns the index of the matching `)`,
// honouring nested parentheses so attachment names like
// `invoice (1).pdf` / `WhatsApp Image … PM (1).jpeg` aren't truncated at the
// first inner `)`. Returns -1 if unbalanced or the URL spills onto a new line.
function matchingParen(s: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i];
    if (c === "\n") return -1;
    if (c === "(") depth++;
    else if (c === ")" && --depth === 0) return i;
  }
  return -1;
}

/**
 * Walks the Markdown and rewrites inline images (`![alt](target){attrs}`) and
 * attachment file links (`[text](target)`) into editor/preview HTML.
 *
 * Unlike a single regex, this scans with balanced-parenthesis matching so
 * targets that themselves contain spaces and parentheses (common for YouTrack
 * attachment names) are captured in full. Non-attachment links are left
 * untouched so `marked` can render them normally.
 */
function transformAttachments(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const isImage = ch === "!" && text[i + 1] === "[";
    const isLink = ch === "[";

    if (isImage || isLink) {
      const labelOpen = isImage ? i + 1 : i;
      const labelClose = indexOfOnLine(text, "]", labelOpen + 1);
      if (labelClose !== -1 && text[labelClose + 1] === "(") {
        const parenOpen = labelClose + 1;
        const parenClose = matchingParen(text, parenOpen);
        if (parenClose !== -1) {
          const label = text.slice(labelOpen + 1, labelClose);
          const target = text.slice(parenOpen + 1, parenClose).trim();

          if (isImage) {
            let end = parenClose + 1;
            let attrs: string | undefined;
            if (text[end] === "{") {
              const braceClose = indexOfOnLine(text, "}", end + 1);
              if (braceClose !== -1) {
                attrs = text.slice(end + 1, braceClose);
                end = braceClose + 1;
              }
            }
            out += imageHtml(label, target, attrs);
            i = end;
            continue;
          }

          if (isAttachmentTarget(target) && FILE_LIKE.test(target)) {
            out += fileCardHtml(label, target);
            i = parenClose + 1;
            continue;
          }

          // Regular link: leave the original markdown for `marked` to handle.
          out += text.slice(i, parenClose + 1);
          i = parenClose + 1;
          continue;
        }
      }
    }

    out += ch;
    i++;
  }
  return out;
}

// Replaces fenced/inline code with placeholders so attachment syntax inside code
// isn't transformed, then restores them afterwards.
function protectCode(md: string): { text: string; restore: (s: string) => string } {
  const store: string[] = [];
  const stash = (m: string) => {
    store.push(m);
    return `\u0000CODE${store.length - 1}\u0000`;
  };
  const text = md.replace(/```[\s\S]*?```/g, stash).replace(/`[^`\n]*`/g, stash);
  const restore = (s: string) =>
    // eslint-disable-next-line no-control-regex
    s.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => store[Number(i)] ?? "");
  return { text, restore };
}

/** Converts YouTrack Markdown into editor/preview-ready HTML. */
export function markdownToHtml(markdown: string | null | undefined): string {
  if (!markdown) return "";
  const { text, restore } = protectCode(markdown);

  const out = restore(transformAttachments(text));
  return marked.parse(out, { async: false }) as string;
}

let turndown: TurndownService | null = null;

function widthFromImg(node: Element): string {
  const style = node.getAttribute("style") ?? "";
  const m = /width\s*:\s*([0-9]+(?:%|px)?)/i.exec(style);
  if (m) return m[1];
  const attr = node.getAttribute("width");
  return attr ?? "";
}

function getTurndown(): TurndownService {
  if (turndown) return turndown;
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });

  td.addRule("attachmentImage", {
    filter: (node) => node.nodeName === "IMG" && node.hasAttribute("data-attachment-ref"),
    replacement: (_content, node) => {
      const el = node as Element;
      const ref = el.getAttribute("data-attachment-ref") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      // YouTrack uses bare numbers for pixel widths (e.g. {width=300}).
      const width = widthFromImg(el).replace(/^(\d+)px$/i, "$1");
      return `![${alt}](${ref})${width ? `{width=${width}}` : ""}`;
    },
  });

  td.addRule("attachmentFile", {
    filter: (node) => node.nodeName === "A" && (node.getAttribute("class") ?? "").split(/\s+/).includes("rte-file"),
    replacement: (_content, node) => {
      const el = node as Element;
      const ref = el.getAttribute("data-attachment-ref") ?? el.getAttribute("data-file-name") ?? "";
      const name = el.getAttribute("data-file-name") ?? ref;
      return ref ? `[${name}](${ref})` : "";
    },
  });

  turndown = td;
  return td;
}

/** Converts editor HTML back into YouTrack-flavoured Markdown. */
export function htmlToMarkdown(html: string | null | undefined): string {
  if (!html) return "";
  return getTurndown().turndown(html).trim();
}
