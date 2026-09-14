# Landing page · Kelly Ferreira Advocacia

LP simples de conversão (não é site institucional) para tráfego do Meta Ads.
Objetivo único: a pessoa deixa **nome, WhatsApp e cidade** no formulário do fim da página, e o cadastro cai numa **planilha do Google**. O WhatsApp direto fica só no rodapé.
HTML + CSS + JS puros, sem framework e sem build. Oferta atual: **benefício negado ou cortado pelo INSS**.

```
index.html                   página (copy + configuração + CSS crítico do topo e do hero)
styles.css                   estilos abaixo da dobra
main.js                      formulário -> planilha, UTMs, Meta Pixel, barra fixa, carta, Lenis, FAQ
integracao/google-sheets.gs  script do Google que grava os cadastros na planilha
politica-de-privacidade.html rascunho LGPD (revisar antes de publicar)
img/kelly-hero.webp          foto da Kelly na hero, celular e desktop (524×532, 25KB)
img/hero-*.webp              foto anterior das mãos (Pexels), fora de uso; pode apagar se a foto da Kelly ficar
img/favicon.svg              favicon provisório (monograma KF)
img/apple-touch-icon.png     ícone iOS provisório
img/og-image.png             imagem de compartilhamento 1200×630
vendor/lenis.min.js          Lenis 1.3.26 (rolagem suave no desktop), servido localmente
vendor/lenis.css             CSS original da biblioteca (as regras já estão no styles.css)
```

---

## Antes de publicar: campos a preencher

Procure por `[PREENCHER]` em `index.html` e `politica-de-privacidade.html`.

| O quê | Onde |
|---|---|
| **URL da planilha** | `index.html`, bloco `window.KF`, campo `planilhaUrl`. Ver "Planilha do Google" abaixo. |
| **Número da OAB** | `index.html`: hero, "Quem vai acompanhar o seu caso" e rodapé. Também na política. Confira se a seccional é PE. |
| **Nome completo** | Hoje está "Kelly Ferreira". Se o nome na carteira da OAB for mais longo, use o completo no rodapé e na apresentação. |
| **Domínio** | Localize e substitua `SEU-DOMINIO.com.br` em `index.html` (canonical, og:url, og:image). |
| **Meta Pixel ID** | `window.KF.pixelId`. Vazio = Pixel desligado. |
| **WhatsApp do rodapé** | `window.KF.whatsapp` e os `href` do rodapé (localizar e substituir `5581991093631`). Confirme se o número atende ligação; se for só WhatsApp, apague a linha "Ligar para". |
| **Foto da Kelly** | Salve `img/kelly.webp` (800×1000, até ~80KB) e troque o bloco `.foto-provisoria` pelo `<img>` comentado logo acima dele. |
| **Logo** | O monograma KF é provisório. Troque o `<symbol id="i-kf">` no topo do `<body>` e `img/favicon.svg`. |
| **Política de privacidade** | Revise, preencha data e prazo de guarda e apague o aviso de rascunho. |

---

## Planilha do Google (cadastros)

O formulário envia os dados para um **App da Web do Google Apps Script**, que grava uma linha na planilha. Sem servidor e sem custo.

**Instalação (uma vez, com a conta Google do escritório):**
1. Crie uma planilha no Google Sheets, por exemplo "Cadastros LP Kelly".
2. Menu **Extensões > Apps Script**. Apague o que estiver lá, cole o conteúdo de `integracao/google-sheets.gs` e salve.
3. **Implantar > Nova implantação**. Em "Tipo", escolha **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Autorize quando o Google pedir. Copie a **URL do App da Web** (termina em `/exec`).
5. Abra a URL no navegador: tem que aparecer `{"ok":true,"status":"online"}`.
6. Cole a URL em `window.KF.planilhaUrl`, no `<head>` do `index.html`, e publique a página.
7. Faça um cadastro de teste. A aba **Cadastros** é criada sozinha, com a linha de títulos.

