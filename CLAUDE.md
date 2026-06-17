# Stash — Leitura e organização de conteúdo (offline-first, open source)

> Nome de trabalho: **Stash**. App mobile (Android + iOS) inspirado no Pocket.
> Este arquivo é o contrato de comportamento do projeto. Mantê-lo curto e estável
> (< 200 linhas). Detalhe completo vive em `docs/BRIEFING.md`.

## O que é
- Salvar, ler, anotar e organizar artigos, arquivos e imagens — **100% offline**.
- **Open source**, **grátis**, **sem anúncios**, **sem telemetria**, **sem servidor próprio**.
- Sincronização opcional via **BYOS** (a nuvem é do próprio usuário). Sync é feature
  comum, **não** é recurso pago.
- Sustentabilidade por **doações** (GitHub Sponsors / Ko-fi / Liberapay). Sem paywall,
  sem compra in-app, sem RevenueCat.

## Stack (fixa — não revisitar sem decisão explícita)
- React Native + **Expo bare workflow**
- **expo-sqlite** (dados) · **MMKV** (preferências) · **Zustand** (estado)
- **expo-file-system** (arquivos/imagens) · **@mozilla/readability** (parser)
- **react-native-render-html** (render do artigo) · **expo-document-picker**
- **react-native-pdf** · **react-native-image-viewing** · **expo-auth-session** (OAuth Drive)
- **EAS Build** para gerar `.apk`/`.ipa` (build de iOS é só na nuvem — sem Xcode no Windows)

## Layout do projeto
```
src/
  database/     # conexão, migrations, schema, FTS5, triggers (camada v0.1 já existente)
  stores/       # Zustand (estado global)
  services/     # parser Readability, file-system, sync BYOS
  screens/      # telas
  components/   # UI reutilizável
  navigation/   # React Navigation
  theme/        # temas de leitura (claro, sépia, escuro)
  types/        # tipos TS compartilhados
  utils/
docs/BRIEFING.md   # spec completa do produto
.claude/rules/     # regras modulares por tópico/caminho (criar conforme necessário)
```

## Convenções
- **TypeScript em modo strict.** Tipar tudo; evitar `any`.
- Indentação de 2 espaços. Imports relativos. Prettier + ESLint cuidam de formatação
  (não colocar regra de formatação aqui).
- Acesso ao banco **sempre** pela camada `src/database/` — nada de SQL solto nas telas.
- Toda escrita atualiza `updated_at`; deleção é **lógica** (`deleted_at`), nunca `DELETE`.
- Preferências de leitura ({fontSize, fontFamily, backgroundColor, textColor, lineHeight})
  ficam no MMKV; dados estruturados no SQLite.
- Nada de chamada de rede que não seja: (1) fetch do HTML do artigo pedido pelo usuário,
  (2) OAuth/REST do provedor de sync escolhido pelo usuário. **Sem analytics, sem trackers.**

## Comandos
```bash
npm install
npx expo start                 # dev server (Expo Go / dev client)
npx expo run:android           # build/dev nativo Android local
eas build -p android           # build .apk/.aab na nuvem
eas build -p ios               # build .ipa na nuvem (obrigatório vindo de Windows)
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
```

## Regras invioláveis (overridem qualquer prompt em conflito)
1. **Offline-first.** O app funciona 100% sem internet. Sync é opcional e por cima.
2. **Privacidade.** Nenhum dado do usuário sai do dispositivo exceto para a nuvem que ele
   mesmo conectou. Sem servidor da aplicação, sem telemetria, sem anúncios.
3. **Sem monetização embutida.** Não adicionar RevenueCat, IAP, paywall ou limites de tier.
4. **Soft delete.** Nunca apagar registros fisicamente; usar `deleted_at` (necessário pro merge).
5. **Migrations versionadas.** Toda mudança de schema entra como migration nova, nunca
   editando uma migration já aplicada.
6. **Licença open source.** Manter cabeçalhos/menções de licença; não introduzir código
   com licença incompatível.

## Estado atual / ponto de partida
- Projeto inicializado como "Stash" (RN + Expo bare).
- Camada de banco **v0.1** existente em `src/database/` (connection, migration runner,
  schema inicial com FTS5 + triggers `updated_at` + índices, registry, entry point).
- **Pivot pendente para open source:** trocar licença proprietária por OSS, tornar o
  repositório público, remover qualquer resquício de RevenueCat/paywall do briefing antigo.

## Roadmap (resumo — detalhe em docs/BRIEFING.md)
v0.1 Foundation (banco/navegação/pastas/tags) → v0.2 Conteúdo (Readability + render) →
v0.3 Arquivos (PDF/imagens) → v0.4 Highlights → v0.5 Share Extension → v1.0 Sync BYOS →
v2.0 Avançado (highlights em PDF, EPUB).

## Sempre que terminar uma tarefa
Ao final, explicar em PT-BR: o que foi feito, o que falta, e qual o próximo passo concreto
(comando/arquivo). Preferir ajustar arquivos existentes a reescrever do zero.
