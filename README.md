# Stash

Salve, leia, anote e organize artigos — **100% offline**, sem anúncios, sem rastreamento.
App mobile (Android + iOS) inspirado no Pocket, **open source** e **gratuito**.

## Princípios

- **Offline-first** — depois de salvar, o artigo funciona sem internet. Com a opção de
  download completo, até as imagens do corpo ficam no aparelho.
- **Privacidade** — nenhum dado sai do dispositivo. Sem servidor próprio, sem telemetria,
  sem analytics, sem anúncios.
- **Sem monetização embutida** — sem paywall, sem compra in-app. Sustentável por doações.
- **Aberto** — código sob licença MIT.

## Funcionalidades

- 📥 Salvar artigos por URL (extração de conteúdo com Mozilla Readability)
- 📖 Leitor com temas (claro / sépia / escuro), fonte, tamanho e espaçamento ajustáveis
- 🖼️ Capa do artigo e imagens no corpo; **download completo** para leitura offline real
- ✍️ Destaques coloridos com marcação no texto, agrupados por artigo
- 🗂️ Estantes (pastas), tags e busca
- 📰 Fontes — artigos agrupados por domínio, com opção de renomear a fonte
- 📊 Progresso de leitura, favoritos, arquivar e lixeira (soft delete)
- 💾 Backup e restauração locais

## Stack

React Native + **Expo (bare workflow)** · **expo-sqlite** (dados, FTS5) ·
**MMKV** (preferências) · **Zustand** (estado) · **expo-file-system** (arquivos) ·
**@mozilla/readability** + **linkedom** (parser) · **react-native-webview** (render) ·
**EAS Build** (geração de `.apk` / `.ipa`).

## Desenvolvimento

```bash
npm install
npx expo start            # dev server (Expo Go / dev client)
npx expo run:android      # build/dev nativo Android local
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint
```

### Build de release (nuvem)

```bash
eas build -p android --profile preview     # .apk instalável
eas build -p android                       # .aab para a Play Store
eas build -p ios                           # .ipa (build de iOS é só na nuvem)
```

### Ícones e splash

Os ícones do app e o logo do splash são gerados a partir do logo vetorial:

```bash
node scripts/gen-icons.mjs   # requer: npm i --no-save @resvg/resvg-js
```

## Licença

[MIT](LICENSE) © Murilo Dannenberg

## Apoie

Sem anúncios e sem paywall — se o Stash te ajuda, considere apoiar via doação
(GitHub Sponsors / Ko-fi / Liberapay).
