# Briefing do Projeto — Stash

**App de leitura e organização de conteúdo · Open source · Offline-first**
*Versão 2.0 · Referência: Pocket-like app · Modelo: grátis + doações*

> Este documento é a referência completa do produto. O `CLAUDE.md` na raiz é o resumo
> operacional que o Claude Code carrega em toda sessão; aqui está o detalhe. Decisões de
> produto, stack, schema e modelo de distribuição estão fechadas — use como ponto de partida.

---

## 1. Visão geral

App mobile para Android e iOS inspirado no Pocket, com foco absoluto em **privacidade**,
**armazenamento local** e **experiência de leitura**. O usuário salva, organiza e anota
artigos, textos, notícias, arquivos e imagens — tudo armazenado localmente no dispositivo,
**sem servidores próprios e sem anúncios**.

O projeto é **open source** e **gratuito**. Não há paywall, compra in-app nem versão paga.
A sustentabilidade vem de **doações voluntárias**. O código vive em um **repositório público
no GitHub** e aceita contribuições.

## 2. Princípios (não negociáveis)

1. **Offline-first** — todas as funções essenciais operam sem internet.
2. **Privacidade total** — nenhum dado sai do dispositivo, exceto para a nuvem que o próprio
   usuário conectar (sync BYOS). Sem servidor da aplicação.
3. **Sem anúncios, sem telemetria, sem rastreamento.**
4. **Open source** — código auditável, licença OSS, contribuições bem-vindas.
5. **Gratuito** — todas as features liberadas para todos. Doações são opcionais.

## 3. Decisões técnicas confirmadas

### 3.1 Plataformas
- Android e iOS, codebase único via React Native.
- **Expo bare workflow** (inicia com Expo, usa módulos nativos quando preciso).
- Build via **Expo EAS Build** para gerar `.apk`/`.aab` e `.ipa`.
- iOS só compila na nuvem (EAS) — não há Xcode no ambiente Windows do mantenedor.

### 3.2 Stack tecnológica

| Camada | Tecnologia | Finalidade |
| --- | --- | --- |
| Banco de dados | SQLite (expo-sqlite) | Artigos, highlights, tags, pastas, arquivos |
| Preferências | MMKV | Tema, fonte, tamanho — leitura rápida |
| Estado global | Zustand | Gerenciamento de estado leve |
| Arquivos locais | expo-file-system | Imagens e arquivos salvos no dispositivo |
| Parser de artigos | @mozilla/readability | Extração de conteúdo limpo de URLs |
| Renderização HTML | react-native-render-html | Exibição dos artigos com temas dinâmicos |
| Visualizador PDF | react-native-pdf | Leitura de PDFs salvos |
| Visualizador imagens | react-native-image-viewing | Galeria de imagens salvas |
| Picker de arquivos | expo-document-picker | Importação de arquivos do dispositivo |
| Autenticação OAuth | expo-auth-session | Login para Google Drive (sync) |

> **Removido em relação ao briefing antigo:** `react-native-purchases` (RevenueCat) e toda a
> infraestrutura de trial/paywall. Não fazem mais parte do projeto.

## 4. Funcionalidades

### 4.1 Captura de conteúdo
- Salvar artigos/páginas via **URL** — fetch do HTML + parser Readability.
- **Share Extension**: salvar direto do navegador ou de outros apps.
- Importar arquivos locais: PDF, imagens, texto puro.
- Imagens dos artigos salvas localmente via expo-file-system.

*Nota: a Share Extension exige módulo nativo separado para Android (Intent) e iOS (Share
Extension) — uma das partes mais complexas do projeto.*

### 4.2 Customização de leitura
- Tamanho de fonte; família tipográfica (serif e sans-serif — ex.: Merriweather, Lora,
  Inter, Literata); cor de fundo (claro, sépia, escuro e outros); cor do texto; espaçamento.
- Objeto `{ fontSize, fontFamily, backgroundColor, textColor, lineHeight }` salvo no MMKV e
  aplicado dinamicamente ao react-native-render-html.

### 4.3 Highlights
- Seleção por toque longo; cor por highlight; uma ou mais tags por highlight.
- Persistidos no SQLite com posição (`start_offset`, `end_offset`).
- Na releitura: HTML pré-processado envolvendo trechos em `<mark>` com a cor correspondente.
- View de tags: filtrar por tag e ver highlights agrupados por artigo de origem.
- *Highlights em PDF ficam para v2 (complexidade de coordenadas de texto em PDF).*

