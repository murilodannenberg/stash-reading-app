# Design System — Stash

*Versão 1.0 · Congelar antes de v0.2 · Referência obrigatória para todo trabalho de UI*

> Este documento é a fonte única de verdade para decisões visuais. Toda tela, componente
> e fluxo deve derivar deste sistema. Não criar variantes sem atualizar aqui primeiro.

---

## 1. Conceito visual

**Metáfora:** biblioteca particular — papel, tinta, madeira, páginas.
**Personalidade:** quieto, íntimo, focado. O conteúdo é o herói; a UI recua.
**Regra de ouro:** se um elemento não ajuda a ler ou a encontrar algo, ele não existe.

---

## 2. Paleta de cores

Todos os valores abaixo são para o **tema claro (padrão)**. O tema escuro é uma variação
derivada — quando implementado, documentar os overrides aqui.

```
Papel       #FAF8F5   fundo da tela e de cards de leitura
Pergaminho  #EDE9E3   superfícies secundárias, chips inativos, separadores
Cinza-terra #9B9189   texto secundário, metadados, labels de seção
Tinta       #1C1917   texto primário, títulos, ícones ativos
Ambar       #C97B4B   acento único — botão primário, FAB, nav ativo, borda de highlight, progresso
Musgo       #3B6D11   tags de categoria (variante verde)
```

### Paleta de highlight (marcações no texto)
```
Amarelo     bg #FEF3C7   — padrao/neutro
Coral       bg #FDE8DF   — destaque forte
Verde       bg #E0F2EE   — positivo / referencia
Roxo        bg #EEEDFE   — conceito / definicao
```

### Paleta de tags de artigo
```
Ambar-claro   bg #FDF0E0  text #A0621A   — tecnologia, default
Teal-claro    bg #E0F2EE  text #0F7B5C   — ciencia, natureza
Coral-claro   bg #FAEAE5  text #B84B25   — design, arte
Neutro        bg #EDE9E3  text #6B6560   — sem categoria
```

