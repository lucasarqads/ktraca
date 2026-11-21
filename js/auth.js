/* ==========================================================================
   Festec — Autenticação simulada e proteção de rota
   - Usado em index.html (login) e painel.html (gerenciador).
   - A sessão é apenas o nome do usuário salvo em sessionStorage.
   ========================================================================== */

(function () {
  'use strict';

  var SESSION_KEY = 'festec_user';
  var DEMO_PASSWORD = '1234';
  var LOGIN_PAGE = 'index.html';
  var PANEL_PAGE = 'painel.html';

  /* ---------- Helpers de sessão (sempre com try/catch) ---------- */
  function getUser() {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch (e) {
      return null;
    }
  }

  function setUser(name) {
    try {
      sessionStorage.setItem(SESSION_KEY, name);
      return true;
    } catch (e) {
      return false;
    }
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignora */ }
    window.location.replace(LOGIN_PAGE);
  }

  // Exposto para o painel.js
  window.FestecAuth = { getUser: getUser, logout: logout };

  /* ---------- Proteção de rota (roda imediatamente, no <head>) ---------- */
  var page = document.documentElement.getAttribute('data-page');

  if (page === 'painel' && !getUser()) {
    window.location.replace(LOGIN_PAGE);
    return;
  }
  if (page === 'login' && getUser()) {
    window.location.replace(PANEL_PAGE);
    return;
  }

  /* ---------- Painel: revalida a sessão ao voltar pelo histórico ----------
     Ex.: usuário clica em "Sair" e depois no botão "voltar" do navegador.
     O "pageshow" dispara tanto na carga normal quanto na restauração do bfcache. */
  if (page === 'painel') {
    window.addEventListener('pageshow', function () {
      if (!getUser()) window.location.replace(LOGIN_PAGE);
    });
    return;
  }

  if (page !== 'login') return;

  var redirectTimer = null; // setTimeout do redirecionamento pós-login

  /* ---------- Lógica do formulário de login ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('loginForm');
    var card = document.getElementById('loginCard');
    var nameInput = document.getElementById('userName');
    var passInput = document.getElementById('password');
    var nameError = document.getElementById('userNameError');
    var passError = document.getElementById('passwordError');
    var toggleBtn = document.getElementById('togglePassword');
    var submitBtn = document.getElementById('loginBtn');

    // Mostra/oculta erro de um campo
    function setError(input, errorEl, message) {
      if (message) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.classList.add('is-visible');
      } else {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        errorEl.textContent = '';
        errorEl.classList.remove('is-visible');
      }
    }

    // Reinicia a animação de shake mesmo em erros consecutivos
    function shake() {
      card.classList.remove('shake');
      void card.offsetWidth; // força reflow
      card.classList.add('shake');
    }
    card.addEventListener('animationend', function () { card.classList.remove('shake'); });

    // Limpa o erro assim que o usuário volta a digitar
    // Devolve o formulário ao estado inicial (usado ao voltar pelo histórico/bfcache)
    function resetLoginButton() {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = 'Entrar';
      nameInput.disabled = false;
      passInput.disabled = false;
      passInput.value = '';
      setError(nameInput, nameError, '');
      setError(passInput, passError, '');
      card.classList.remove('shake');
    }

    // "pageshow" dispara na carga normal e quando a página volta do bfcache (event.persisted)
    window.addEventListener('pageshow', function () {
      if (getUser()) {
        window.location.replace(PANEL_PAGE);
      } else {
        resetLoginButton();
      }
    });

    nameInput.addEventListener('input', function () { setError(nameInput, nameError, ''); });
    passInput.addEventListener('input', function () { setError(passInput, passError, ''); });

    // Botão de olho
    toggleBtn.addEventListener('click', function () {
      var show = passInput.type === 'password';
      passInput.type = show ? 'text' : 'password';
      toggleBtn.setAttribute('aria-pressed', String(show));
      toggleBtn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      toggleBtn.querySelector('.icon-eye').hidden = show;
      toggleBtn.querySelector('.icon-eye-off').hidden = !show;
      passInput.focus();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = nameInput.value.trim().replace(/\s+/g, ' ');
      var password = passInput.value;
      var firstInvalid = null;

      // Validação do nome
      if (name.length < 2) {
        setError(nameInput, nameError, name.length === 0
          ? 'Informe seu nome para continuar.'
          : 'O nome precisa ter pelo menos 2 caracteres.');
        firstInvalid = nameInput;
      }

      // Validação da senha
      if (!password) {
        setError(passInput, passError, 'Informe a senha.');
        firstInvalid = firstInvalid || passInput;
      } else if (password !== DEMO_PASSWORD) {
        setError(passInput, passError, 'Senha incorreta. Tente novamente.');
        firstInvalid = firstInvalid || passInput;
      }

      if (firstInvalid) {
        shake();
        firstInvalid.focus();
        if (firstInvalid === passInput) passInput.select();
        return;
      }

      // Sucesso: estado de carregamento e redirecionamento
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Entrando...';
      nameInput.disabled = true;
      passInput.disabled = true;

      setUser(name);
      // replace: o login não fica no histórico, então "voltar" não retorna a ele
      redirectTimer = setTimeout(function () {
        redirectTimer = null;
        window.location.replace(PANEL_PAGE);
      }, 1000);
    });

    nameInput.focus();
  });
})();
