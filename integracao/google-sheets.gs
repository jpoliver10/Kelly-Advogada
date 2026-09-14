/**
 * Kelly Ferreira Advocacia · recebe os cadastros da landing page e grava na planilha.
 *
 * Como instalar (passo a passo completo no README, seção "Planilha do Google"):
 *  1. Crie uma planilha no Google Sheets com a conta do escritório.
 *  2. Menu Extensões > Apps Script. Apague o conteúdo e cole este arquivo inteiro. Salve.
 *  3. Implantar > Nova implantação > Tipo: App da Web.
 *     Executar como: Eu. Quem pode acessar: Qualquer pessoa.
 *  4. Autorize o acesso quando o Google pedir e copie a URL do App da Web (termina em /exec).
 *  5. Cole a URL em window.KF.planilhaUrl, no <head> do index.html.
 *
 * A primeira linha da aba "Cadastros" é criada sozinha com os nomes das colunas.
 * Se mudar este código depois, publique de novo em Implantar > Gerenciar implantações > Editar > Nova versão
 * (a URL continua a mesma).
 */

var ABA = 'Cadastros';

// Ordem das colunas na planilha. "abrir_whatsapp" é um link pronto para a Kelly chamar a pessoa.
var COLUNAS = [
  'data_hora', 'nome', 'whatsapp', 'cidade', 'abrir_whatsapp',
  'origem', 'oferta', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'pagina'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // evita linhas trocadas quando dois cadastros chegam ao mesmo tempo
  try {
    var p = (e && e.parameter) || {};

    // Isca para robôs: pessoas não veem o campo "empresa". Se veio preenchido, descarta sem avisar.
    if (p.empresa) return resposta({ ok: true });

    var nome = texto(p.nome, 80);
    var whatsapp = String(p.whatsapp || '').replace(/\D/g, '').slice(0, 11);
    var cidade = texto(p.cidade, 60);
    if (nome.length < 2 || whatsapp.length < 10 || cidade.length < 2) {
      return resposta({ ok: false, erro: 'dados_invalidos' });
    }

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS);
      aba.setFrozenRows(1);
    }

    var valores = {
      data_hora: new Date(),
      nome: nome,
      whatsapp: "'" + whatsapp,               // apóstrofo: o Sheets guarda como texto, sem virar número
      cidade: cidade,
      abrir_whatsapp: 'https://wa.me/55' + whatsapp
    };
    var linha = COLUNAS.map(function (coluna) {
      return coluna in valores ? valores[coluna] : texto(p[coluna], 200);
    });
    aba.appendRow(linha);

    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Abrir a URL do App da Web no navegador mostra {"ok":true,"status":"online"}: serve para testar a publicação.
function doGet() {
  return resposta({ ok: true, status: 'online' });
}

// Limpa o texto e impede "injeção de fórmula": nada que comece com = + - @ vira fórmula na planilha.
function texto(valor, max) {
  var t = String(valor || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
