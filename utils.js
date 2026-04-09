// ═══════════════════════════════════════════════════════════════════════════
// CIPGd-FSA — Utilitários compartilhados
// Carregado por: checklist-4rodas, checklist-2rodas, descarga-4rodas, descarga-2rodas
// Requer: config.js carregado antes
// ═══════════════════════════════════════════════════════════════════════════

// ── DETECÇÃO DE DISPOSITIVO ──────────────────────────────────────────────────
var isIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// ── STATUS ───────────────────────────────────────────────────────────────────
// Valores considerados OK para checklist de 4 Rodas
var OK_VALS_4R = ['OK', 'Cheio', '3/4', '2/4', '1/4'];
// Valores considerados OK para checklist de 2 Rodas (inclui Sem Vazamento)
var OK_VALS_2R = ['OK', 'Sem Vazamento', 'Cheio', '3/4', '2/4', '1/4'];

// Retorna ✅ valor ou ❌ valor conforme a lista de OK fornecida
function st(v, okVals) {
  okVals = okVals || OK_VALS_4R;
  return okVals.indexOf(v) >= 0 ? '✅ ' + v : '❌ ' + v;
}
function st4R(v) { return st(v, OK_VALS_4R); }
function st2R(v) { return st(v, OK_VALS_2R); }

// ── WHATSAPP ─────────────────────────────────────────────────────────────────
var WA_SEP = '━━━━━━━━━━━━━━━━━━━━';

// Monta linha de identificação do militar (reutilizada em carga e descarga)
function waMilitar(grad, nome, cadastro) {
  return '👤 Mot: ' + grad + ' *' + (nome || '').trim() + '*' +
         (cadastro ? '  Mat: *' + (cadastro || '').trim() + '*' : '');
}

// Monta bloco de observações (só adiciona se tiver conteúdo)
function waObs(obs) {
  var L = [];
  if (obs && obs.trim()) {
    L.push('');
    L.push('📝 *OBS:*');
    obs.trim().split('\n').forEach(function(l) { if (l.trim()) L.push('. ' + l.trim()); });
  }
  return L;
}

// Monta mensagem completa de CARGA 4 Rodas
function waMensagemCarga4R(d) {
  var L = [];
  L.push(WA_SEP);
  L.push('🚓 *CHECKLIST 4 RODAS*');
  L.push('       *CIPGd-FSA*');
  L.push(WA_SEP); L.push('');
  L.push('📅 ' + d.DataHora);
  L.push(waMilitar(d.Graduacao, d.Nome, d.Cadastro));
  L.push('🧑‍✈️ Cmt: ' + d.Comandante);
  L.push('📍 Viatura: *' + d.Prefixo + '*');
  L.push('📊 Km Inicial: ' + d.Km_inicial); L.push('');
  L.push('┌─ 🛢️ *FLUIDOS*');
  L.push('├ Óleo: '        + st4R(d.Oleo));
  L.push('├ Água: '        + st4R(d.Agua));
  L.push('├ Combustível: ' + st4R(d.Combustivel));
  L.push('└ Freio: '       + st4R(d.Freio)); L.push('');
  L.push('┌─ 🔧 *ESTRUTURA*');
  L.push('├ Chaparia: '       + st4R(d.Chaparia));
  L.push('├ Plotagem: '       + st4R(d.Plotagem));
  L.push('├ Faróis e Setas: ' + st4R(d.Farois));
  L.push('├ Giroflex: '       + st4R(d.Giroflex));
  L.push('├ Estofados: '      + st4R(d.Estofados));
  L.push('├ Chave e Macaco: ' + st4R(d.Ferramentas));
  L.push('└ Pneus/Estepe: '   + st4R(d.Pneus));
  waObs(d.Observacoes).forEach(function(l) { L.push(l); });
  L.push(''); L.push(WA_SEP);
  return L.join('\n');
}