### Regras de uso de cor
- **Um acento so:** Ambar (#C97B4B) e o unico acento vivo. Nao usar outros tons saturados
  para acoes ou estados ativos.
- **Nunca preto puro (#000).** Tinta (#1C1917) e o mais escuro que existe no sistema.
- **Branco puro (#FFF) so em overlays/modais** sobre o fundo Papel. Telas normais usam Papel.
- Tags e chips podem usar as paletas de cor acima; fora delas, sempre Pergaminho/Cinza-terra.

---

## 3. Tipografia

### Familias
```
Display / Corpo leitura:  Georgia (serif nativo — sem dependencia de fonte externa)
UI / Labels / Metadados:  System UI -> -apple-system -> Roboto (sans-serif nativo)
```

> Usar fontes nativas do sistema elimina carregamento e garante legibilidade maxima.
> Merriweather, Lora, Literata e Inter entram como **opcoes de customizacao do usuario**
> na tela de configuracao de leitura — nao no chrome da UI.

### Escala tipografica

| Token       | Familia  | Tamanho | Peso | Uso |
|-------------|----------|---------|------|-----|
| display     | Serif    | 28px    | 700  | Titulos de tela (Biblioteca, Estantes) |
| title       | Sans     | 20px    | 600  | Titulo de artigo na lista |
| subtitle    | Sans     | 15px    | 500  | Nome de estante, subtitulos de card |
| body        | Serif    | 15px    | 400  | Corpo do artigo (modo leitura) |
| body-ui     | Sans     | 15px    | 400  | Texto de botoes, descricoes |
| caption     | Sans     | 13px    | 400  | Fonte do artigo, tempo de leitura, data |
| label       | Sans     | 12px    | 500  | Rotulos de secao (UPPERCASE + letterSpacing 0.04em) |
| micro       | Sans     | 11px    | 400  | Metadados secundarios (nunca abaixo de 11px) |

### Regras tipograficas
- Altura de linha: 1.6 para body-ui; 1.7 para body de leitura.
- Titulos de artigo em lista: truncar em 2 linhas com numberOfLines={2}.
- Labels de secao sempre em UPPERCASE com letterSpacing: 0.04em.
- Peso maximo usado: 700 (display). UI geral usa 400/500/600.

---

## 4. Espacamento

Sistema de 8pt com base 4px.

```
xs   4px    espaco interno minimo (entre icone e texto)
sm   8px    gap entre elementos irmaos (chips, tags)
md  12px    padding interno de cards compactos
lg  16px    padding horizontal de telas (padrao)
xl  24px    separacao entre secoes
2xl 32px    margem de topo de secao principal
```

**Padding horizontal de tela:** sempre 16px (lg). Nunca menos.
**Padding vertical de safe area:** respeitar SafeAreaView do Expo sempre.

---

## 5. Arredondamento (border-radius)

```
xs   4px    tags/pills de texto
sm   8px    thumbnails de artigo, icones de estante
md  12px    botoes
lg  16px    cards de artigo, cards de estante
xl  24px    bottom sheets, modais
full 9999px chips de filtro (estilo pilula)
```

---

## 6. Componentes

### 6.1 Barra de filtros

A barra de filtros aparece abaixo do titulo da tela. Estrutura:

```
[ icone-filtro ] [ chip: Todos ] [ chip: Nao lidos ] [ chip: Favoritos ] -> scroll horizontal
```

- O botao de filtro (icone adjustments-horizontal) tem background Ambar, color #fff,
  tamanho 32x32px, borderRadius 8px. E fixo a esquerda.
- Os chips sao rolveis horizontalmente (FlatList horizontal), sem mostrar scrollbar.
- **Chip ativo:** background Tinta (#1C1917), color Papel (#FAF8F5), borderRadius 9999px.
- **Chip inativo:** background Pergaminho (#EDE9E3), color Cinza-terra (#9B9189).
- Ao tocar o icone de filtro, abre um **bottom sheet** com opcoes avancadas (tipo de conteudo,
  estante, tag, lido/favorito). Nao navegar para tela separada de filtro.

### 6.2 Cards de artigo (lista)

```
[ thumbnail 52x52 ] [ fonte em micro/uppercase ] [ titulo em title, 2 linhas ]
                     [ tempo de leitura ] [ tag-pill ]
```

- Separador entre itens: linha 0.5px solid Pergaminho. Sem sombra, sem elevacao.
- Thumbnail: emoji ou imagem de capa com borderRadius 8px, fundo Pergaminho.
- Deslizar para esquerda expoe acoes: Favoritar (icone bookmark, fundo Ambar) e
  Remover (icone trash, fundo Coral claro/vermelho).

### 6.3 Cards de estante

```
[ icone 42x42 com fundo colorido suave ] [ nome da estante ] [ contagem de itens ] [ > ]
```

- borderRadius 14px, background Papel, borda 0.5px solid Pergaminho.
- "Nova estante": mesma estrutura, borda tracejada, icone + em Cinza-terra.
- A linha separadora visual de estante na lista de artigos usa:
  linear-gradient(90deg, Ambar 0%, Pergaminho 60%, transparent 100%).

### 6.4 Tela de leitura

- Fundo: Papel (#FAF8F5) por padrao. Usuario pode trocar nas configuracoes (sepia, escuro).
- Top bar minima: <- (voltar) | Aa (tipografia) | bookmark | ... (mais acoes).
- Fonte do artigo em Georgia, 15px, lineHeight 1.7, cor Tinta.
- Barra de progresso: linha de 3px, cor Ambar, fixa no fundo da area de texto.
- Highlights: envolver trecho em <mark> com cor de background da paleta de highlight.
- **A tela de leitura nao tem navegacao inferior** — ela e imersiva. A seta volta a lista.

### 6.5 Botoes

| Variante    | Background      | Borda                     | Texto       | Uso |
|-------------|-----------------|---------------------------|-------------|-----|
| primary     | Ambar #C97B4B   | nenhuma                   | #fff        | Acao principal por tela |
| secondary   | transparente    | 1.5px Pergaminho escuro   | Tinta       | Acao secundaria |
| ghost       | Pergaminho      | nenhuma                   | Cinza-terra | Cancelar, desfazer |
| danger      | transparente    | 1.5px Coral (#F0BFBF)     | #B03030     | Remover, deletar |
| FAB         | Ambar           | nenhuma                   | #fff        | Acao global flutuante (+) |

- Altura padrao: 48px (minimo 44px para toque).
- borderRadius 12px em todos exceto FAB (circular: borderRadius 9999px, 48x48px).
- **Um unico botao primario por tela.** Nao empilhar dois botoes primarios.

### 6.6 Highlights na lista (tela de Highlights)

```
[ borda esquerda colorida 3px ] [ texto em italico/serif ] [ fonte . estante ]
```

- Cor da borda = cor do highlight (Ambar, Musgo, etc.).
- Fundo: Papel. Sem card elevado.
- Agrupado por artigo de origem com label de secao.

### 6.7 Navegacao inferior

5 itens fixos:

```
Biblioteca   Highlights   [+ Salvar]   Estantes   Ajustes
ti-books     ti-bookmark  ti-plus      ti-archive  ti-settings
```

- Item ativo: cor Ambar. Itens inativos: Cinza-terra.
- O botao central (+ Salvar) tem fundo Ambar circular, elevado 4px acima da tab bar.
- Labels abaixo dos icones, 10px.
- Fundo da tab bar: Papel, borda topo 0.5px Pergaminho.

### 6.8 Estados vazios

Nao deixar tela em branco. Sempre mostrar:
- Icone grande em Pergaminho (Tabler outline).
- Mensagem direta em subtitle: "Esta estante esta vazia."
- Acao sugerida em caption: "Salve um artigo para comecar."
- Botao secondary ou link de texto: "Salvar primeiro artigo".

---

## 7. Iconografia

**Biblioteca:** Tabler Icons (outline) em todo o chrome da UI.
Tamanho padrao: 20px inline, 24px em tab bar e FAB.
Cor: herdar do contexto (Tinta para ativos, Cinza-terra para inativos).

Icones mapeados por funcao:

```
Biblioteca / home     ti-books
Highlights            ti-bookmark
Salvar / adicionar    ti-plus
Estantes              ti-archive
Ajustes               ti-settings
Busca                 ti-search
Filtros               ti-adjustments-horizontal
Voltar                ti-arrow-left
Mais opcoes           ti-dots-vertical
Favorito              ti-star
Lido                  ti-check-circle
Fonte tipografica     ti-typography
Compartilhar          ti-share
PDFs                  ti-file-type-pdf
Imagens               ti-photo
Texto puro            ti-file-text
```

---

## 8. Metafora de "estante" — vocabulario de produto

Trocar **todos** os termos de sistema de arquivos por termos de biblioteca:

| Antes (nao usar) | Agora |
|------------------|-------|
| Pasta            | Estante |
| Subpasta         | Secao de estante |
| Arquivos         | Itens |
| Mover para pasta | Colocar na estante |
| Nova pasta       | Nova estante |
| Diretorio raiz   | Biblioteca (home) |

- A **home** se chama "Biblioteca".
- Cada **estante** e uma folder no banco (mesmo schema — so o vocabulario muda na UI).
- Subpastas recursivas aparecem como **secoes** dentro de uma estante.

---

## 9. Animacoes e transicoes

Principio: **nada que atrapalhe a leitura**. Animacoes apenas onde ha significado.

```
Transicao entre telas     slide horizontal, 250ms, easing ease-in-out
Bottom sheet abrir        slide de baixo, 300ms, spring leve
Card swipe (acao)         segue o dedo, snap com spring ao soltar
Chip de filtro selecionar fade de cor, 150ms
Barra de progresso        sem animacao — atualiza no scroll
Highlights aparecem       fade-in, 200ms, ao entrar na tela de leitura
```

Sem: bounce excessivo, animacoes de entrada elaboradas em listas, parallax, blur animado.

---

## 10. Temas de leitura (configuravelis pelo usuario)

A tela de leitura tem 3 temas fixos:

| Theme   | Fundo    | Texto    | Link/acento |
|---------|----------|----------|-------------|
| Papel   | #FAF8F5  | #1C1917  | #C97B4B     |
| Sepia   | #F5ECD7  | #3B2E1A  | #A0621A     |
| Escuro  | #1A1916  | #E8E3DA  | #E09A6A     |

A escolha de tema de leitura e salva no MMKV e nao afeta o chrome da UI.

---

## 11. Acessibilidade minima

- Todo icone sem label de texto visivel recebe accessibilityLabel descritivo.
- Tamanho minimo de toque: 44x44px em qualquer elemento interativo.
- Contraste minimo: 4.5:1 para texto (WCAG AA).
- Respeitar reduceMotion: verificar com AccessibilityInfo.isReduceMotionEnabled().

---

## 12. O que este sistema proibe

- Sombras elevadas (elevation > 2, shadow com blur grande).
- Gradientes decorativos no chrome.
- Mais de um acento cromatico vivo por tela. Ambar e o unico.
- Texto abaixo de 11px em qualquer contexto.
- Botoes sem accessibilityLabel quando so tem icone.
- Telas de filtro separadas. Filtro sempre em bottom sheet ou chips inline.
- Termos "pasta", "diretorio", "arquivo" na UI voltada para o usuario.

---

## 13. Implementacao — tokens TypeScript

Criar o arquivo src/theme/tokens.ts:

```typescript
export const Colors = {
  papel:       '#FAF8F5',
  pergaminho:  '#EDE9E3',
  cinzaTerra:  '#9B9189',
  tinta:       '#1C1917',
  ambar:       '#C97B4B',
  musgo:       '#3B6D11',
  // highlight backgrounds
  hlAmarelo:   '#FEF3C7',
  hlCoral:     '#FDE8DF',
  hlVerde:     '#E0F2EE',
  hlRoxo:      '#EEEDFE',
} as const

export const Spacing = {
  xs: 4,  sm: 8,  md: 12,  lg: 16,  xl: 24,  xxl: 32,
} as const

export const Radius = {
  xs: 4,  sm: 8,  md: 12,  lg: 16,  xl: 24,  full: 9999,
} as const

export const FontSize = {
  micro: 11,  caption: 13,  body: 15,
  subtitle: 15,  title: 20,  display: 28,
} as const

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
}

export interface ReadingPrefs {
  fontSize:        number
  fontFamily:      'Georgia' | 'Merriweather' | 'Lora' | 'Inter' | 'Literata'
  backgroundColor: string
  textColor:       string
  lineHeight:      number
  theme:           'papel' | 'sepia' | 'escuro' | 'custom'
}
```

Arquivos a criar em src/theme/:
- tokens.ts     (acima)
- typography.ts (StyleSheet com TextStyle para cada token tipografico)
- ReadingThemes.ts (as 3 configuracoes de tema de leitura como objetos ReadingPrefs)

---

*Atualizar este documento sempre que um token ou padrao novo for introduzido.*