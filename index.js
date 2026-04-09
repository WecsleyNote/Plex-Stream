require('dotenv').config();

const express = require('express');
const path = require('path');
const plexClient = require('./plex');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos (página de configuração)
app.use(express.static(path.join(__dirname, 'public')));

// ── CORS para o Stremio ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// ── Página de configuração ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── API: testa conexão com Plex e retorna bibliotecas ─────────────────────────
app.post('/api/test-plex', async (req, res) => {
  const { plexUrl, plexToken } = req.body;
  if (!plexUrl || !plexToken) {
    return res.status(400).json({ error: 'plexUrl e plexToken são obrigatórios' });
  }

  try {
    const plex = plexClient(plexUrl, plexToken);
    const libraries = await plex.getLibraries();
    const relevant = libraries
      .filter(l => ['movie', 'show'].includes(l.type))
      .map(l => ({ key: l.key, title: l.title, type: l.type, count: l.count }));
    return res.json({ ok: true, libraries: relevant });
  } catch (err) {
    return res.status(500).json({ error: `Falha ao conectar: ${err.message}` });
  }
});

// ── Encoder/Decoder de configuração (base64 simples) ─────────────────────────
function encodeConfig(config) {
  return Buffer.from(JSON.stringify(config)).toString('base64url');
}

function decodeConfig(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ── Manifesto dinâmico por configuração ──────────────────────────────────────
app.get('/:config/manifest.json', (req, res) => {
  const config = decodeConfig(req.params.config);
  if (!config) return res.status(400).json({ error: 'Configuração inválida' });

  const catalogs = [];

  if (config.libraries) {
    for (const lib of config.libraries) {
      if (lib.type === 'movie') {
        catalogs.push({
          type: 'movie',
          id: `plex-movie-${lib.key}`,
          name: `📦 ${lib.title}`,
          extra: [{ name: 'search', isRequired: false }],
        });
      } else if (lib.type === 'show') {
        catalogs.push({
          type: 'series',
          id: `plex-show-${lib.key}`,
          name: `📦 ${lib.title}`,
          extra: [{ name: 'search', isRequired: false }],
        });
      }
    }
  }

  const resources = ['stream'];
  if (catalogs.length > 0) resources.push('catalog');

  res.json({
    id: 'com.plexstream.stremio',
    version: '2.0.0',
    name: 'Plex Stream',
    description: 'Streams diretos da sua biblioteca Plex',
    logo: 'https://www.plex.tv/wp-content/uploads/2018/01/plex-icon-large-2x.png',
    resources,
    types: ['movie', 'series'],
    catalogs,
    idPrefixes: ['tt'],
    behaviorHints: { adult: false, p2p: false },
  });
});

// ── Catalog Handler ───────────────────────────────────────────────────────────
app.get('/:config/catalog/:type/:id/:extra?.json', async (req, res) => {
  const config = decodeConfig(req.params.config);
  if (!config) return res.status(400).json({ metas: [] });

  const { type, id } = req.params;
  const extraStr = req.params.extra || '';
  const search = extraStr.startsWith('search=') ? decodeURIComponent(extraStr.replace('search=', '')) : null;

  // Extrai a key da biblioteca do ID do catálogo (plex-movie-3 → 3)
  const sectionKey = id.replace('plex-movie-', '').replace('plex-show-', '');
  const plex = plexClient(config.plexUrl, config.plexToken);

  try {
    let items = [];

    if (search) {
      const axios = require('axios');
      const r = await axios.get(`${config.plexUrl}/library/sections/${sectionKey}/search`, {
        headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' },
        params: { query: search, limit: 30 },
      });
      items = r.data.MediaContainer.Metadata || [];
    } else {
      const axios = require('axios');
      const r = await axios.get(`${config.plexUrl}/library/sections/${sectionKey}/all`, {
        headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' },
        params: { 'X-Plex-Container-Start': 0, 'X-Plex-Container-Size': 100 },
      });
      items = r.data.MediaContainer.Metadata || [];
    }

    const stremioType = type === 'series' ? 'series' : 'movie';
    const metas = items.map(item => ({
      id: `plex:${item.ratingKey}`,
      type: stremioType,
      name: item.title,
      poster: item.thumb ? `${config.plexUrl}${item.thumb}?X-Plex-Token=${config.plexToken}` : null,
      year: item.year,
      description: item.summary || '',
    }));

    return res.json({ metas });
  } catch (err) {
    console.error('[CATALOG ERROR]', err.message);
    return res.json({ metas: [] });
  }
});

// ── Stream Handler ────────────────────────────────────────────────────────────
app.get('/:config/stream/:type/:id.json', async (req, res) => {
  const config = decodeConfig(req.params.config);
  if (!config) return res.status(400).json({ streams: [] });

  const { type, id } = req.params;
  console.log(`[STREAM] type=${type} id=${id}`);

  const plex = plexClient(config.plexUrl, config.plexToken);

  try {
    let item = null;

    if (type === 'movie') {
      // id = "tt1234567"
      if (id.startsWith('tt')) {
        const found = await plex.findByImdbId(id);
        if (found) item = await plex.getItemDetails(found.item.ratingKey);
      }
    } else if (type === 'series') {
      // id = "tt1234567:1:2"
      const parts = id.split(':');
      const imdbId = parts[0];
      const season = parseInt(parts[1]);
      const episode = parseInt(parts[2]);

      if (imdbId.startsWith('tt')) {
        const found = await plex.findByImdbId(imdbId);
        if (found) {
          const ep = await plex.findEpisode(found.item.ratingKey, season, episode);
          if (ep) item = await plex.getItemDetails(ep.ratingKey);
        }
      }
    }

    if (!item) {
      console.log(`[STREAM] Não encontrado: ${id}`);
      return res.json({ streams: [] });
    }

    const streams = plex.buildStreams(item, config.plexUrl, config.plexToken);
    return res.json({ streams });

  } catch (err) {
    console.error('[STREAM ERROR]', err.message);
    return res.json({ streams: [] });
  }
});

// ── Health check para Railway ─────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`✅ Plex Stream Add-on rodando em http://localhost:${PORT}`);
});