**Colunas gravadas:** `data_hora`, `nome`, `whatsapp`, `cidade`, `abrir_whatsapp` (link pronto para a Kelly chamar a pessoa), `origem` (qual botão levou ao formulário: `hero`, `topo`, `passos`, `barra-fixa`; `formulario` quando a pessoa rolou até ele sem clicar em botão), `oferta`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `pagina`.

**Proteções já incluídas:**
- Campo-isca invisível contra robôs: se vier preenchido, nada é gravado.
- Trava contra dois cadastros simultâneos embaralharem as linhas.
- Validação dos dados também no servidor.
- Nada que a pessoa digite vira fórmula na planilha.

**Enquanto `planilhaUrl` estiver vazio** (antes da integração), o formulário não perde o cadastro: ao enviar, abre o WhatsApp da Kelly com nome, telefone e cidade já escritos, e a pessoa só toca em enviar.

**Se mudar o script depois:** Implantar > Gerenciar implantações > editar (lápis) > Versão: Nova versão. A URL continua a mesma.

---

## Como funciona a página

- **Formulário no fim da página**, dentro do fechamento ("Você não precisa chegar com tudo organizado."). Campos: nome, WhatsApp (com máscara e validação de DDD) e cidade/UF; no celular, um campo por linha. Erros aparecem embaixo de cada campo, com a correção ("Confira o número com DDD. Exemplo: (81) 99999-9999."). Depois do envio aparece "Recebemos seu contato".
- **Botões "Pedir contato da Kelly"** (hero, cabeçalho, "Como funciona" e barra fixa do celular) levam ao formulário e colocam o cursor no campo de nome quando a rolagem termina.
- **Barra fixa (celular):** aparece quando o botão do hero sai da tela e some quando outro botão está visível, ao chegar no formulário e depois do cadastro enviado.
- **WhatsApp direto:** só no rodapé.
- **Carta ilustrativa:** fica na seção "Talvez você já tenha dito alguma destas frases". O grifo dourado se desenha quando ela entra na tela.
- **FAQ:** abre e fecha suave, uma resposta por vez. Velocidade em `FAQ_MS` no `main.js`.
- **Rolagem suave (Lenis):** só em desktop com mouse ou trackpad e sem "reduzir movimento". No celular a rolagem é nativa e o arquivo nem é baixado. Ajuste `lerp` no bloco 8 do `main.js`; para desligar, apague `startLenis();`.

---

## Medição

**Meta Pixel:**
- `PageView` no carregamento.
- **`Lead` no envio do formulário.** O clique nos botões não conta como lead. Parâmetros enviados: `content_name` (origem), `content_category` (oferta), `utm_campaign` e `utm_content`.
- `Contact` no clique do WhatsApp do rodapé.

O script da Meta só baixa depois do `load`, para não atrasar a página; eventos disparados antes ficam em fila.

**UTMs:** guardadas na sessão e gravadas em colunas próprias na planilha. Modelo de URL para os anúncios:
```
https://SEU-DOMINIO.com.br/?utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content=fb02
```
Use no `utm_content` um código curto por anúncio (`fb01`, `fb02`, `ig01`...). Ele também vai como `Cód. R-FB02` no fim da mensagem do WhatsApp do rodapé e na mensagem do modo sem planilha.

---

## Trocar a oferta

Toda a copy está em `index.html`. Os trechos que mudam por oferta estão marcados com `<!-- OFERTA -->` (título, subtítulo e frase do hero, e a carta ilustrativa). Troque também `oferta` em `window.KF`, o `<title>`, a `meta description` e o `og:title`.