// Monta mensagem completa de CARGA 2 Rodas
function waMensagemCarga2R(d) {
  var L = [];
  L.push(WA_SEP);
  L.push('🏍️ *CHECKLIST 2 RODAS*');
  L.push('       *CIPGd-FSA*');
  L.push(WA_SEP); L.push('');
  L.push('📅 ' + d.DataHora);
  L.push(waMilitar(d.Graduacao, d.Nome, d.Cadastro));
  L.push('🧑‍✈️ Cmt: ' + d.Comandante);
  L.push('📍 Viatura: *' + d.Prefixo + '*');
  L.push('📊 Km Inicial: ' + d.KmInicial); L.push('');
  L.push('┌─ 🛢️ *FLUIDOS*');
  L.push('├ Óleo: '        + st2R(d.NivelOleo));
  L.push('├ Vazamento: '   + st2R(d.VazamentoOleo));
  L.push('├ Combustível: ' + st2R(d.NivelCombustivel));
  L.push('└ Freio: '       + st2R(d.FluidoFreio)); L.push('');
  L.push('┌─ 🔧 *ESTRUTURA*');
  L.push('├ Pintura/Plot.: '  + st2R(d.PinturaPlotagem));
  L.push('├ Faróis e Setas: ' + st2R(d.FaroisSetas));
  L.push('├ Giroflex: '       + st2R(d.Giroflex));
  L.push('├ Estofados: '      + st2R(d.Estofados));
  L.push('├ Jante: '          + st2R(d.Jante));
  L.push('└ Pneus: '          + st2R(d.Pneus));
  waObs(d.Observacoes).forEach(function(l) { L.push(l); });
  L.push(''); L.push(WA_SEP);
  return L.join('\n');
}

// Monta mensagem completa de DESCARGA 4 Rodas
function waMensagemDescarga4R(carga, dataDesc, kmFinal) {
  var kmRod = parseInt(kmFinal) - parseInt(carga.Km_inicial || 0);
  var L = [];
  L.push(WA_SEP);
  L.push('🔑 *DESCARGA 4 RODAS*');
  L.push('       *CIPGd-FSA*');
  L.push(WA_SEP); L.push('');
  L.push('📅 Carga:    ' + carga.DataHora);
  L.push('📅 Descarga: ' + dataDesc);
  L.push(waMilitar(carga.Graduacao, carga.Nome, carga.Cadastro));
  L.push('🧑‍✈️ Cmt: ' + carga.Comandante);
  L.push('📍 Viatura: *' + carga.Prefixo + '*'); L.push('');
  L.push('📊 Km Inicial:  ' + carga.Km_inicial);
  L.push('📊 Km Final:    *' + kmFinal + '*');
  L.push('🛣️ Km Rodados:  *' + (kmRod >= 0 ? kmRod : '—') + ' km*'); L.push('');
  L.push('┌─ 🛢️ *FLUIDOS (na carga)*');
  L.push('├ Óleo: '        + st4R(carga.Oleo));
  L.push('├ Água: '        + st4R(carga.Agua));
  L.push('├ Combustível: ' + st4R(carga.Combustivel));
  L.push('└ Freio: '       + st4R(carga.Freio)); L.push('');
  L.push('┌─ 🔧 *ESTRUTURA (na carga)*');
  L.push('├ Chaparia: '       + st4R(carga.Chaparia));
  L.push('├ Plotagem: '       + st4R(carga.Plotagem));
  L.push('├ Faróis e Setas: ' + st4R(carga.Farois));
  L.push('├ Giroflex: '       + st4R(carga.Giroflex));
  L.push('├ Estofados: '      + st4R(carga.Estofados));
  L.push('├ Chave e Macaco: ' + st4R(carga.Ferramentas));
  L.push('└ Pneus/Estepe: '   + st4R(carga.Pneus));
  waObs(carga.Observacoes).forEach(function(l) { L.push(l); });
  L.push(''); L.push(WA_SEP);
  return L.join('\n');
}

