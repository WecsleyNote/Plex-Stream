# Plex Stream · Stremio Add-on

Add-on para o Stremio que conecta sua biblioteca Plex com streams diretos e exibição de codecs reais.

## Deploy no Railway

### 1. Suba o projeto

```bash
# Inicie um repositório Git (se ainda não tiver)
git init
git add .
git commit -m "initial commit"
```

Depois acesse [railway.app](https://railway.app), crie um novo projeto e faça o deploy via GitHub ou `railway up`.

### 2. Sem variáveis de ambiente necessárias

O Railway injeta a variável `PORT` automaticamente. Nenhuma outra configuração é necessária no painel — tudo é feito pela **tela de configuração** do add-on.

### 3. Acesse a tela de configuração

Após o deploy, abra a URL gerada pelo Railway (ex: `https://seu-projeto.up.railway.app`).

### 4. Configure e instale

1. Digite a URL do seu Plex e o Token
2. Selecione as bibliotecas desejadas (ou nenhuma, para só usar streams via IMDB)
3. Copie a URL gerada e cole no Stremio em **Add-ons → instalar via URL**

---

## Como funciona

- **Streams**: Quando você abre um filme/série no Stremio (que já tem IMDB ID via Cinemeta ou outro add-on de metadados), o add-on busca o arquivo correspondente no Plex e retorna o link direto.
- **Codecs**: Exibe resolução, codec de vídeo, HDR, codec de áudio, canais e tamanho do arquivo.
- **Catálogos** (opcional): Se você selecionar bibliotecas na configuração, elas aparecerão como catálogos no Stremio.

## Formato das streams

```
🔥 Plex
🔥 4K UHD
HEVC HDR10
🎵 TrueHD ★ Atmos 🔊 7.1
21.70 GB 📶 21700 kbps
🎬 Plex Direct
```

## Estrutura

```
plex-addon-v2/
├── index.js          # Servidor Express (rotas do add-on + API)
├── plex.js           # Módulo de integração com a API do Plex
├── public/
│   └── index.html    # Tela de configuração (3 passos)
├── railway.toml      # Configuração do Railway
└── package.json
```
