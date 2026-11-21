/* ==========================================================================
   Festec — build de publicação
   Copia o projeto para /dist, ofusca os scripts principais e minifica o CSS.
   Os arquivos originais não são alterados. Publique apenas a pasta /dist.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Itens que não vão para a publicação
const EXCLUDE = new Set([
  'dist', 'node_modules', 'scripts', '.git', '.gitignore', '.vscode',
  'package.json', 'package-lock.json', 'README.md', 'festec.code-workspace'
]);

const OBFUSCATE = ['js/auth.js', 'js/data.js', 'js/painel.js', 'js/protect.js'];
const MINIFY_CSS = ['css/styles.css'];

const OBFUSCATOR_OPTIONS = {
  compact: true,
  target: 'browser',
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: [],
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.25, // leve: preserva desempenho
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  renameGlobals: false,                  // mantém window.FestecAuth, window.FESTEC_EVENT etc.
  identifierNamesGenerator: 'hexadecimal',
  unicodeEscapeSequence: false
};

function log(msg) { process.stdout.write(msg + '\n'); }

// 1. Limpa e copia
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const entry of fs.readdirSync(ROOT)) {
  if (EXCLUDE.has(entry)) continue;
  fs.cpSync(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true });
}
log('✔ Projeto copiado para dist/');

// 2. Ofusca JS
for (const rel of OBFUSCATE) {
  const file = path.join(DIST, rel);
  if (!fs.existsSync(file)) { log('  (ignorado, não existe) ' + rel); continue; }
  const src = fs.readFileSync(file, 'utf8');
  const out = JavaScriptObfuscator.obfuscate(src, OBFUSCATOR_OPTIONS).getObfuscatedCode();
  fs.writeFileSync(file, out, 'utf8');
  log(`✔ Ofuscado ${rel} (${src.length} → ${out.length} bytes)`);
}

// 3. Minifica CSS
const cleaner = new CleanCSS({ level: 1 });
for (const rel of MINIFY_CSS) {
  const file = path.join(DIST, rel);
  const src = fs.readFileSync(file, 'utf8');
  const result = cleaner.minify(src);
  if (result.errors.length) throw new Error(rel + ': ' + result.errors.join('; '));
  fs.writeFileSync(file, result.styles, 'utf8');
  log(`✔ Minificado ${rel} (${src.length} → ${result.styles.length} bytes)`);
}

log('\nBuild concluído. Publique a pasta dist/.');
