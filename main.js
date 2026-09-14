/* =========================================================
   Kelly Ferreira Advocacia · comportamento da landing page
   1. UTMs guardadas na sessão
   2. Meta Pixel (PageView no load, Lead no envio do formulário)
   3. WhatsApp do rodapé (único link direto)
   4. Botões "Pedir contato" levam ao formulário
   5. Formulário -> planilha do Google (Apps Script)
   6. Barra fixa "Pedir contato" no celular
   7. Grifo da carta ilustrativa
   8. Rolagem suave (Lenis) no desktop
   9. Cabeçalho transparente sobre a foto; ganha fundo ao rolar
   10. FAQ com abertura suave, uma resposta por vez
   Configuração em window.KF, no <head> do index.html.
   ========================================================= */
(function () {
  'use strict';

  var cfg = window.KF || {};
  var phone = String(cfg.whatsapp || '').replace(/\D/g, '');
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var STORE_KEY = 'kf_utm';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var forEach = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---------- 1. UTMs ---------- */
  function getUtms() {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch (e) { saved = {}; }
    var params = new URLSearchParams(window.location.search);
    var fresh = {};
    var hasFresh = false;
    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) { fresh[key] = value.trim().slice(0, 80); hasFresh = true; }
    });
    // UTMs novas na URL substituem as da sessão (novo clique em anúncio).
    if (hasFresh) {
      saved = fresh;
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(fresh)); } catch (e) { /* modo privado */ }
    }
    return saved;
  }
  var utms = getUtms();

  function clean(value) { return String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase(); }

  /* ---------- 2. Meta Pixel ---------- */
  // Stub criado já (sem rede) para enfileirar eventos; o fbevents.js só baixa
  // depois do load, para não competir com o LCP em 4G.
  function setupPixel() {
    if (!cfg.pixelId || window.fbq) return;
    var n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    window.fbq('init', cfg.pixelId);
    window.fbq('track', 'PageView');
    function inject() {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://connect.facebook.net/pt_BR/fbevents.js';
      document.head.appendChild(s);
    }
    var later = function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(inject, { timeout: 2500 });
      else setTimeout(inject, 1);
    };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  }
  setupPixel();

  function track(eventName, params) {
    if (typeof window.fbq === 'function') window.fbq('track', eventName, params || {});
  }

  /* ---------- 3. WhatsApp do rodapé ---------- */
  // Mensagem pronta + código curto do anúncio (utm_content), ex.: "Cód. R-FB02".
  function waHref(link) {
    var msg = link.getAttribute('data-msg') || 'Olá, Kelly! Vim pelo site.';
    var origin = clean(utms.utm_content).slice(0, 10) || clean(utms.utm_source).slice(0, 3);
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg + (origin ? '\n\nCód. R-' + origin : ''));
  }
  forEach(document.querySelectorAll('a[data-wa]'), function (link) {
    if (phone) link.href = waHref(link);
    link.addEventListener('click', function () { track('Contact', { content_name: 'rodape-whatsapp' }); });
  });

  /* ---------- 4. Botões "Pedir contato" ---------- */
  // Levam ao formulário no fim da página, guardam de qual botão veio (coluna "origem" da planilha)
  // e colocam o cursor no campo de nome quando a rolagem termina.
  var origem = 'formulario';
  var enviado = false;
  var campoNome = document.getElementById('f-nome');
  var alvoCadastro = document.getElementById('cadastro');
  forEach(document.querySelectorAll('a[href="#cadastro"]'), function (link) {
    link.addEventListener('click', function (e) {
      origem = link.getAttribute('data-cta') || 'link';
      var focar = function () { if (campoNome && !enviado) campoNome.focus({ preventScroll: true }); };
      if (!alvoCadastro) return;
      // A página faz a rolagem em vez do navegador: a navegação nativa para #cadastro
      // limpa o foco depois que ele é aplicado, e o cursor não ficaria no campo de nome.
      e.preventDefault();
      if (window.lenis) {
        // Desktop com rolagem suave: o caminho é longo, então foca só quando chegar.
        e.stopPropagation(); // evita que o Lenis dispare uma segunda rolagem pelo mesmo link
        window.lenis.scrollTo(alvoCadastro, { onComplete: focar });  // posição vem do scroll-padding/scroll-margin do CSS
      } else {
        alvoCadastro.scrollIntoView({ block: 'start' });
        focar();
      }
    });
  });

  /* ---------- 5. Formulário -> planilha ---------- */
  var form = document.getElementById('form-cadastro');
  var okBox = document.getElementById('cadastro-ok');

  function digits(v) { return String(v || '').replace(/\D/g, ''); }

  function maskPhone(v) {
    var d = digits(v).slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  if (form && okBox) {
    var campos = { nome: form.elements.nome, whatsapp: form.elements.whatsapp, cidade: form.elements.cidade };
    var ordem = ['nome', 'whatsapp', 'cidade'];
    var statusEl = form.querySelector('.form__status');
    var botao = form.querySelector('button[type="submit"]');
    var textoBotao = botao.textContent;
    var enviando = false;

    var validar = {
      nome: function (v) { return v.trim().length >= 2 ? '' : 'Escreva seu nome.'; },
      whatsapp: function (v) {
        var d = digits(v);
        return (d.length === 10 || d.length === 11) && d.charAt(0) !== '0'
          ? '' : 'Confira o número com DDD. Exemplo: (81) 99999-9999.';
      },
      cidade: function (v) { return v.trim().length >= 2 ? '' : 'Escreva sua cidade e o estado. Exemplo: Recife/PE.'; }
    };

    function setErro(input, msg) {
      var box = input.closest('.campo');
      var el = document.getElementById(input.getAttribute('aria-describedby'));
      if (msg) {
        box.setAttribute('data-erro', '');
        input.setAttribute('aria-invalid', 'true');
        el.textContent = msg;
        el.hidden = false;
      } else {
        box.removeAttribute('data-erro');
        input.removeAttribute('aria-invalid');
        el.textContent = '';
        el.hidden = true;
      }
    }

    campos.whatsapp.addEventListener('input', function () {
      campos.whatsapp.value = maskPhone(campos.whatsapp.value);
    });
    // Depois de um erro, a mensagem some assim que o campo fica certo.
    ordem.forEach(function (k) {
      campos[k].addEventListener('input', function () {
        if (campos[k].hasAttribute('aria-invalid')) setErro(campos[k], validar[k](campos[k].value));
      });
    });

    function sucesso(dados, viaWhatsapp) {
      enviado = true;
      okBox.querySelector('[data-ok-whats]').textContent = maskPhone(dados.whatsapp);
      okBox.querySelector('[data-ok="planilha"]').hidden = !!viaWhatsapp;
      okBox.querySelector('[data-ok="whatsapp"]').hidden = !viaWhatsapp;
      form.hidden = true;
      okBox.hidden = false;
      okBox.focus();
      document.dispatchEvent(new CustomEvent('kf:cadastro'));
    }

    function enviar(dados) {
      enviando = true;
      botao.disabled = true;
      botao.setAttribute('aria-busy', 'true');
      botao.textContent = 'Enviando…';
      statusEl.textContent = '';
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

      fetch(cfg.planilhaUrl, { method: 'POST', body: new URLSearchParams(dados), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (!res || res.ok === false) throw new Error((res && res.erro) || 'falha');
          track('Lead', {
            content_name: dados.origem,
            content_category: cfg.oferta || '',
            utm_campaign: dados.utm_campaign,
            utm_content: dados.utm_content
          });
          sucesso(dados, false);
        })
        .catch(function () {
          statusEl.textContent = 'Não foi possível enviar agora. Confira sua internet e tente de novo.';
        })
        .then(function () {
          clearTimeout(timer);
          enviando = false;
          botao.disabled = false;
          botao.removeAttribute('aria-busy');
          botao.textContent = textoBotao;
        });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) return;

      var primeiroErro = null;
      ordem.forEach(function (k) {
        var msg = validar[k](campos[k].value);
        setErro(campos[k], msg);
        if (msg && !primeiroErro) primeiroErro = campos[k];
      });
      if (primeiroErro) { primeiroErro.focus(); return; }

      var dados = {
        nome: campos.nome.value.trim(),
        whatsapp: digits(campos.whatsapp.value),
        cidade: campos.cidade.value.trim(),
        origem: origem,
        oferta: cfg.oferta || '',
        pagina: window.location.origin + window.location.pathname,
        empresa: form.elements.empresa.value
      };
      UTM_KEYS.forEach(function (k) { dados[k] = utms[k] || ''; });

      // Robô preencheu a isca: finge que deu certo e não envia nada.
      if (dados.empresa) { sucesso(dados, false); return; }

      // Planilha ainda não configurada: abre o WhatsApp da Kelly com os dados, para não perder o cadastro.
      if (!cfg.planilhaUrl) {
        var msg = 'Olá, Kelly! Vim pelo site e quero atendimento.\n' +
          'Nome: ' + dados.nome + '\nWhatsApp: ' + maskPhone(dados.whatsapp) + '\nCidade: ' + dados.cidade;
        var codigo = clean(dados.utm_content).slice(0, 10);
        if (codigo) msg += '\n\nCód. ' + codigo;
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        track('Lead', { content_name: dados.origem, content_category: cfg.oferta || '', utm_campaign: dados.utm_campaign, utm_content: dados.utm_content });
        sucesso(dados, true);
        return;
      }

      enviar(dados);
    });
  }

  /* ---------- 6. Barra fixa (celular) ---------- */
  // Aparece quando o botão do hero sai da tela por cima. Some quando qualquer outro botão
  // "Pedir contato" está visível, ao chegar no fechamento (onde está o formulário)
  // e depois do cadastro enviado.
  var bar = document.getElementById('fixo');
  var heroCta = document.getElementById('cta-hero');
  var closing = document.getElementById('fechamento');
  var inflow = document.querySelectorAll('main .btn');

  if (bar && heroCta && closing && 'IntersectionObserver' in window) {
    var heroPassed = false;
    var closingReached = false;
    var visible = [];

    var update = function () {
      var anyVisible = visible.some(function (v) { return v; });
      bar.classList.toggle('is-on', !enviado && heroPassed && !closingReached && !anyVisible);
    };

    new IntersectionObserver(function (entries) {
      var e = entries[0];
      heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(heroCta);

    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[Array.prototype.indexOf.call(inflow, e.target)] = e.isIntersecting; });
      update();
    });
    forEach(inflow, function (btn) { ctaObserver.observe(btn); });

    new IntersectionObserver(function (entries) {
      var e = entries[0];
      closingReached = e.isIntersecting || e.boundingClientRect.top < 0;
      update();
    }).observe(closing);

    document.addEventListener('kf:cadastro', update);
  }

  /* ---------- 7. Grifo da carta ---------- */
  // Dispara quando metade da folha está na tela.
  var carta = document.getElementById('carta');
  var folha = carta && carta.querySelector('.carta__pilha');
  if (carta && folha) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { carta.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(folha);
    } else {
      carta.classList.add('is-in');
    }
  }

  /* ---------- 8. Rolagem suave (Lenis, vendor/lenis.min.js) ---------- */
  // Só em telas com mouse ou trackpad e sem "reduzir movimento" ligado no sistema.
  // No celular a rolagem continua nativa e o arquivo nem é baixado.
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function startLenis() {
    if (window.lenis || !finePointer.matches || reduceMotion.matches) return;
    var s = document.createElement('script');
    s.src = 'vendor/lenis.min.js';
    s.async = true;
    s.onload = function () {
      if (typeof window.Lenis !== 'function' || reduceMotion.matches) return;
      window.lenis = new window.Lenis({
        lerp: 0.1,                  // quanto menor, mais "macio" (0.1 é o padrão da biblioteca)
        autoRaf: true,
        anchors: true,              // links #âncora: o Lenis já respeita o scroll-padding-top do CSS (abaixo do cabeçalho fixo)
        stopInertiaOnNavigate: true
      });
    };
    document.head.appendChild(s);
  }
  startLenis();

  // Se a pessoa ligar "reduzir movimento" com a página aberta, volta à rolagem nativa.
  var onReduce = function (e) { if (e.matches && window.lenis) { window.lenis.destroy(); window.lenis = null; } };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onReduce);

  /* ---------- 9. Cabeçalho transparente sobre a foto; ganha fundo ao rolar ---------- */
  // No topo da página o cabeçalho deixa o céu da foto aparecer. Assim que a pessoa rola,
  // ele recebe .is-solido (fundo creme translúcido no desktop, onde fica fixo).
  var topo = document.querySelector('.topo');
  if (topo) {
    var topoPendente = false;
    var atualizaTopo = function () { topoPendente = false; topo.classList.toggle('is-solido', window.scrollY > 24); };
    window.addEventListener('scroll', function () {
      if (!topoPendente) { topoPendente = true; window.requestAnimationFrame(atualizaTopo); }
    }, { passive: true });
    atualizaTopo();
  }

  /* ---------- 10. FAQ com abertura suave, uma resposta por vez ---------- */
  // Mantém o <details> nativo (teclado, leitor de tela e Ctrl+F continuam funcionando)
  // e só anima a altura. Com "reduzir movimento", abre e fecha na hora, como o padrão.
  var FAQ_MS = 380;
  var FAQ_EASE = 'cubic-bezier(.16,1,.3,1)';
  var faqItems = document.querySelectorAll('.faq details');

  function closeOthers(current) {
    forEach(faqItems, function (o) {
      if (o === current || !o.open || o.classList.contains('is-closing')) return;
      if (o._faqCollapse && !reduceMotion.matches) o._faqCollapse(); else o.open = false;
    });
  }

  forEach(faqItems, function (d) {
    // Cobre também a abertura nativa (reduzir movimento, Ctrl+F abrindo a resposta sozinho).
    d.addEventListener('toggle', function () {
      if (d.open && !d.classList.contains('is-closing')) closeOthers(d);
    });

    var summary = d.querySelector('summary');
    var answer = summary.nextElementSibling;
    var anim = null;

    function run(from, to, done) {
      d.style.overflow = 'hidden';
      anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: FAQ_MS, easing: FAQ_EASE });
      anim.onfinish = function () {
        anim = null;
        d.style.overflow = '';
        if (done) done();
      };
    }

    function stop() { if (anim) { anim.cancel(); anim = null; } }

    function expand() {
      var from = d.offsetHeight;           // altura atual (inclusive no meio de uma animação)
      stop();
      d.classList.remove('is-closing');
      closeOthers(d);                      // cobre também reabrir no meio do fechamento (sem evento toggle)
      d.open = true;
      var to = d.offsetHeight;
      run(from, to);
      if (answer) answer.animate(
        { opacity: [0, 1], transform: ['translateY(-6px)', 'none'] },
        { duration: FAQ_MS, easing: FAQ_EASE }
      );
    }

    function collapse() {
      var from = d.offsetHeight;
      stop();
      d.classList.add('is-closing');
      var border = d.offsetHeight - d.clientHeight;
      var to = summary.offsetHeight + border;
      run(from, to, function () {
        d.open = false;
        d.classList.remove('is-closing');
      });
    }

    d._faqCollapse = collapse;             // usado por closeOthers para fechar esta resposta animada

    summary.addEventListener('click', function (e) {
      if (reduceMotion.matches || typeof d.animate !== 'function') return; // comportamento nativo
      e.preventDefault();
      if (d.open && !d.classList.contains('is-closing')) collapse(); else expand();
    });
  });

  /* ---------- Ano do rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  window.KF_READY = true;
})();
