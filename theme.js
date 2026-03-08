// ── TEMA CLARO / ESCURO — CIPGd-FSA v1.7 ────────────────────────────────────
// O tema é salvo em localStorage e sincronizado entre todas as abas via
// StorageEvent — trocar o tema em qualquer página atualiza todas as outras.
(function () {
  var KEY = 'cipgd_theme';

  var DARK = {
    '--navy':       '#0a0f1e',
    '--panel':      '#161d30',
    '--border':     '#1f2d47',
    '--text':       '#e2e8f0',
    '--muted':      '#6b7a99',
    '--input-bg':   '#0d1424',
    '--topbar-bg':  'rgba(10,15,30,0.92)',
    '--grid-line':  'rgba(232,184,52,0.04)',
    '--sec-header': 'rgba(232,184,52,0.06)',
    '--topbar-name':'#ffffff',
    '--btn-back-bg':'rgba(232,184,52,0.10)',
    '--chip-bg':    'rgba(232,184,52,0.10)',
  };

  var LIGHT = {
    '--navy':       '#1e2a3a',
    '--panel':      '#253347',
    '--border':     '#304560',
    '--text':       '#d4e0f0',
    '--muted':      '#8aa0bb',
    '--input-bg':   'rgba(25,37,51,0.5)',
    '--topbar-bg':  'rgba(18,24,36,0.95)',
    '--grid-line':  'rgba(232,184,52,0.06)',
    '--sec-header': 'rgba(232,184,52,0.08)',
    '--topbar-name':'#f0f6ff',
    '--btn-back-bg':'rgba(232,184,52,0.12)',
    '--chip-bg':    'rgba(232,184,52,0.12)',
  };

  function aplicar(tema) {
    var vars = tema === 'light' ? LIGHT : DARK;
    var root = document.documentElement;
    for (var k in vars) root.style.setProperty(k, vars[k]);
    var btn = document.getElementById('_btn_tema');
    if (btn) btn.textContent = tema === 'light' ? '🌙' : '☀️';
    try { localStorage.setItem(KEY, tema); } catch (e) {}
  }

  function getTema() {
    try {
      var s = localStorage.getItem(KEY);
      if (s === 'light' || s === 'dark') return s;
    } catch (e) {}
    return 'dark';
  }

  function toggle() {
    var novo = getTema() === 'dark' ? 'light' : 'dark';
    aplicar(novo);
    // Dispara evento para sincronizar outras abas abertas
    try {
      // Força disparo do StorageEvent mesmo na aba atual usando uma chave auxiliar
      localStorage.setItem('cipgd_theme_sync', Date.now().toString());
    } catch(e) {}
  }

  // Sincroniza quando outra aba/página muda o tema
  window.addEventListener('storage', function(e) {
    if (e.key === KEY || e.key === 'cipgd_theme_sync') {
      aplicar(getTema());
    }
  });

  // Aplica IMEDIATAMENTE antes de renderizar (evita flash)
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
      'width:42px','height:42px',
      'border-radius:50%',
      'border:1px solid rgba(232,184,52,.35)',
      'background:rgba(22,29,48,0.88)',
      'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)',
      'font-size:1.1rem',
      'cursor:pointer',
      'z-index:1000',
      'display:flex','align-items:center','justify-content:center',
      'box-shadow:0 2px 12px rgba(0,0,0,.4)',
      'transition:transform .15s',
      '-webkit-tap-highlight-color:transparent'
    ].join(';');

    btn.addEventListener('click', function () {
      toggle();
      btn.style.transform = 'scale(0.85)';
      setTimeout(function () { btn.style.transform = ''; }, 140);
    });

    document.body.appendChild(btn);
  });

  window._cipgdTheme = { aplicar: aplicar, toggle: toggle, get: getTema };
})();
