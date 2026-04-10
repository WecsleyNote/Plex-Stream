require('dotenv').config();
const express = require('express');
const axios = require('axios');
const plexClient = require('./plex');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// HTML embutido
const CONFIG_HTML = "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>PlexStream \u00b7 Configura\u00e7\u00e3o</title>\n<link href=\"https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--bg:#0a0a0f;--surface:#111118;--surface2:#1a1a24;--border:#2a2a3a;--plex:#e5a00d;--plex-dim:#e5a00d22;--plex-bright:#f5b82e;--text:#e8e8f0;--text-dim:#7a7a9a;--text-muted:#4a4a6a;--green:#2dba4e;--red:#e5534b;--radius:12px}\n*{box-sizing:border-box;margin:0;padding:0}\nbody{background:var(--bg);color:var(--text);font-family:'Syne',sans-serif;min-height:100vh;overflow-x:hidden}\nbody::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -10%,#e5a00d18 0%,transparent 60%),radial-gradient(ellipse 40% 30% at 90% 80%,#7c3aed10 0%,transparent 50%);pointer-events:none;z-index:0}\n.container{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:48px 24px 80px}\n.header{text-align:center;margin-bottom:56px}\n.logo-wrap{display:inline-flex;align-items:center;gap:14px;margin-bottom:16px}\n.logo-icon{width:48px;height:48px;background:var(--plex);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 0 32px #e5a00d55}\n.logo-text{font-size:28px;font-weight:800;letter-spacing:-0.5px}\n.logo-text span{color:var(--plex)}\n.tagline{color:var(--text-dim);font-size:14px;letter-spacing:.05em;text-transform:uppercase;font-weight:600}\n.steps{display:flex;gap:8px;margin-bottom:40px;position:relative}\n.steps::before{content:'';position:absolute;top:18px;left:18px;right:18px;height:2px;background:var(--border)}\n.step{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative}\n.step-dot{width:36px;height:36px;border-radius:50%;border:2px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--text-muted);transition:all .3s;position:relative;z-index:1}\n.step.active .step-dot{border-color:var(--plex);background:var(--plex);color:#000;box-shadow:0 0 20px #e5a00d66}\n.step.done .step-dot{border-color:var(--green);background:var(--green);color:#fff}\n.step-label{font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em;text-align:center}\n.step.active .step-label{color:var(--plex)}\n.step.done .step-label{color:var(--green)}\n.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px;margin-bottom:20px;transition:border-color .3s}\n.card:hover{border-color:#e5a00d40}\n.card-title{font-size:16px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:10px}\n.card-title .icon{width:32px;height:32px;border-radius:8px;background:var(--plex-dim);display:flex;align-items:center;justify-content:center;font-size:15px}\n.card-desc{color:var(--text-dim);font-size:13px;margin-bottom:24px;line-height:1.6;padding-left:42px}\n.field{margin-bottom:16px}\nlabel{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px}\ninput[type=text],input[type=password]{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 16px;color:var(--text);font-family:'DM Mono',monospace;font-size:13px;outline:none;transition:border-color .2s,box-shadow .2s}\ninput:focus{border-color:var(--plex);box-shadow:0 0 0 3px var(--plex-dim)}\ninput::placeholder{color:var(--text-muted)}\n.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:8px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:all .2s;text-decoration:none}\n.btn-primary{background:var(--plex);color:#000;width:100%;justify-content:center;font-size:15px;padding:14px}\n.btn-primary:hover{background:var(--plex-bright);box-shadow:0 4px 24px #e5a00d44;transform:translateY(-1px)}\n.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}\n.btn-outline{background:transparent;color:var(--plex);border:1px solid var(--plex)}\n.btn-outline:hover{background:var(--plex-dim)}\n.alert{padding:12px 16px;border-radius:8px;font-size:13px;display:none;align-items:center;gap:10px;margin-top:16px}\n.alert-error{background:#e5534b18;border:1px solid #e5534b44;color:#f87171}\n.alert-success{background:#2dba4e18;border:1px solid #2dba4e44;color:#4ade80}\n.server-grid{display:grid;gap:10px;margin-top:4px}\n.server-item{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:10px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;transition:all .2s;user-select:none}\n.server-item:hover{border-color:var(--plex)}\n.server-item.selected{border-color:var(--plex);background:var(--plex-dim)}\n.server-name{font-size:14px;font-weight:600;flex:1}\n.server-owner{font-size:12px;color:var(--text-muted)}\n.server-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .2s;flex-shrink:0}\n.server-item.selected .server-check{background:var(--plex);border-color:var(--plex);color:#000}\n.lib-grid{display:grid;gap:10px;margin-top:4px}\n.lib-item{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:10px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;transition:all .2s;user-select:none}\n.lib-item:hover{border-color:var(--plex)}\n.lib-item.selected{border-color:var(--plex);background:var(--plex-dim)}\n.lib-type-badge{padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace;text-transform:uppercase}\n.lib-type-movie{background:#7c3aed22;color:#a78bfa;border:1px solid #7c3aed44}\n.lib-type-show{background:#0369a122;color:#38bdf8;border:1px solid #0369a144}\n.lib-name{font-size:14px;font-weight:600;flex:1}\n.lib-count{font-size:12px;color:var(--text-muted);font-family:'DM Mono',monospace}\n.lib-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .2s;flex-shrink:0}\n.lib-item.selected .lib-check{background:var(--plex);border-color:var(--plex);color:#000}\n.install-box{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px}\n.install-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px}\n.install-url{font-family:'DM Mono',monospace;font-size:12px;color:var(--plex);word-break:break-all;line-height:1.6}\n.copy-row{display:flex;gap:10px;margin-top:12px}\n.btn-copy{flex:1;padding:10px;font-size:13px}\n.spinner{display:inline-block;width:14px;height:14px;border:2px solid #00000033;border-top-color:#000;border-radius:50%;animation:spin .6s linear infinite}\n@keyframes spin{to{transform:rotate(360deg)}}\n.section{display:none}\n.section.active{display:block}\n@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}\n.fade-in{animation:fadeUp .4s ease both}\n.footer{text-align:center;margin-top:48px;color:var(--text-muted);font-size:12px}\n.divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--text-muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em}\n.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border)}\n</style>\n</head>\n<body>\n<div class=\"container\">\n  <div class=\"header fade-in\">\n    <div class=\"logo-wrap\">\n      <div class=\"logo-icon\">\ud83c\udfac</div>\n      <div class=\"logo-text\">Plex<span>Stream</span></div>\n    </div>\n    <p class=\"tagline\">Stremio Add-on \u00b7 Configura\u00e7\u00e3o</p>\n  </div>\n\n  <div class=\"steps fade-in\" id=\"steps\">\n    <div class=\"step active\" id=\"step1\"><div class=\"step-dot\">1</div><div class=\"step-label\">Login</div></div>\n    <div class=\"step\" id=\"step2\"><div class=\"step-dot\">2</div><div class=\"step-label\">Servidor</div></div>\n    <div class=\"step\" id=\"step3\"><div class=\"step-dot\">3</div><div class=\"step-label\">Instalar</div></div>\n  </div>\n\n  <!-- Passo 1: Login Plex -->\n  <div class=\"section active fade-in\" id=\"sec1\">\n    <div class=\"card\">\n      <div class=\"card-title\"><div class=\"icon\">\ud83d\udd11</div>Login com sua conta Plex</div>\n      <p class=\"card-desc\">Entre com seu usu\u00e1rio e senha do Plex. Suas credenciais s\u00e3o usadas apenas para obter o token de acesso e nunca s\u00e3o armazenadas.</p>\n      <div class=\"field\">\n        <label>E-mail ou usu\u00e1rio Plex</label>\n        <input type=\"text\" id=\"plexUser\" placeholder=\"seu@email.com\" />\n      </div>\n      <div class=\"field\">\n        <label>Senha</label>\n        <input type=\"password\" id=\"plexPass\" placeholder=\"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\" />\n      </div>\n      <button class=\"btn btn-primary\" id=\"btnLogin\" onclick=\"doLogin()\">Entrar no Plex</button>\n      <div class=\"alert alert-error\" id=\"errLogin\"></div>\n    </div>\n  </div>\n\n  <!-- Passo 2: Escolher servidor -->\n  <div class=\"section fade-in\" id=\"sec2\">\n    <div class=\"card\">\n      <div class=\"card-title\"><div class=\"icon\">\ud83d\udda5\ufe0f</div>Selecionar Servidor</div>\n      <p class=\"card-desc\">Escolha o servidor Plex que cont\u00e9m sua biblioteca.</p>\n      <div class=\"server-grid\" id=\"serverGrid\"></div>\n      <div id=\"libSection\" style=\"display:none;margin-top:24px;\">\n        <div class=\"card-title\" style=\"margin-bottom:6px;\"><div class=\"icon\">\ud83d\udcda</div>Bibliotecas (opcional)</div>\n        <p style=\"color:var(--text-dim);font-size:13px;margin-bottom:16px;padding-left:42px;\">Selecione quais bibliotecas aparecem como cat\u00e1logo no Stremio. Se n\u00e3o selecionar nenhuma, funciona s\u00f3 com streams via IMDB.</p>\n        <div class=\"lib-grid\" id=\"libGrid\"></div>\n      </div>\n      <div style=\"margin-top:24px;\">\n        <button class=\"btn btn-primary\" onclick=\"goToInstall()\">Continuar \u2192</button>\n      </div>\n    </div>\n  </div>\n\n  <!-- Passo 3: Instalar -->\n  <div class=\"section fade-in\" id=\"sec3\">\n    <div class=\"card\">\n      <div class=\"card-title\"><div class=\"icon\">\ud83d\ude80</div>Instalar no Stremio</div>\n      <p class=\"card-desc\">Copie a URL abaixo e cole em <strong>Stremio \u2192 Add-ons \u2192 instalar via URL</strong>, ou clique em \"Abrir no Stremio\".</p>\n      <div class=\"install-box\">\n        <div class=\"install-label\">URL do Add-on</div>\n        <div class=\"install-url\" id=\"installUrl\">\u2014</div>\n        <div class=\"copy-row\">\n          <button class=\"btn btn-outline btn-copy\" onclick=\"copyUrl()\">\ud83d\udccb Copiar</button>\n          <button class=\"btn btn-primary btn-copy\" onclick=\"openStremio()\">\u25b6 Abrir no Stremio</button>\n        </div>\n      </div>\n      <div class=\"alert alert-success\" id=\"successCopy\">\u2705 Copiado! Cole no Stremio em Add-ons \u2192 instalar via URL.</div>\n    </div>\n    <div class=\"card\">\n      <div class=\"card-title\"><div class=\"icon\">\ud83d\udcca</div>Formato das streams</div>\n      <div style=\"background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;font-family:'DM Mono',monospace;font-size:12px;line-height:2;\">\n        <div style=\"color:var(--plex);font-weight:700\">\ud83d\udd25 Plex</div>\n        <div style=\"color:var(--text-dim)\">\ud83d\udd25 4K UHD \u00b7 HEVC HDR10</div>\n        <div style=\"color:var(--text-dim)\">\ud83c\udfb5 TrueHD \u2605 Atmos \ud83d\udd0a 7.1</div>\n        <div style=\"color:var(--text-dim)\">21.70 GB \ud83d\udcf6 21700 kbps</div>\n        <div style=\"color:var(--text-dim)\">\ud83c\udfac Plex Direct</div>\n      </div>\n    </div>\n    <button class=\"btn btn-outline\" style=\"width:100%;justify-content:center;\" onclick=\"restart()\">\u2190 Reconfigurar</button>\n  </div>\n\n  <div class=\"footer\">PlexStream Add-on \u00b7 N\u00e3o afiliado ao Plex ou Stremio</div>\n</div>\n<script>\n  let _token = '', _plexUrl = '', _selectedLibs = [], _allLibs = [], _selectedServer = null;\n\n  function setStep(n) {\n    [1,2,3].forEach(i => {\n      const s = document.getElementById('step'+i);\n      s.className = 'step'+(i<n?' done':i===n?' active':'');\n      s.querySelector('.step-dot').textContent = i<n?'\u2713':i;\n      document.getElementById('sec'+i).className = 'section fade-in'+(i===n?' active':'');\n    });\n  }\n\n  async function doLogin() {\n    const user = document.getElementById('plexUser').value.trim();\n    const pass = document.getElementById('plexPass').value.trim();\n    const btn = document.getElementById('btnLogin');\n    const err = document.getElementById('errLogin');\n    err.style.display = 'none';\n    if (!user || !pass) { showAlert(err,'Preencha usu\u00e1rio e senha.'); return; }\n    btn.disabled = true;\n    btn.innerHTML = '<span class=\"spinner\"></span> Autenticando...';\n    try {\n      const r = await fetch('/api/plex-login', {\n        method:'POST', headers:{'Content-Type':'application/json'},\n        body: JSON.stringify({username:user, password:pass})\n      });\n      const d = await r.json();\n      if (!r.ok) throw new Error(d.error||'Erro desconhecido');\n      _token = d.token;\n      renderServers(d.servers);\n      setStep(2);\n    } catch(e) { showAlert(err,'\u274c '+e.message); }\n    finally { btn.disabled=false; btn.innerHTML='Entrar no Plex'; }\n  }\n\n  function renderServers(servers) {\n    const grid = document.getElementById('serverGrid');\n    grid.innerHTML = '';\n    servers.forEach(srv => {\n      const el = document.createElement('div');\n      el.className = 'server-item';\n      el.innerHTML = `<div class=\"server-check\"></div><div><div class=\"server-name\">${srv.name}</div><div class=\"server-owner\">${srv.owned?'Seu servidor':'Compartilhado'} \u00b7 ${srv.url}</div></div>`;\n      el.onclick = () => selectServer(el, srv, servers);\n      grid.appendChild(el);\n    });\n    if (servers.length === 1) {\n      grid.firstChild.click();\n    }\n  }\n\n  async function selectServer(el, srv, allSrvs) {\n    document.querySelectorAll('.server-item').forEach(e => { e.classList.remove('selected'); e.querySelector('.server-check').textContent=''; });\n    el.classList.add('selected');\n    el.querySelector('.server-check').textContent = '\u2713';\n    _selectedServer = srv;\n    _plexUrl = srv.url;\n    try {\n      const r = await fetch('/api/plex-libraries', {\n        method:'POST', headers:{'Content-Type':'application/json'},\n        body: JSON.stringify({token:_token, plexUrl:srv.url})\n      });\n      const d = await r.json();\n      _allLibs = d.libraries || [];\n      _selectedLibs = [..._allLibs];\n      renderLibs(_allLibs);\n      document.getElementById('libSection').style.display = 'block';\n    } catch(e) { console.error(e); }\n  }\n\n  function renderLibs(libs) {\n    const grid = document.getElementById('libGrid');\n    grid.innerHTML = '';\n    libs.forEach(lib => {\n      const el = document.createElement('div');\n      el.className = 'lib-item selected';\n      el.innerHTML = `<div class=\"lib-check\">\u2713</div><span class=\"lib-type-badge lib-type-${lib.type}\">${lib.type==='movie'?'\ud83c\udfac Filme':'\ud83d\udcfa S\u00e9rie'}</span><span class=\"lib-name\">${lib.title}</span><span class=\"lib-count\">${lib.count||'?'} itens</span>`;\n      el.onclick = () => toggleLib(el, lib);\n      grid.appendChild(el);\n    });\n  }\n\n  function toggleLib(el, lib) {\n    const idx = _selectedLibs.findIndex(l => l.key===lib.key);\n    if (idx>=0) { _selectedLibs.splice(idx,1); el.classList.remove('selected'); el.querySelector('.lib-check').textContent=''; }\n    else { _selectedLibs.push(lib); el.classList.add('selected'); el.querySelector('.lib-check').textContent='\u2713'; }\n  }\n\n  function goToInstall() {\n    if (!_selectedServer) { alert('Selecione um servidor primeiro.'); return; }\n    const config = { plexUrl: _plexUrl, plexToken: _token, libraries: _selectedLibs };\n    const encoded = btoa(JSON.stringify(config)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');\n    const url = window.location.origin+'/'+encoded+'/manifest.json';\n    document.getElementById('installUrl').textContent = url;\n    document.getElementById('successCopy').style.display = 'none';\n    window._manifestUrl = url;\n    setStep(3);\n  }\n\n  async function copyUrl() {\n    try { await navigator.clipboard.writeText(window._manifestUrl); document.getElementById('successCopy').style.display='flex'; }\n    catch { prompt('Copie:', window._manifestUrl); }\n  }\n\n  function openStremio() {\n    window.location.href = window._manifestUrl.replace('https://','stremio://').replace('http://','stremio://');\n  }\n\n  function restart() {\n    _token=''; _plexUrl=''; _selectedLibs=[]; _selectedServer=null;\n    document.getElementById('plexUser').value='';\n    document.getElementById('plexPass').value='';\n    setStep(1);\n  }\n\n  function showAlert(el, msg) { el.textContent=msg; el.style.display='flex'; }\n\n  document.addEventListener('keydown', e => {\n    if (e.key==='Enter' && document.getElementById('sec1').classList.contains('active')) doLogin();\n  });\n</script>\n</body>\n</html>";

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(CONFIG_HTML);
});

