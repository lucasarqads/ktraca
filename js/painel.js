/* ==========================================================================
   Festec — Lógica do gerenciador de convidados (painel.html)
   ========================================================================== */

(function () {
  'use strict';

  // Sem sessão o auth.js já redirecionou — não inicializa nada.
  if (!window.FestecAuth || !window.FestecAuth.getUser()) return;

  /* ======================================================================
     CONSTANTES E ESTADO
     ====================================================================== */
  var STORAGE_KEY = 'festec_guests';

  var TYPE_LABELS = { pista: 'Pista', vip: 'VIP', imprensa: 'Imprensa', staff: 'Staff' };
  var STATUS_LABELS = { aguardando: 'Aguardando', presente: 'Presente', cancelado: 'Cancelado' };
  // Evento exclusivo para maiores de 18 anos
  var MIN_AGE = 18;
  var MAX_AGE = 120;

  function ageLabel(age) { return age ? age + ' anos' : ''; }

  var state = {
    guests: [],
    search: '',
    status: 'todos',
    type: 'todos',
    sortBy: 'name',   // 'name' | 'checkin'
    sortDir: 'asc',   // 'asc' | 'desc'
    editingId: null,  // id em edição no modal (null = novo)
    draftCode: null   // código gerado para o novo convidado
  };

  /* ======================================================================
     UTILITÁRIOS
     ====================================================================== */
  var $ = function (id) { return document.getElementById(id); };

  // Escapa texto antes de inserir em HTML (evita XSS com dados digitados)
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Remove acentos e caixa para busca tolerante ("joao" encontra "João")
  function normalize(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function onlyDigits(text) { return String(text || '').replace(/\D/g, ''); }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function nowHHMM() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  // Máscara de telefone: (11) 91234-5678 ou (11) 3123-4567
  function maskPhone(value) {
    var d = onlyDigits(value).slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  // Gera um código FST-XXXX que ainda não exista na lista
  function generateCode() {
    var code;
    var tries = 0;
    do {
      code = 'FST-' + String(Math.floor(1000 + Math.random() * 9000));
      tries++;
    } while (findByCode(code) && tries < 500);
    return code;
  }

  function generateId() {
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function findById(id) {
    for (var i = 0; i < state.guests.length; i++) {
      if (state.guests[i].id === id) return state.guests[i];
    }
    return null;
  }

  function findByCode(code) {
    var c = String(code).toUpperCase();
    for (var i = 0; i < state.guests.length; i++) {
      if (state.guests[i].code === c) return state.guests[i];
    }
    return null;
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  /* ======================================================================
     PERSISTÊNCIA (localStorage com try/catch)
     ====================================================================== */
  function loadGuests() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return migrate(parsed);
      }
    } catch (e) { /* dados corrompidos ou storage bloqueado: usa o seed */ }
    return clone(window.FESTEC_SEED || []);
  }

  // Dados salvos antes da idade exata existir (sem idade ou com a antiga "faixa"):
  // completa a partir do seed (mesmo id)
  function migrate(list) {
    var seed = window.FESTEC_SEED || [];
    list.forEach(function (g) {
      delete g.ageRange;
      if (typeof g.age === 'number') return;
      g.age = null; // será exigida na próxima edição
      for (var i = 0; i < seed.length; i++) {
        if (seed[i].id === g.id) { g.age = seed[i].age; return; }
      }
    });
    return list;
  }

  function saveGuests() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.guests));
    } catch (e) {
      // Ex.: navegação privada com storage bloqueado — segue funcionando em memória
    }
  }

  /* ======================================================================
     TOASTS
     ====================================================================== */
  var TOAST_ICONS = {
    success: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    error: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    info: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M12 11v6M12 7h.01"/></svg>'
  };

  function toast(message, type) {
    type = type || 'info';
    var container = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.innerHTML =
      '<span class="toast__icon" aria-hidden="true">' + TOAST_ICONS[type] + '</span>' +
      '<span class="toast__msg">' + esc(message) + '</span>';
    container.appendChild(el);

    // Limita a pilha a 4 toasts
    while (container.children.length > 4) container.removeChild(container.firstChild);

    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
    }, 3000);
  }

  /* ======================================================================
     FILTRO, BUSCA E ORDENAÇÃO
     ====================================================================== */
  function getFiltered() {
    var q = normalize(state.search.trim());
    var qDigits = onlyDigits(state.search);

    var list = state.guests.filter(function (g) {
      if (state.status !== 'todos' && g.status !== state.status) return false;
      if (state.type !== 'todos' && g.type !== state.type) return false;
      if (!q) return true;

      return normalize(g.name).indexOf(q) !== -1 ||
        normalize(g.email).indexOf(q) !== -1 ||
        normalize(g.code).indexOf(q) !== -1 ||
        (qDigits.length >= 2 && onlyDigits(g.phone).indexOf(qDigits) !== -1);
    });

    var dir = state.sortDir === 'asc' ? 1 : -1;
    list.sort(function (a, b) {
      if (state.sortBy === 'checkin') {
        // Sem check-in vai sempre para o final, independente da direção
        if (!a.checkin && !b.checkin) return a.name.localeCompare(b.name, 'pt-BR');
        if (!a.checkin) return 1;
        if (!b.checkin) return -1;
        return a.checkin.localeCompare(b.checkin) * dir;
      }
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) * dir;
    });

    return list;
  }

  /* ======================================================================
     RENDERIZAÇÃO
     ====================================================================== */
  function typeBadge(type) {
    return '<span class="badge badge--' + type + '">' + esc(TYPE_LABELS[type] || type) + '</span>';
  }

  function statusBadge(status) {
    return '<span class="badge badge--dot badge--' + status + '">' + esc(STATUS_LABELS[status] || status) + '</span>';
  }

  var ICON_EDIT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var ICON_TRASH = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';

  // Botões de ação (iguais na tabela e nos cards)
  function actionButtons(g) {
    var first;
    if (g.status === 'presente') {
      first = '<button type="button" class="btn btn--sm btn--undo" data-action="undo" data-id="' + g.id + '" aria-label="Desfazer entrada de ' + esc(g.name) + '">Desfazer</button>';
    } else if (g.status === 'cancelado') {
      first = '<button type="button" class="btn btn--sm btn--success" disabled title="Ingresso cancelado" aria-label="Ingresso de ' + esc(g.name) + ' cancelado">Confirmar entrada</button>';
    } else {
      first = '<button type="button" class="btn btn--sm btn--success" data-action="checkin" data-id="' + g.id + '" aria-label="Confirmar entrada de ' + esc(g.name) + '">Confirmar entrada</button>';
    }
    // Editar/Remover têm ícone + texto; em telas médias (notebooks) o texto some e fica só o ícone
    return '<div class="actions">' + first +
      '<button type="button" class="btn btn--sm btn--outline-primary btn--icon-text" data-action="edit" data-id="' + g.id + '" aria-label="Editar ' + esc(g.name) + '" title="Editar">' +
        ICON_EDIT + '<span class="btn__text">Editar</span></button>' +
      '<button type="button" class="btn btn--sm btn--outline-danger btn--icon-text" data-action="remove" data-id="' + g.id + '" aria-label="Remover ' + esc(g.name) + '" title="Remover">' +
        ICON_TRASH + '<span class="btn__text">Remover</span></button>' +
      '</div>';
  }

  function guestCell(g) {
    return '<div class="guest__name">' + esc(g.name) + '</div>' +
      '<div class="guest__email">' + esc(g.email) + '</div>' +
      (g.notes ? '<div class="guest__notes">' + esc(g.notes) + '</div>' : '');
  }

  function rowHTML(g) {
    return '<tr data-id="' + g.id + '"' + (g.status === 'cancelado' ? ' class="is-cancelled"' : '') + '>' +
      '<td>' + guestCell(g) + '</td>' +
      '<td class="mono">' + esc(g.phone) + '</td>' +
      '<td class="age">' + (g.age ? esc(ageLabel(g.age)) : '<span class="muted">—</span>') + '</td>' +
      '<td><div class="ticket">' + typeBadge(g.type) + '<span class="ticket__code">' + esc(g.code) + '</span></div></td>' +
      '<td><span class="companions">' + g.companions + '</span></td>' +
      '<td class="mono">' + (g.checkin ? esc(g.checkin) : '<span class="muted">—</span>') + '</td>' +
      '<td>' + statusBadge(g.status) + '</td>' +
      '<td>' + actionButtons(g) + '</td>' +
      '</tr>';
  }

  function cardHTML(g) {
    return '<article class="guest-card' + (g.status === 'cancelado' ? ' is-cancelled' : '') + '" data-id="' + g.id + '">' +
      '<div class="guest-card__head"><div>' + guestCell(g) + '</div>' + statusBadge(g.status) + '</div>' +
      '<dl class="guest-card__info">' +
        '<div><dt>Telefone</dt><dd class="mono">' + esc(g.phone) + '</dd></div>' +
        '<div><dt>Idade</dt><dd class="age">' + (g.age ? esc(ageLabel(g.age)) : '—') + '</dd></div>' +
        '<div><dt>Ingresso</dt><dd><div class="ticket">' + typeBadge(g.type) + '<span class="ticket__code">' + esc(g.code) + '</span></div></dd></div>' +
        '<div><dt>Acompanhantes</dt><dd><span class="companions">' + g.companions + '</span></dd></div>' +
        '<div><dt>Check-in</dt><dd class="mono">' + (g.checkin ? esc(g.checkin) : '—') + '</dd></div>' +
      '</dl>' +
      actionButtons(g) +
      '</article>';
  }

  function renderList() {
    var list = getFiltered();
    var hasFilters = state.search.trim() || state.status !== 'todos' || state.type !== 'todos';

    $('tableBody').innerHTML = list.map(rowHTML).join('');
    $('cardList').innerHTML = list.map(cardHTML).join('');

    var isEmpty = list.length === 0;
    $('emptyState').classList.toggle('is-visible', isEmpty);
    $('clearFiltersBtn').hidden = !hasFilters;
    $('emptyText').textContent = hasFilters
      ? 'Tente ajustar a busca ou os filtros para encontrar quem você procura.'
      : 'A lista está vazia. Adicione o primeiro convidado do evento.';
    document.querySelector('.table-wrap').style.visibility = isEmpty ? 'hidden' : '';
    document.querySelector('.table-wrap').style.height = isEmpty ? '0' : '';

    var total = state.guests.length;
    $('resultCount').innerHTML = hasFilters
      ? 'Mostrando <strong>' + list.length + '</strong> de ' + total + ' convidados'
      : '<strong>' + total + '</strong> convidados na lista';
  }

  function renderMetrics() {
    var active = 0, present = 0, waiting = 0, cancelled = 0, vip = 0, vipPresent = 0, companionsIn = 0;

    state.guests.forEach(function (g) {
      if (g.status === 'cancelado') { cancelled++; return; }
      active++;
      if (g.status === 'presente') { present++; companionsIn += Number(g.companions) || 0; }
      if (g.status === 'aguardando') waiting++;
      if (g.type === 'vip') {
        vip++;
        if (g.status === 'presente') vipPresent++;
      }
    });

    var pct = active ? Math.round((present / active) * 100) : 0;

    $('mTotal').textContent = active;
    $('mTotalSub').textContent = cancelled
      ? cancelled + (cancelled === 1 ? ' cancelado' : ' cancelados')
      : 'Nenhum cancelamento';
    $('mPresent').textContent = present;
    $('mPresentSub').innerHTML = '<b>' + pct + '%</b> do total' +
      (companionsIn ? ' · +' + companionsIn + ' acomp.' : '');
    $('mWaiting').textContent = waiting;
    $('mVip').textContent = vip;
    $('mVipSub').textContent = vipPresent + (vipPresent === 1 ? ' presente' : ' presentes');

    $('occupancyText').textContent = present + ' de ' + active + ' convidados · ' + pct + '%';
    $('occupancyFill').style.width = pct + '%';
    var bar = $('occupancyBar');
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-valuetext', present + ' de ' + active + ' convidados presentes, ' + pct + '%');
  }

  function renderSortHeaders() {
    var buttons = document.querySelectorAll('.sort-btn');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var active = btn.getAttribute('data-sort') === state.sortBy;
      btn.setAttribute('data-active', String(active));
      btn.setAttribute('data-dir', active ? state.sortDir : 'asc');
      btn.closest('th').setAttribute('aria-sort', active
        ? (state.sortDir === 'asc' ? 'ascending' : 'descending')
        : 'none');
    }
  }

  function render() {
    renderMetrics();
    renderList();
    renderSortHeaders();
  }

  // Destaca a linha/card recém-confirmado por 1,5s
  function flash(id) {
    var els = document.querySelectorAll('[data-id="' + id + '"]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].tagName === 'TR' || els[i].classList.contains('guest-card')) {
        (function (el) {
          el.classList.add('flash');
          setTimeout(function () { el.classList.remove('flash'); }, 1500);
        })(els[i]);
      }
    }
  }

  /* ======================================================================
     AÇÕES SOBRE CONVIDADOS
     ====================================================================== */
  function checkIn(guest) {
    guest.status = 'presente';
    guest.checkin = nowHHMM();
    saveGuests();
    render();
    flash(guest.id);
    toast('Entrada de ' + guest.name + ' confirmada às ' + guest.checkin + '.', 'success');
  }

  function undoCheckIn(guest) {
    guest.status = 'aguardando';
    guest.checkin = null;
    saveGuests();
    render();
    toast('Check-in de ' + guest.name + ' desfeito.', 'info');
  }

  function removeGuest(guest) {
    state.guests = state.guests.filter(function (g) { return g.id !== guest.id; });
    saveGuests();
    render();
    toast(guest.name + ' foi removido(a) da lista.', 'success');
  }

  // Delegação de eventos para botões da tabela e dos cards
  function onActionClick(event) {
    var btn = event.target.closest('[data-action]');
    if (!btn) return;
    var guest = findById(btn.getAttribute('data-id'));
    if (!guest) return;

    switch (btn.getAttribute('data-action')) {
      case 'checkin': checkIn(guest); break;
      case 'undo': undoCheckIn(guest); break;
      case 'edit': openGuestModal(guest, btn); break;
      case 'remove':
        openConfirm({
          title: 'Remover convidado?',
          html: 'Tem certeza que deseja remover <strong>' + esc(guest.name) + '</strong> (' + esc(guest.code) + ') da lista? Esta ação não pode ser desfeita.',
          okLabel: 'Remover',
          onConfirm: function () { removeGuest(guest); }
        }, btn);
        break;
    }
  }

  /* ======================================================================
     MODAIS (foco preso, ESC, clique fora)
     ====================================================================== */
  var openModalEl = null;
  var lastFocused = null;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openModal(modal, trigger, focusEl) {
    lastFocused = trigger || document.activeElement;
    openModalEl = modal;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    // Aguarda o próximo frame para o foco funcionar após a transição de visibilidade
    requestAnimationFrame(function () {
      (focusEl || modal.querySelector(FOCUSABLE)).focus();
    });
  }

  function closeModal() {
    if (!openModalEl) return;
    openModalEl.classList.remove('is-open');
    openModalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    openModalEl = null;
    // Devolve o foco ao elemento que abriu o modal (se ainda existir na página)
    if (lastFocused && document.body.contains(lastFocused)) lastFocused.focus();
    else $('addBtn').focus();
  }

  function trapFocus(event) {
    if (!openModalEl || event.key !== 'Tab') return;
    var nodes = openModalEl.querySelectorAll(FOCUSABLE);
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && openModalEl) {
      event.preventDefault();
      closeModal();
    }
    trapFocus(event);
  });

  // Qualquer elemento com [data-close] dentro de um modal fecha o modal
  document.addEventListener('click', function (event) {
    if (openModalEl && event.target.closest('[data-close]') && openModalEl.contains(event.target)) {
      closeModal();
    }
  });

  /* ---------- Modal de confirmação genérico ---------- */
  var confirmCallback = null;

  function openConfirm(opts, trigger) {
    $('confirmTitle').textContent = opts.title;
    $('confirmText').innerHTML = opts.html;
    $('confirmOk').textContent = opts.okLabel || 'Confirmar';
    confirmCallback = opts.onConfirm;
    // Foco inicial em "Cancelar" — ação destrutiva exige escolha deliberada
    openModal($('confirmModal'), trigger, $('confirmModal').querySelector('[data-close].btn'));
  }

  $('confirmOk').addEventListener('click', function () {
    var cb = confirmCallback;
    confirmCallback = null;
    closeModal();
    if (cb) cb();
  });

  /* ---------- Modal adicionar/editar ---------- */
  var gFields = {
    name: $('gName'),
    email: $('gEmail'),
    phone: $('gPhone'),
    type: $('gType'),
    companions: $('gCompanions'),
    age: $('gAge'),
    status: $('gStatus'),
    notes: $('gNotes')
  };

  function setFieldError(input, message) {
    var errorEl = $(input.id + 'Error');
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) { errorEl.textContent = message; errorEl.classList.add('is-visible'); }
    } else {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }
    }
  }

  function clearFormErrors() {
    Object.keys(gFields).forEach(function (k) { setFieldError(gFields[k], ''); });
  }

  function openGuestModal(guest, trigger) {
    clearFormErrors();
    state.editingId = guest ? guest.id : null;

    var isEdit = !!guest;
    $('guestModalEyebrow').textContent = isEdit ? 'Editar cadastro' : 'Novo convidado';
    $('guestModalTitle').textContent = isEdit ? 'Editar convidado' : 'Adicionar convidado';
    $('guestSubmit').textContent = isEdit ? 'Salvar alterações' : 'Adicionar convidado';
    $('gStatusField').hidden = !isEdit; // novos convidados começam como "Aguardando"

    if (isEdit) {
      gFields.name.value = guest.name;
      gFields.email.value = guest.email;
      gFields.phone.value = guest.phone;
      gFields.type.value = guest.type;
      gFields.companions.value = guest.companions;
      gFields.age.value = guest.age || '';
      gFields.status.value = guest.status;
      gFields.notes.value = guest.notes || '';
      $('guestCode').textContent = guest.code;
    } else {
      $('guestForm').reset();
      gFields.companions.value = 0;
      gFields.status.value = 'aguardando';
      state.draftCode = generateCode();
      $('guestCode').textContent = state.draftCode;
    }

    openModal($('guestModal'), trigger, gFields.name);
  }

  // Valida o formulário e retorna os dados limpos, ou null se houver erro
  function validateGuestForm() {
    var data = {
      name: gFields.name.value.trim().replace(/\s+/g, ' '),
      email: gFields.email.value.trim().toLowerCase(),
      phone: maskPhone(gFields.phone.value),
      type: gFields.type.value,
      companions: gFields.companions.value,
      age: gFields.age.value.trim(),
      status: gFields.status.value,
      notes: gFields.notes.value.trim()
    };
    var firstInvalid = null;

    function fail(input, msg) {
      setFieldError(input, msg);
      if (!firstInvalid) firstInvalid = input;
    }

    clearFormErrors();

    if (data.name.length < 2) fail(gFields.name, 'Informe o nome (mínimo 2 caracteres).');

    if (!data.email) fail(gFields.email, 'Informe o e-mail.');
    else if (!isValidEmail(data.email)) fail(gFields.email, 'Digite um e-mail válido.');
    else {
      var dup = state.guests.some(function (g) {
        return g.email.toLowerCase() === data.email && g.id !== state.editingId;
      });
      if (dup) fail(gFields.email, 'Já existe um convidado com este e-mail.');
    }

    var digits = onlyDigits(data.phone);
    if (!digits) fail(gFields.phone, 'Informe o telefone.');
    else if (digits.length < 10) fail(gFields.phone, 'Telefone incompleto. Use (11) 91234-5678.');

    var comp = Number(data.companions);
    if (data.companions === '' || !Number.isInteger(comp) || comp < 0 || comp > 5) {
      fail(gFields.companions, 'Informe um número de 0 a 5.');
    }
    data.companions = comp;

    // Evento +18: idade exata obrigatória e menores de idade são recusados
    var age = Number(data.age);
    if (data.age === '') fail(gFields.age, 'Informe a idade.');
    else if (!Number.isInteger(age) || age < 0) fail(gFields.age, 'Digite uma idade válida (apenas números inteiros).');
    else if (age < MIN_AGE) fail(gFields.age, 'Entrada permitida apenas para maiores de 18 anos.');
    else if (age > MAX_AGE) fail(gFields.age, 'Digite uma idade válida (até ' + MAX_AGE + ' anos).');
    data.age = age;

    if (firstInvalid) { firstInvalid.focus(); return null; }
    return data;
  }

  $('guestForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var data = validateGuestForm();
    if (!data) return;

    var savedId;

    if (state.editingId) {
      var guest = findById(state.editingId);
      if (!guest) { closeModal(); return; }
      var wasPresent = guest.status === 'presente';

      guest.name = data.name;
      guest.email = data.email;
      guest.phone = data.phone;
      guest.type = data.type;
      guest.companions = data.companions;
      guest.age = data.age;
      guest.notes = data.notes;
      guest.status = data.status;
      // Mantém o horário coerente com o status escolhido
      if (data.status === 'presente' && !wasPresent) guest.checkin = nowHHMM();
      if (data.status !== 'presente') guest.checkin = null;

      savedId = guest.id;
      toast('Dados de ' + guest.name + ' atualizados.', 'success');
    } else {
      var newGuest = {
        id: generateId(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        type: data.type,
        code: findByCode(state.draftCode) ? generateCode() : state.draftCode,
        companions: data.companions,
        age: data.age,
        status: 'aguardando',
        checkin: null,
        notes: data.notes
      };
      state.guests.push(newGuest);
      savedId = newGuest.id;
      toast(newGuest.name + ' adicionado(a) com o ingresso ' + newGuest.code + '.', 'success');
    }

    saveGuests();
    closeModal();
    render();
    flash(savedId);
  });

  // Máscara de telefone enquanto digita
  gFields.phone.addEventListener('input', function () {
    gFields.phone.value = maskPhone(gFields.phone.value);
  });

  // Limpa o erro do campo assim que o usuário corrige
  Object.keys(gFields).forEach(function (k) {
    gFields[k].addEventListener('input', function () {
      if (gFields[k].classList.contains('is-invalid')) setFieldError(gFields[k], '');
    });
  });

  /* ======================================================================
     CHECK-IN RÁPIDO POR CÓDIGO
     ====================================================================== */
  function setQuickError(message) {
    var input = $('quickCode');
    var err = $('quickError');
    input.classList.toggle('is-invalid', !!message);
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    err.textContent = message || '';
    err.classList.toggle('is-visible', !!message);
  }

  $('quickCode').addEventListener('input', function () { setQuickError(''); });

  $('quickForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var input = $('quickCode');
    var raw = input.value.trim().toUpperCase().replace(/\s+/g, '');

    if (!raw) { setQuickError('Digite o código do ingresso.'); input.focus(); return; }

    // Aceita "4821" ou "FST4821" além de "FST-4821"
    var digits = onlyDigits(raw);
    var code = digits.length === 4 ? 'FST-' + digits : raw;
    var guest = findByCode(code);

    if (!guest) {
      setQuickError('Código ' + code + ' não encontrado na lista.');
      toast('Ingresso ' + code + ' não encontrado.', 'error');
      input.select();
      return;
    }
    if (guest.status === 'cancelado') {
      setQuickError('O ingresso ' + code + ' de ' + guest.name + ' está cancelado.');
      toast('Ingresso ' + code + ' cancelado — entrada não permitida.', 'error');
      input.select();
      return;
    }
    if (guest.status === 'presente') {
      setQuickError('');
      toast(guest.name + ' já fez check-in às ' + guest.checkin + '.', 'info');
      input.value = '';
      flash(guest.id);
      return;
    }

    setQuickError('');
    input.value = '';
    checkIn(guest);
    input.focus();
  });

  /* ======================================================================
     EXPORTAR CSV (lista filtrada)
     ====================================================================== */
  function csvCell(value) {
    var s = String(value == null ? '' : value);
    // Evita injeção de fórmula ao abrir no Excel
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    var list = getFiltered();
    if (!list.length) {
      toast('Não há convidados na lista filtrada para exportar.', 'error');
      return;
    }

    var header = ['Nome', 'E-mail', 'Telefone', 'Idade', 'Tipo de ingresso', 'Código', 'Acompanhantes', 'Check-in', 'Status', 'Observações'];
    var lines = [header.map(csvCell).join(';')];
    list.forEach(function (g) {
      lines.push([
        g.name, g.email, g.phone, g.age || '', TYPE_LABELS[g.type], g.code, g.companions,
        g.checkin || '', STATUS_LABELS[g.status], g.notes || ''
      ].map(csvCell).join(';'));
    });

    // BOM para o Excel reconhecer UTF-8 (acentos) e ";" como separador pt-BR
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var d = new Date();
    var a = document.createElement('a');
    a.href = url;
    a.download = 'festec-convidados-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    toast(list.length + (list.length === 1 ? ' convidado exportado' : ' convidados exportados') + ' para CSV.', 'success');
  }

  /* ======================================================================
     RELÓGIO AO VIVO
     ====================================================================== */
  function tickClock() {
    var d = new Date();
    var el = $('clock');
    el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    el.setAttribute('datetime', d.toISOString());
  }

  /* ======================================================================
     INICIALIZAÇÃO
     ====================================================================== */
  function init() {
    var user = window.FestecAuth.getUser();
    var ev = window.FESTEC_EVENT || {};

    // Usuário no header
    $('userName').textContent = user;
    $('userAvatar').textContent = initials(user);
    $('userAvatar').title = user;

    // Dados do evento
    if (ev.name) {
      $('eventName').textContent = ev.name;
      document.title = ev.name + ' · Festec';
    }
    $('eventInfo').textContent = [ev.date, ev.time, ev.venue].filter(Boolean).join(' · ');

    state.guests = loadGuests();

    // Busca e filtros (filtra enquanto digita)
    $('search').addEventListener('input', function (e) { state.search = e.target.value; renderList(); });
    $('filterStatus').addEventListener('change', function (e) { state.status = e.target.value; renderList(); });
    $('filterType').addEventListener('change', function (e) { state.type = e.target.value; renderList(); });

    $('clearFiltersBtn').addEventListener('click', function () {
      state.search = ''; state.status = 'todos'; state.type = 'todos';
      $('search').value = ''; $('filterStatus').value = 'todos'; $('filterType').value = 'todos';
      renderList();
      $('search').focus();
    });

    // Ordenação pelos cabeçalhos
    var sortBtns = document.querySelectorAll('.sort-btn');
    for (var i = 0; i < sortBtns.length; i++) {
      sortBtns[i].addEventListener('click', function () {
        var key = this.getAttribute('data-sort');
        if (state.sortBy === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortBy = key; state.sortDir = 'asc'; }
        renderList();
        renderSortHeaders();
      });
    }

    // Ações das linhas e cards
    $('tableBody').addEventListener('click', onActionClick);
    $('cardList').addEventListener('click', onActionClick);

    $('addBtn').addEventListener('click', function () { openGuestModal(null, this); });
    $('exportBtn').addEventListener('click', exportCSV);

    $('logoutBtn').addEventListener('click', function () { window.FestecAuth.logout(); });

    $('resetBtn').addEventListener('click', function () {
      openConfirm({
        title: 'Restaurar dados de demonstração?',
        html: 'Todas as alterações feitas na lista serão descartadas e os <strong>' + (window.FESTEC_SEED || []).length + ' convidados</strong> originais serão recarregados.',
        okLabel: 'Restaurar',
        onConfirm: function () {
          try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignora */ }
          state.guests = clone(window.FESTEC_SEED || []);
          saveGuests();
          render();
          toast('Dados de demonstração restaurados.', 'info');
        }
      }, this);
    });

    // Atalho: "/" foca a busca (fora de campos de texto)
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || openModalEl) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      e.preventDefault();
      $('search').focus();
    });

    // Sincroniza alterações feitas em outra aba
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) { state.guests = loadGuests(); render(); }
    });

    tickClock();
    setInterval(tickClock, 1000);
    render();
  }

  init();
})();
