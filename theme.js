// ── TEMA CLARO / ESCURO — CIPGd-FSA ─────────────────────────────────────────
(function () {
  var KEY = 'cipgd_theme';

  var DARK = {
    '--navy':     '#0a0f1e',
    '--panel':    '#161d30',
    '--border':   '#1f2d47',
    '--text':     '#e2e8f0',
    '--muted':    '#7a8aaa',
    '--input-bg': '#0d1424',
    '--card-bg':  '#161d30',
    '--topbar':   'rgba(10,15,30,0.92)',
  };

  var LIGHT = {
    '--navy':     '#eef1f7',
    '--panel':    '#ffffff',
    '--border':   '#cdd5e0',
    '--text':     '#1a2236',
    '--muted':    '#5a6a88',
    '--input-bg': '#f4f6fb',
    '--card-bg':  '#ffffff',
    '--topbar':   'rgba(238,241,247,0.95)',
  };

  function aplicar(tema) {
    var vars = tema === 'light' ? LIGHT : DARK;
    var root = document.documentElement;
    for (var k in vars) root.style.setProperty(k, vars[k]);

    // Atualiza meta theme-color da barra de status
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = tema === 'light' ? '#eef1f7' : '#0a0f1e';

    // Atualiza ícone do botão
    var btn = document.getElementById('_btn_tema');
    if (btn) btn.textContent = tema === 'light' ? '🌙' : '☀️';

    try { localStorage.setItem(KEY, tema); } catch (e) {}
  }

  function getTema() {
    try {
      var s = localStorage.getItem(KEY);
      if (s === 'light' || s === 'dark') return s;
    } catch (e) {}
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function toggle() {
    aplicar(getTema() === 'dark' ? 'light' : 'dark');
  }

  // Aplica ANTES do DOM renderizar para evitar flash
  aplicar(getTema());

  document.addEventListener('DOMContentLoaded', function () {
    // Re-aplica após CSS da página carregar
    aplicar(getTema());

    // Cria botão flutuante
    var btn = document.createElement('button');
    btn.id = '_btn_tema';
    btn.textContent = getTema() === 'light' ? '🌙' : '☀️';
    btn.title = 'Alternar modo claro / escuro';
    btn.style.cssText = [
      'position:fixed',
      'bottom:calc(5rem + env(safe-area-inset-bottom,0px))',
      'right:1rem',
      'width:42px',
      'height:42px',
      'border-radius:50%',
      'border:1px solid rgba(232,184,52,.35)',
      'background:rgba(22,29,48,0.85)',
      'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)',
      'font-size:1.1rem',
      'cursor:pointer',
      'z-index:1000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 2px 12px rgba(0,0,0,.35)',
      'transition:transform .15s,background .2s',
      '-webkit-tap-highlight-color:transparent'
    ].join(';');

    btn.addEventListener('click', function () {
      toggle();
      btn.style.transform = 'scale(0.88)';
      setTimeout(function () { btn.style.transform = ''; }, 150);
    });

    document.body.appendChild(btn);
  });

  // Expõe globalmente
  window._cipgdTheme = { aplicar: aplicar, toggle: toggle, get: getTema };
})();
