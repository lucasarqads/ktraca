/* ==========================================================================
   Festec — Camadas de proteção leve (dissuasão no navegador)
   - Bloqueia menu de contexto, arrastar imagens e atalhos de DevTools/salvar.
   - No painel: desfoque ao perder o foco e aviso ao pressionar PrintScreen.
   Nada aqui é segurança real: é só dissuasão para o usuário casual.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var page = root.getAttribute('data-page');

  /* ---------- 1. Menu de contexto e arrastar imagens ---------- */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  document.addEventListener('dragstart', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'IMG' || t.tagName === 'VIDEO' || t.tagName === 'svg')) {
      e.preventDefault();
    }
  });

  /* ---------- 2. Atalhos de teclado ---------- */
  function isBlockedShortcut(e) {
    var key = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;

    if (key === 'f12' || e.keyCode === 123) return true;                // F12
    if (mod && !e.shiftKey && (key === 'u' || key === 's')) return true; // Ctrl+U / Ctrl+S
    if (mod && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) return true; // Ctrl+Shift+I/J/C
    if (e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c' || e.code === 'KeyI' || e.code === 'KeyJ' || e.code === 'KeyC')) return true; // macOS Cmd+Opt+I/J/C
    return false;
  }

  // Fase de captura para agir antes de qualquer outro handler da página
  window.addEventListener('keydown', function (e) {
    if (isBlockedShortcut(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* ---------- Itens exclusivos do painel ---------- */
  if (page !== 'painel') return;

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    var body = document.body;

    /* ---------- 3. Desfoque ao perder o foco ---------- */
    var shield = document.createElement('div');
    shield.className = 'protect-shield';
    shield.setAttribute('aria-hidden', 'true');
    shield.innerHTML =
      '<div class="protect-shield__box">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' +
        '</svg>' +
        '<span>Conteúdo protegido</span>' +
      '</div>';
    body.appendChild(shield);

    function hideContent() { body.classList.add('is-protected'); }
    function showContent() {
      if (document.visibilityState === 'hidden') return;
      body.classList.remove('is-protected');
    }

    window.addEventListener('blur', hideContent);
    window.addEventListener('focus', showContent);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') hideContent();
      else if (document.hasFocus()) showContent();
    });
    // Clicar na sobreposição (caso o foco volte sem evento "focus") também revela
    shield.addEventListener('mousedown', showContent);

    // Tecla Windows/Command: desfoca antes de atalhos como Win+Shift+S completarem.
    // Não impede a captura, mas faz ela sair desfocada quando o navegador recebe a tecla a tempo.
    var metaTimer = null;
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Meta' || e.key === 'OS') {
        clearTimeout(metaTimer);
        hideContent();
      }
    }, true);
    window.addEventListener('keyup', function (e) {
      if (e.key !== 'Meta' && e.key !== 'OS') return;
      clearTimeout(metaTimer);
      metaTimer = setTimeout(function () {
        if (document.hasFocus()) showContent();
      }, 400);
    }, true);

    /* ---------- 4. PrintScreen ---------- */
    var lastToast = 0;
    function warnScreenshot() {
      var now = Date.now();
      if (now - lastToast < 1500) return; // evita toasts duplicados (keydown + keyup)
      lastToast = now;

      var container = document.getElementById('toasts');
      if (!container) return;
      var el = document.createElement('div');
      el.className = 'toast toast--error';
      el.innerHTML =
        '<span class="toast__icon" aria-hidden="true">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</span>' +
        '<span class="toast__msg">Capturas de tela não são permitidas</span>';
      container.appendChild(el);
      while (container.children.length > 4) container.removeChild(container.firstChild);
      setTimeout(function () {
        el.classList.add('is-leaving');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
      }, 3000);
    }

    function isPrintScreen(e) {
      return e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
    }

    // No Windows o PrintScreen costuma disparar só o keyup
    window.addEventListener('keydown', function (e) { if (isPrintScreen(e)) warnScreenshot(); }, true);
    window.addEventListener('keyup', function (e) {
      if (!isPrintScreen(e)) return;
      warnScreenshot();
      // Tenta sobrescrever a imagem copiada para a área de transferência (nem sempre permitido)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(function () {});
        }
      } catch (err) { /* ignora */ }
    }, true);
  });
})();