// ── API: Login com usuario/senha Plex ─────────────────────────────────────────
app.post('/api/plex-login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  try {
    // Autentica na API do Plex
    const authRes = await axios.post('https://plex.tv/users/sign_in.json', {
      'user[login]': username,
      'user[password]': password,
    }, {
      headers: {
        'X-Plex-Client-Identifier': 'plex-stremio-addon',
        'X-Plex-Product': 'PlexStream Stremio Add-on',
        'X-Plex-Version': '2.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const user = authRes.data.user;
    const token = user.authToken;

    // Busca servidores disponíveis
    const resourcesRes = await axios.get('https://plex.tv/api/v2/resources?includeHttps=1&includeRelay=1', {
      headers: {
        'X-Plex-Token': token,
        'X-Plex-Client-Identifier': 'plex-stremio-addon',
        'Accept': 'application/json',
      },
    });

    const servers = resourcesRes.data
      .filter(r => r.provides === 'server')
      .map(r => {
        // Prefere conexão HTTPS remota, senão pega a primeira disponível
        const conns = r.connections || [];
        const remote = conns.find(c => c.relay === false && c.local === false) || conns[0];
        return {
          name: r.name,
          owned: r.owned,
          url: remote ? remote.uri : null,
          accessToken: r.accessToken || token,
        };
      })
      .filter(s => s.url);

    return res.json({ token, servers });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    return res.status(500).json({ error: 'Falha ao autenticar: ' + err.message });
  }
});

// ── API: Bibliotecas do servidor selecionado ──────────────────────────────────
app.post('/api/plex-libraries', async (req, res) => {
  const { token, plexUrl } = req.body;
  if (!token || !plexUrl) return res.status(400).json({ error: 'token e plexUrl obrigatórios' });
  try {
    const plex = plexClient(plexUrl, token);
    const libs = await plex.getLibraries();
    const relevant = libs
      .filter(l => ['movie', 'show'].includes(l.type))
      .map(l => ({ key: l.key, title: l.title, type: l.type, count: l.count }));
    return res.json({ libraries: relevant });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Config decode ─────────────────────────────────────────────────────────────
function decodeConfig(encoded) {
  try { return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); }
  catch { return null; }
}

// ── Manifesto ─────────────────────────────────────────────────────────────────
app.get('/:config/manifest.json', (req, res) => {
  const config = decodeConfig(req.params.config);
  if (!config) return res.status(400).json({ error: 'Configuração inválida' });

  const catalogs = (config.libraries || []).map(lib => ({
    type: lib.type === 'movie' ? 'movie' : 'series',
    id: 'plex-lib-' + lib.key,
    name: '📦 ' + lib.title,
    extra: [{ name: 'search', isRequired: false }],
  }));

  const resources = ['stream'];
  if (catalogs.length > 0) resources.push('catalog');

  res.json({
    id: 'com.plexstream.stremio',
    version: '2.0.0',
    name: 'Plex Stream',
    description: 'Streams diretos da sua biblioteca Plex',
    logo: 'https://www.plex.tv/wp-content/uploads/2018/01/plex-icon-large-2x.png',
    resources, types: ['movie', 'series'], catalogs,
    idPrefixes: ['tt'],
    behaviorHints: { adult: false, p2p: false },
  });
});

// ── Catalog ───────────────────────────────────────────────────────────────────
app.get('/:config/catalog/:type/:id/:extra?.json', async (req, res) => {
  const config = decodeConfig(req.params.config);
  if (!config) return res.json({ metas: [] });
  const { type, id } = req.params;
  const extraStr = req.params.extra || '';
  const search = extraStr.startsWith('search=') ? decodeURIComponent(extraStr.replace('search=', '')) : null;
  const sectionKey = id.replace('plex-lib-', '');
  try {
    const headers = { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' };
    const endpoint = search
      ? `${config.plexUrl}/library/sections/${sectionKey}/search`
      : `${config.plexUrl}/library/sections/${sectionKey}/all`;
    const params = search
      ? { query: search, limit: 30 }
      : { 'X-Plex-Container-Start': 0, 'X-Plex-Container-Size': 100 };
    const r = await axios.get(endpoint, { headers, params });
    const items = r.data.MediaContainer.Metadata || [];
    const stremioType = type === 'series' ? 'series' : 'movie';
    return res.json({ metas: items.map(item => ({
      id: 'plex:' + item.ratingKey, type: stremioType,
      name: item.title,
      poster: item.thumb ? `${config.plexUrl}${item.thumb}?X-Plex-Token=${config.plexToken}` : null,
      year: item.year, description: item.summary || '',
    }))});
  } catch (err) {
    return res.json({ metas: [] });
  }
});

// ── Stream ────────────────────────────────────────────────────────────────────
app.get('/:config/stream/:type/:id.json', async (req, res) => {
  const config = decodeConfig(req.params.config);
  if (!config) return res.json({ streams: [] });
  const { type, id } = req.params;
  const plex = plexClient(config.plexUrl, config.plexToken);
  try {
    let item = null;
    if (type === 'movie' && id.startsWith('tt')) {
      const found = await plex.findByImdbId(id);
      if (found) item = await plex.getItemDetails(found.item.ratingKey);
    } else if (type === 'series') {
      const [imdbId, season, episode] = id.split(':');
      if (imdbId.startsWith('tt')) {
        const found = await plex.findByImdbId(imdbId);
        if (found) {
          const ep = await plex.findEpisode(found.item.ratingKey, parseInt(season), parseInt(episode));
          if (ep) item = await plex.getItemDetails(ep.ratingKey);
        }
      }
    }
    if (!item) return res.json({ streams: [] });
    return res.json({ streams: plex.buildStreams(item, config.plexUrl, config.plexToken) });
  } catch (err) {
    console.error('[STREAM ERROR]', err.message);
    return res.json({ streams: [] });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log('PlexStream rodando em http://localhost:' + PORT));