### 4.4 Organização
- Pastas e subpastas (estrutura recursiva via `parent_id`).
- Tags para artigos, arquivos e highlights.
- Artigos, arquivos e imagens compartilham a mesma hierarquia de pastas e tags.
- Busca full-text nos artigos via SQLite **FTS5**.

### 4.5 Tipos de conteúdo

| Tipo | Visualizador | Highlights | Versão |
| --- | --- | --- | --- |
| Artigos web (HTML) | react-native-render-html | Sim | v1 |
| PDF | react-native-pdf | Não (v2) | v1 |
| Imagens | react-native-image-viewing | N/A | v1 |
| Texto puro | Nativo | Sim | v1 |
| EPUB | epubjs via WebView | A definir | v2 |

### 4.6 Gerenciamento de armazenamento
- Tela de "Armazenamento usado" por tipo de conteúdo.
- Remover arquivos individualmente.
- Export/Import de backup: `.zip` contendo `stash.db` + pasta `files/`.

## 5. Schema do banco (SQLite)

Armazenamento offline completo, `updated_at` para futura sincronização e deleção lógica
(`deleted_at`) para o merge de sync.

### 5.1 Tabelas principais
- **folders** (`id` PK, `name`, `parent_id` → folders.id, `created_at`, `updated_at`, `deleted_at`)
- **articles** (`id`, `folder_id` → folders.id, `title`, `url`, `content_html`, `content_text`,
  `author`, `published_at`, `cover_image_path`, `reading_time_min`, `is_read`, `is_favorite`,
  `created_at`, `updated_at`, `deleted_at`)
- **files** (`id`, `name`, `type` ['pdf','image','text'], `path`, `size_bytes`,
  `folder_id` → folders.id, `created_at`, `updated_at`, `deleted_at`)
- **tags** (`id`, `name`, `color`, `created_at`, `updated_at`)
- **article_tags** (`article_id`, `tag_id`) — PK composta
- **file_tags** (`file_id`, `tag_id`) — PK composta
- **highlights** (`id`, `article_id` → articles.id, `selected_text`, `start_offset`,
  `end_offset`, `color`, `note`, `created_at`, `updated_at`, `deleted_at`)
- **highlight_tags** (`highlight_id`, `tag_id`) — PK composta

### 5.2 Observações
- `parent_id` NULL em folders = pasta raiz.
- `deleted_at` NULL = ativo; preenchido = deletado logicamente (não remove do banco).
- `updated_at` atualizado em toda escrita — base do last-write-wins do sync.
- **FTS5**: tabela virtual `articles_fts` indexando `title` + `content_text`.
- Índices recomendados: artigos por pasta, busca por tag, listagem por `updated_at`.
- **Migrations versionadas** com `CREATE TABLE IF NOT EXISTS`; nunca editar migration aplicada.
- Arquivo do banco: `stash.db`.

> **Estado:** a camada de banco v0.1 (connection manager, migration runner, schema inicial com
> FTS5 + triggers + índices, registry, entry point) já está implementada em `src/database/`.

## 6. Modelo aberto e sustentabilidade

### 6.1 Licença
Recomendação: **GPL-3.0** (copyleft) — quem redistribuir um fork precisa manter o código
aberto, o que combina com a proposta de um app livre que não vira clone proprietário pago.
Alternativa: **MIT/Apache-2.0** (permissiva) se a prioridade for adoção/reuso máximos, aceitando
que terceiros possam fechar derivados. *Isto é informativo, não aconselhamento jurídico — a
escolha de licença é definitiva e vale confirmar com calma.*

Ação pendente: substituir a LICENSE proprietária antiga pela licença OSS escolhida e tornar o
repositório **público**.

### 6.2 Doações (sem paywall)
- Links externos: **GitHub Sponsors**, **Ko-fi**, **Liberapay** ou "buy me a coffee".
- Tela opcional "Apoiar o desenvolvimento" abrindo o link no navegador.
- ⚠️ Políticas das lojas para botões/links de doação dentro do app mudam com frequência e
  variam por região — verificar as diretrizes atuais da App Store e do Google Play antes de
  embutir links de doação no app (o caminho mais seguro costuma ser deixar a doação só no
  GitHub/site, fora do app).

### 6.3 Custos para publicar (mesmo sendo grátis)
| Item | Custo |
| --- | --- |
| Conta Google Play Developer | US$ 25 (único) |
| Conta Apple Developer | US$ 99/ano |
| Distribuição alternativa (opcional) | F-Droid / APK direto no GitHub Releases — grátis |

> Por ser open source, o app pode ser distribuído também via **F-Droid** e como `.apk` nos
> **GitHub Releases**, sem custo de loja — útil para quem não quer pagar a conta Apple.

