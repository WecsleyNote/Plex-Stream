const axios = require('axios');

function plexClient(plexUrl, plexToken) {
  const headers = {
    'X-Plex-Token': plexToken,
    'Accept': 'application/json',
  };

  const http = axios.create({
    baseURL: plexUrl,
    headers,
    timeout: 15000,
  });

  // Busca todas as bibliotecas
  async function getLibraries() {
    const res = await http.get('/library/sections');
    return res.data.MediaContainer.Directory || [];
  }

  // Busca item pelo IMDB ID varrendo as bibliotecas
  async function findByImdbId(imdbId) {
    const sections = await getLibraries();

    for (const section of sections) {
      if (!['movie', 'show'].includes(section.type)) continue;

      // Tenta o agente novo (Plex TV/Movie agent)
      try {
        const r = await http.get(`/library/sections/${section.key}/all`, {
          params: { 'externalGuid': `imdb://${imdbId}` },
        });
        const items = r.data.MediaContainer.Metadata || [];
        if (items.length > 0) return { item: items[0], sectionType: section.type };
      } catch (_) {}

      // Tenta o agente legado
      try {
        const r = await http.get(`/library/sections/${section.key}/all`, {
          params: { 'guid': `com.plexapp.agents.imdb://${imdbId}` },
        });
        const items = r.data.MediaContainer.Metadata || [];
        if (items.length > 0) return { item: items[0], sectionType: section.type };
      } catch (_) {}
    }

    return null;
  }

  // Busca episódio específico
  async function findEpisode(seriesRatingKey, season, episode) {
    const res = await http.get(`/library/metadata/${seriesRatingKey}/allLeaves`);
    const episodes = res.data.MediaContainer.Metadata || [];
    return episodes.find(ep =>
      ep.parentIndex === season && ep.index === episode
    ) || null;
  }

  // Detalhes completos de um item
  async function getItemDetails(ratingKey) {
    const res = await http.get(`/library/metadata/${ratingKey}`);
    return res.data.MediaContainer.Metadata?.[0] || null;
  }

  // Monta streams com codecs reais no estilo AIOStreams
  function buildStreams(item, plexUrl, plexToken) {
    const streams = [];
    const mediaList = item.Media || [];

    for (const media of mediaList) {
      for (const part of media.Part || []) {
        const url = `${plexUrl}${part.key}?X-Plex-Token=${plexToken}`;

        // ── Resolução ──────────────────────────────────────────────
        const resRaw = (media.videoResolution || '').toLowerCase();
        let resLabel = 'SD';
        let resEmoji = '📺';
        if (resRaw === '4k' || resRaw === '2160') { resLabel = '4K UHD'; resEmoji = '🔥'; }
        else if (resRaw === '1080') { resLabel = 'FHD'; resEmoji = '🚀'; }
        else if (resRaw === '720') { resLabel = 'HD'; resEmoji = '⚡'; }

        // ── Codec de Vídeo ─────────────────────────────────────────
        const vCodec = (media.videoCodec || '').toUpperCase();
        let vLabel = vCodec;
        if (vCodec === 'HEVC' || vCodec === 'H265') vLabel = 'HEVC';
        else if (vCodec === 'H264' || vCodec === 'AVC') vLabel = 'AVC';
        else if (vCodec === 'AV1') vLabel = 'AV1';
        else if (vCodec === 'VP9') vLabel = 'VP9';

        // ── HDR ────────────────────────────────────────────────────
        const videoProfile = (media.videoProfile || '').toLowerCase();
        const hdrParts = [];
        if (videoProfile.includes('hdr10plus') || videoProfile.includes('hdr10+')) hdrParts.push('HDR10+');
        else if (videoProfile.includes('hdr10')) hdrParts.push('HDR10');
        else if (videoProfile.includes('dolby vision') || videoProfile.includes('dv')) hdrParts.push('DV');
        else if (videoProfile.includes('hdr')) hdrParts.push('HDR');
        const hdrLabel = hdrParts.join(' ');

        // ── Codec de Áudio ─────────────────────────────────────────
        const aCodec = (media.audioCodec || '').toUpperCase();
        let aLabel = aCodec;
        if (aCodec === 'EAC3') aLabel = 'DD+';
        else if (aCodec === 'AC3') aLabel = 'DD';
        else if (aCodec === 'DCA') aLabel = 'DTS';
        else if (aCodec === 'TRUEHD') aLabel = 'TrueHD';
        else if (aCodec === 'FLAC') aLabel = 'FLAC';
        else if (aCodec === 'AAC') aLabel = 'AAC';
        else if (aCodec === 'MP3') aLabel = 'MP3';

        // ── Canais de Áudio ────────────────────────────────────────
        const channels = media.audioChannels || 2;
        let chLabel = '2.0';
        if (channels === 8) chLabel = '7.1';
        else if (channels === 6) chLabel = '5.1';
        else if (channels === 2) chLabel = '2.0';
        else if (channels === 1) chLabel = 'Mono';

        // Verifica Atmos no nome da parte
        const partFile = (part.file || '').toLowerCase();
        const isAtmos = partFile.includes('atmos') || (media.audioProfile || '').toLowerCase().includes('atmos');
        const audioFull = isAtmos ? `${aLabel} ★ Atmos` : `${aLabel}`;

        // ── Tamanho e Bitrate ──────────────────────────────────────
        const sizeGB = part.size ? (part.size / 1e9).toFixed(2) + ' GB' : '';
        const bitrate = media.bitrate ? media.bitrate + ' kbps' : '';

        // ── Monta o título no estilo AIOStreams ────────────────────
        const lines = [
          `${resEmoji} ${resLabel}`,
          [vLabel, hdrLabel].filter(Boolean).join(' '),
          `🎵 ${audioFull} 🔊 ${chLabel}`,
          [sizeGB, bitrate].filter(Boolean).join(' 📶 '),
          `🎬 Plex Direct`,
        ].filter(Boolean).join('\n');

        streams.push({
          url,
          name: `${resEmoji} Plex`,
          title: lines,
          behaviorHints: { notWebReady: false },
        });
      }
    }

    return streams;
  }

  return { getLibraries, findByImdbId, findEpisode, getItemDetails, buildStreams };
}

module.exports = plexClient;
