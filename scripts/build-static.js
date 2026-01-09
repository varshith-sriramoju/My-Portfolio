/*
  Build a static site from Thymeleaf templates for Vercel.
  - Inlines fragments into home template to produce public/index.html
  - Copies static assets to public/
  - Generates public/resume.html pointing to public/resume/VarshithResume.pdf
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TEMPLATES_DIR = path.join(ROOT, 'src', 'main', 'resources', 'templates');
const FRAGMENTS_DIR = path.join(TEMPLATES_DIR, 'fragments');
const STATIC_DIR = path.join(ROOT, 'src', 'main', 'resources', 'static');
const RESUME_DIR = path.join(ROOT, 'src', 'main', 'resources', 'resume');
const OUT_DIR = path.join(ROOT, 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function extractFragment(fragmentFile, fragmentName) {
  const content = readFileSafe(fragmentFile);
  if (!content) return null;
  // Capture the element with th:fragment="fragmentName" including its outer tag
  const re = new RegExp(`<([a-zA-Z0-9:]+)([^>]*?)\\sth:fragment=\\"${fragmentName}\\"([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'm');
  const m = content.match(re);
  if (!m) return null;
  // If it's a th:block, unwrap and return inner content only
  if (m[1].toLowerCase() === 'th:block') {
    return m[4];
  }
  return `<${m[1]}${m[2]}${m[3]}>${m[4]}</${m[1]}>`;
}

function inlineFragments(homeHtml) {
  // Find th:replace patterns of format ~{fragments/<file> :: <fragment>}
  const re = /<div[^>]*\sth:replace=\"~\{fragments\/(.*?)\s::\s(.*?)\}\"[^>]*><\/div>/gm;
  return homeHtml.replace(re, (match, fileName, fragName) => {
    const fragmentFile = path.join(FRAGMENTS_DIR, `${fileName}.html`);
    const frag = extractFragment(fragmentFile, fragName);
    if (!frag) {
      console.warn(`Warning: Unable to inline fragment ${fragName} from ${fragmentFile}`);
      return `<!-- Missing fragment ${fileName} :: ${fragName} -->`;
    }
    return frag;
  });
}

function stripThymeleafAttributes(html) {
  // Remove xmlns:th and th:* attributes to make HTML cleaner
  let out = html.replace(/\sxmlns:th=\"http:\/\/www.thymeleaf.org\"/g, '');
  out = out.replace(/\s(th:[a-zA-Z-]+)=\"[^\"]*\"/g, '');
  return out;
}

function injectWeb3FormsAccessKey(html) {
  const key = process.env.WEB3FORMS_ACCESS_KEY;
  if (!key) {
    console.warn('Warning: WEB3FORMS_ACCESS_KEY is not set. Contact form will not submit.');
    return html;
  }
  // Add value attribute to the hidden access_key input
  return html.replace(/(<input[^>]*id=\"web3formsAccessKey\"[^>]*)(>)/i, (match, pre, end) => {
    if (/\svalue=\"[^\"]*\"/i.test(pre)) return match; // value already present
    return `${pre} value=\"${key}\"${end}`;
  });
}

function buildIndex() {
  const homePath = path.join(TEMPLATES_DIR, 'home.html');
  let homeHtml = readFileSafe(homePath);
  if (!homeHtml) throw new Error(`Cannot read ${homePath}`);
  homeHtml = inlineFragments(homeHtml);
  homeHtml = stripThymeleafAttributes(homeHtml);
  homeHtml = injectWeb3FormsAccessKey(homeHtml);
  // Ensure asset paths point to /css, /js, /images (already in template)
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), homeHtml, 'utf8');
}

function buildResumePage() {
  const resumeTpl = path.join(TEMPLATES_DIR, 'resume.html');
  let resumeHtml = readFileSafe(resumeTpl);
  if (!resumeHtml) return; // optional
  resumeHtml = resumeHtml
    .replace(/href=\"\/resume\?download=true\"/g, 'href="/resume/VarshithResume.pdf" download')
    .replace(/href=\"\/resume\"/g, 'href="/resume/VarshithResume.pdf"')
    .replace(/src=\"\/resume\"/g, 'src="/resume/VarshithResume.pdf"');
  resumeHtml = stripThymeleafAttributes(resumeHtml);
  fs.writeFileSync(path.join(OUT_DIR, 'resume.html'), resumeHtml, 'utf8');
}

function main() {
  ensureDir(OUT_DIR);
  // Copy assets
  if (fs.existsSync(STATIC_DIR)) copyDir(STATIC_DIR, OUT_DIR);
  // Copy resume pdfs
  const outResumeDir = path.join(OUT_DIR, 'resume');
  ensureDir(outResumeDir);
  if (fs.existsSync(RESUME_DIR)) {
    for (const entry of fs.readdirSync(RESUME_DIR)) {
      const s = path.join(RESUME_DIR, entry);
      const d = path.join(outResumeDir, entry);
      if (fs.statSync(s).isFile()) fs.copyFileSync(s, d);
    }
  }
  // Build pages
  buildIndex();
  buildResumePage();
  console.log('Static site generated in:', OUT_DIR);
}

main();