## 7. Sincronização (BYOS — Bring Your Own Storage)

O app não hospeda dados. O usuário conecta a própria conta de nuvem. Estratégia: sync por
arquivo único (`.zip`) com **last-write-wins** baseado em `updated_at`. **Disponível para todos
(não é recurso pago).**

### 7.1 Provedores (v1)
| Provedor | Plataformas | Integração |
| --- | --- | --- |
| Google Drive | Android + iOS | OAuth via expo-auth-session + REST |
| iCloud Drive | iOS apenas | Nativo via expo-file-system |
| WebDAV | Android + iOS | Protocolo aberto: Nextcloud, Proton Drive, Koofr, Box |
| Dropbox | Android + iOS | SDK próprio (v2 se necessário) |

### 7.2 Fluxo
1. Dispositivo A empacota `stash.zip` (`stash.db` + `files/`).
2. Envia o `.zip` para a nuvem do usuário.
3. Dispositivo B baixa, descompacta e faz merge por `updated_at`.
4. Deletados: soft delete via `deleted_at`, propagado no merge.

## 8. Complexidade e roadmap

### 8.1 Mapa de complexidade
| Área | Complexidade |
| --- | --- |
| Schema SQLite + migrations | Baixa |
| UI de leitura + temas | Baixa |
| Parser de artigos (Readability) | Média |
| Navegação + estrutura de pastas | Média |
| Busca full-text (FTS5) | Média |
| Highlights em HTML (offsets no DOM) | Alta |
| Share Extension nativa | Alta |
| Sincronização BYOS (OAuth + merge) | Alta |
| Highlights em PDF | Muito alta (v2) |

### 8.2 Roadmap
| Fase | Escopo | Entregável |
| --- | --- | --- |
| **v0.1 Foundation** | Schema SQLite, navegação base, MMKV, pastas e tags | App offline sem conteúdo |
| **v0.2 Conteúdo** | Readability, salvar por URL, render HTML com temas | Salvar e ler artigos |
| **v0.3 Arquivos** | document-picker, react-native-pdf, image-viewing, armazenamento | Salvar PDFs e imagens |
| **v0.4 Highlights** | Seleção, persistência, tags em highlights, view por tag | Highlights com tags |
| **v0.5 Share Extension** | Módulo nativo Android/iOS, tela de "apoiar" (opcional) | Salvar de outros apps |
| **v1.0 Sync BYOS** | Google Drive + iCloud + WebDAV, merge, backup/export | Sincronização entre dispositivos |
| **v2.0 Avançado** | Highlights em PDF, EPUB viewer, novos provedores | Features avançadas |

> Diferença do roadmap antigo: a antiga fase de monetização/paywall deixou de existir; o sync
> passou a ser entrega comum (não trancada atrás de pagamento).

## 9. Setup do repositório open source

Arquivos a adicionar na raiz para um repo público saudável:
- `LICENSE` (a licença OSS escolhida — ver 6.1)
- `README.md` — pitch, screenshots, como rodar, como contribuir, link de doação.
  *Para um repo público, vale um README em inglês (ou bilíngue) para alcançar mais gente.*
- `CONTRIBUTING.md` — como abrir issues/PRs, padrão de commits, como rodar local.
- `CODE_OF_CONDUCT.md` — ex.: Contributor Covenant.
- `.github/ISSUE_TEMPLATE/` e `PULL_REQUEST_TEMPLATE.md`.
- `.gitignore` adequado (node_modules, `android/`, `ios/`, `.expo/`, `.env`, builds).
- `CHANGELOG.md` (opcional, mas recomendado).
- Opcional: `FUNDING.yml` em `.github/` para o botão de Sponsor.

> ⚠️ Antes de tornar o histórico público: garantir que nenhuma chave, token ou segredo foi
> commitado em qualquer ponto do histórico do Git (não só no último commit).

## 10. Como usar este briefing no Claude Code

1. Coloque `CLAUDE.md` na **raiz** do repositório e este arquivo em `docs/BRIEFING.md`.
2. Ao abrir o Claude Code no diretório do projeto, ele carrega o `CLAUDE.md` automaticamente
   no início da sessão. Mantenha o `CLAUDE.md` curto (< 200 linhas) — ele é o índice; este
   briefing é o detalhe.
3. Regras profundas, específicas de um caminho ou de um só assunto devem ir para
   `.claude/rules/` (arquivos modulares), não inchar o `CLAUDE.md`.
4. Trabalhar fase a fase, na ordem do roadmap. Cada fase deve terminar com o app compilando e
   o que foi entregue funcionando.