// Monta mensagem completa de DESCARGA 2 Rodas
function waMensagemDescarga2R(carga, dataDesc, kmFinal) {
  var kmRod = parseInt(kmFinal) - parseInt(carga.KmInicial || 0);
  var L = [];
  L.push(WA_SEP);
  L.push('🔑 *DESCARGA 2 RODAS*');
  L.push('       *CIPGd-FSA*');
  L.push(WA_SEP); L.push('');
  L.push('📅 Carga:    ' + carga.DataHora);
  L.push('📅 Descarga: ' + dataDesc);
  L.push(waMilitar(carga.Graduacao, carga.Nome, carga.Cadastro));
  L.push('🧑‍✈️ Cmt: ' + carga.Comandante);
  L.push('📍 Viatura: *' + carga.Prefixo + '*'); L.push('');
  L.push('📊 Km Inicial:  ' + carga.KmInicial);
  L.push('📊 Km Final:    *' + kmFinal + '*');
  L.push('🛣️ Km Rodados:  *' + (kmRod >= 0 ? kmRod : '—') + ' km*'); L.push('');
  L.push('┌─ 🛢️ *FLUIDOS (na carga)*');
  L.push('├ Óleo: '        + st2R(carga.NivelOleo));
  L.push('├ Vazamento: '   + st2R(carga.VazamentoOleo));
  L.push('├ Combustível: ' + st2R(carga.NivelCombustivel));
  L.push('└ Freio: '       + st2R(carga.FluidoFreio)); L.push('');
  L.push('┌─ 🔧 *ESTRUTURA (na carga)*');
  L.push('├ Pintura/Plot.: '  + st2R(carga.PinturaPlotagem));
  L.push('├ Faróis e Setas: ' + st2R(carga.FaroisSetas));
  L.push('├ Giroflex: '       + st2R(carga.Giroflex));
  L.push('├ Estofados: '      + st2R(carga.Estofados));
  L.push('├ Jante: '          + st2R(carga.Jante));
  L.push('└ Pneus: '          + st2R(carga.Pneus));
  waObs(carga.Observacoes).forEach(function(l) { L.push(l); });
  L.push(''); L.push(WA_SEP);
  return L.join('\n');
}

// Abre o WhatsApp e redireciona para index após envio
// Comportamento unificado para iPhone e Android
function abrirWhatsApp(mensagem) {
  var url = 'https://wa.me/?text=' + encodeURIComponent(mensagem);
  if (isIphone) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
    setTimeout(function() { window.location.replace('./index.html'); }, 1200);
  }
}

// ── AUTOPREENCHIMENTO ────────────────────────────────────────────────────────
function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch(e) { return {}; }
}
function saveStore(key, s) {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch(e) {}
}
function addToList(store, field, val) {
  val = (val || '').trim(); if (!val) return;
  if (!store[field]) store[field] = [];
  var i = store[field].indexOf(val); if (i > -1) store[field].splice(i, 1);
  store[field].unshift(val);
  if (store[field].length > 10) store[field] = store[field].slice(0, 10);
}
function fillDatalist(id, items) {
  var dl = document.getElementById('list-' + id); if (!dl || !items) return;
  dl.innerHTML = '';
  items.forEach(function(v) {
    var o = document.createElement('option'); o.value = v; dl.appendChild(o);
  });
}
function restoreField(id, val) {
  var el = document.getElementById(id); if (el && val) el.value = val;
}

// ── VALIDAÇÃO ────────────────────────────────────────────────────────────────
function mostrarErro(id, msg) {
  var el = document.getElementById(id); if (!el) return;
  el.style.outline   = '2px solid #ef4444';
  el.style.boxShadow = '0 0 0 3px rgba(239,68,68,.25)';
  var err = document.getElementById('err_' + id);
  if (!err) {
    err = document.createElement('span');
    err.id = 'err_' + id;
    err.style.cssText = 'color:#ef4444;font-size:.72rem;margin-top:.2rem;display:block;';
    el.parentNode.appendChild(err);
  }
  err.textContent = msg;
  function limpar() {
    el.style.outline = ''; el.style.boxShadow = '';
    if (err) err.textContent = '';
    el.removeEventListener('input',  limpar);
    el.removeEventListener('change', limpar);
  }
  el.addEventListener('input',  limpar, { once: true });
  el.addEventListener('change', limpar, { once: true });
}

// ── STATUS BADGE (descarga) ───────────────────────────────────────────────────
function setBadge(id, val, okVals) {
  var el = document.getElementById(id); if (!el) return;
  okVals = okVals || OK_VALS_4R;
  var isOk = okVals.indexOf(val) >= 0;
  el.className = 'status-badge ' + (isOk ? 'ok' : 'bad');
  el.textContent = (isOk ? '✔ ' : '✘ ') + (val || '—');
}
function setVal(id, val) {
  var el = document.getElementById(id); if (el) el.textContent = val || '—';
}