**BPC/LOAS**
- Título: `Cuidar de quem tem deficiência já exige muito. Entender o BPC não precisa ser mais um peso.`
- Subtítulo: `BPC/LOAS para pessoa com deficiência ou idosa`
- Corpo: `A Kelly explica, em palavras simples, quem tem direito, quais documentos juntar e como funciona o pedido no INSS.`
- Carta: "Benefício" = `benefício assistencial à pessoa com deficiência`; motivo = `renda per capita familiar superior ao limite legal`. Nota: `Traduzindo: indeferido quer dizer negado. O INSS achou que a renda da família passou do limite. Esse cálculo tem regras e exceções, e é por aí que a análise começa.`
- Frentes: mova o BPC/LOAS para o topo do grupo "Qual benefício".

**Auxílio por incapacidade temporária (antigo auxílio-doença)**
- Título: `Quando a doença obriga a parar, a última coisa que você precisa é se perder no INSS.`
- Subtítulo: `Auxílio por incapacidade temporária, o antigo auxílio-doença`
- Corpo: `A Kelly orienta o pedido e a perícia: o que levar, como organizar os laudos e o que esperar de cada etapa.`

**Aposentadoria por incapacidade permanente**
- Título: `Quando voltar a trabalhar deixou de ser possível, você precisa de alguém que explique o caminho com clareza.`
- Subtítulo: `Aposentadoria por incapacidade permanente, a antiga aposentadoria por invalidez`
- Corpo: `A Kelly explica quem tem direito, como funciona a perícia e o que fazer se o INSS entender diferente do seu médico.`
- Carta: "Benefício" = `aposentadoria por incapacidade permanente`.

Se mudar o título ou o corpo do hero, confira em 360×640 se o botão "Pedir contato da Kelly" continua na primeira tela (hoje ele termina em 568px).

---

## Foto da hero

Foto da própria Kelly, tirada da arte enviada pelo escritório (724×532). No recorte `img/kelly-hero.webp`, o logo embutido foi apagado (o logo já está no cabeçalho), o creme do fundo foi acertado para `#F4EDE3` e a borda esquerda foi cortada em x=200.
- **Celular:** faixa no topo da hero, com o título subindo sobre o fim esmaecido da foto.
- **Desktop:** a foto ocupa a metade direita da grade, alinhada ao conteúdo e não à borda da tela, com a Kelly perto do centro. As laterais e a base se dissolvem no creme (máscara em degradê), sem corte reto.
- **Entrada:** ao carregar, a foto "assenta" devagar (escala e leve subida, 1,6s). Só usa transform, então não atrasa o LCP, e fica desligada para quem pede menos movimento.

**Resolução:** a arte tem só 532px de altura e, no desktop, aparece ampliada cerca de 1,4×. Para ficar nítida, peça o arquivo original em alta (ideal: 1600px de altura ou mais). Depois, rode o mesmo recorte e troque o arquivo.

Para trocar:
1. Gere um novo `kelly-hero.webp` (fundo creme `#F4EDE3`, sem logo) e atualize `width`/`height` no `<img>`.
2. Ajuste `--foto-pos-mobile` e `--foto-pos-desktop` no CSS do `<head>`.
3. Confira em 360×640 se o botão da hero continua na primeira tela.

A foto anterior (mãos de um casal idoso, T Leish no Pexels, ID 6975092, Pexels License) continua em `img/hero-*.webp`, caso queira voltar.

---

## Publicar

Site estático: basta subir a pasta inteira (Netlify Drop, Cloudflare Pages, Vercel ou FTP em `public_html/`). Depois:
1. Ative HTTPS.
2. Teste o link no **Depurador de Compartilhamento** da Meta.
3. Rode o **PageSpeed Insights** mobile.
4. Faça um cadastro real e confira: a linha na planilha e o `Lead` em **Gerenciador de Eventos > Testar eventos**.

Para testar localmente: `python -m http.server 5500` dentro da pasta.

---

## Checklist de compliance (Provimento 205/2021 CFOAB) e LGPD · para a Kelly aprovar

- [ ] Nome completo e número da OAB corretos no hero, na apresentação e no rodapé
- [ ] Nenhuma frase promete, garante ou sugere resultado
- [ ] Nenhum termo mercantil: promoção, desconto, oferta, vagas, condição especial, consulta grátis
- [ ] Sem depoimentos, prints de conversa, valores recebidos ou casos identificáveis; a foto da hero é da própria Kelly e as pessoas ao fundo não são identificáveis
- [ ] Sem superlativos e sem "especialista"; "atuação exclusiva em Direito Previdenciário" é verdadeiro
- [ ] "Pedir contato não obriga você a contratar nada" e a resposta "Quanto custa?" batem com a forma real de trabalho
- [ ] Prazo de 30 dias para recurso administrativo e regras de BPC e perícia corretos na redação atual
- [ ] Carta ilustrativa marcada como "Modelo ilustrativo", sem logo do INSS
- [ ] Formulário pede só nome, WhatsApp e cidade (nada de saúde ou CPF) e tem link para a política
- [ ] Política de privacidade revisada, citando formulário, Google Sheets e Meta Pixel
- [ ] A planilha é compartilhada só com quem atende os cadastros
- [ ] Os anúncios que apontam para a página seguem as mesmas regras

## Checklist técnico antes de subir

- [ ] Nenhum `[PREENCHER]` sobrando (`grep -r "PREENCHER" .`)
- [ ] `SEU-DOMINIO.com.br` substituído
- [ ] `planilhaUrl` preenchida e um cadastro de teste gravado na planilha, com UTMs
- [ ] Evento `Lead` aparecendo no Gerenciador de Eventos ao enviar o formulário
- [ ] WhatsApp do rodapé testado no celular
- [ ] PageSpeed mobile acima de 90

---

## Design, em resumo

- **Paleta:** só os hexes da marca.
  - `#F4EDE3` creme, `#2F2E2B` tinta e `#4A4845` corpo.
  - `#A8894F` dourado, só em filetes, grifos e ícones.
  - `#8C6F3C` dourado escuro, para texto dourado a partir de 24px e bordas dos campos.
  - `#FFFFFF` branco, no painel do formulário, na carta e na faixa dos passos.
- **Contraste:** o dourado claro dá só 2,8:1 sobre o creme, por isso nunca aparece em texto.
- **Tipos:** Fraunces 400 e itálico (títulos, falas, numerais) e Poppins 400/500 (texto, formulário, botões). São 4 arquivos de fonte.
- **Estrutura:** hero com texto e botão à esquerda e a foto da Kelly à direita (no celular, a foto vem por cima do título). Depois disso, todas as seções seguem a mesma grade, com o título na coluna esquerda (1/3) e o conteúdo na direita (2/3). O formulário fecha a página, no fechamento.
- **Assinatura:** a carta de decisão do INSS com o motivo circulado e traduzido, logo depois das falas de reconhecimento.

---

## Métricas medidas

Chrome via DevTools Protocol, servidor local, celular 360×640, rede **Slow 4G do Lighthouse** (150ms RTT, 1,6 Mbps) e **CPU 4x mais lenta**. Três rodadas sem cache, com a foto da Kelly na hero:

| Métrica | Rodada 1 (fria) | Rodada 2 | Rodada 3 | Meta |
|---|---|---|---|---|
| LCP (elemento: foto da hero) | 2,00s | 1,65s | 1,68s | < 2,0s |
| CLS | 0 | 0,0008 | 0 | < 0,05 |

A primeira rodada, com conexões frias, fica no limite da meta (entre 2,00s e 2,06s nas medições). O peso total da primeira tela é de ~105KB. Em produção, some o TTFB do servidor (~100 a 300ms numa CDN).

**Peso transferido no celular:** ~95KB no total, somando HTML 10,1KB, CSS 4,1KB, JS 5,8KB, fontes ~57KB, foto 15KB e o CSS do Google Fonts ~5KB (valores compactados).
- **Com o Meta Pixel ligado:** +~90KB, baixados depois do carregamento.
- **Com a foto real da Kelly:** +60 a 80KB, carregada só quando a pessoa rola até ela.
- **O Lenis (+5KB)** só é baixado no desktop.
