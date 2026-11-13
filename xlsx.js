"use strict";
// Gera o CONTAS_.xlsx (sem bibliotecas). Mesmo código usado no painel do Claude.
  var ENC = new TextEncoder();
  var CRCT = (function () { var t = [], n, k, c; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF, i; for (i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipStore(files) {
    var parts = [], cd = [], off = 0;
    files.forEach(function (f) {
      var nm = ENC.encode(f.name), data = ENC.encode(f.text), crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nm, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      cd.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + data.length;
    });
    var cdLen = cd.reduce(function (a, p) { return a + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdLen, true); e.setUint32(16, off, true);
    var all = parts.concat(cd, [new Uint8Array(e.buffer)]), tot = all.reduce(function (a, p) { return a + p.length; }, 0), out = new Uint8Array(tot), pos = 0;
    all.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }
  function xe(v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function colL(n) { var o = ""; while (n > 0) { var m = (n - 1) % 26; o = String.fromCharCode(65 + m) + o; n = Math.floor((n - 1) / 26); } return o; }
  function serial(ym) { var p = ym.split("-").map(Number); return Math.round((Date.UTC(p[0], p[1] - 1, 1) - Date.UTC(1899, 11, 30)) / 86400000); }

  /* estilos (índices de cellXfs) */
  var S = { def: 0, head: 1, brl: 2, mon: 3, ctr: 4, totBrl: 5, totLbl: 6, bold: 7, note: 8, title: 9, boldBrl: 10, int: 11, totInt: 12 };
  var STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00;[Red]-&quot;R$&quot; #,##0.00;&quot;-&quot;"/><numFmt numFmtId="165" formatCode="mmm/yyyy"/><numFmt numFmtId="166" formatCode="&quot;R$&quot; #,##0.00;[Red]-&quot;R$&quot; #,##0.00"/></numFmts>' +
    '<fonts count="5"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font><font><i/><sz val="9"/><color rgb="FF595959"/><name val="Arial"/></font><font><b/><sz val="14"/><name val="Arial"/></font></fonts>' +
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F5D62"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF1F0"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="13">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf numFmtId="164" fontId="2" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>' +
    '<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
    '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf numFmtId="1" fontId="2" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '<dxfs count="2"><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFDDEFE3"/><bgColor rgb="FFDDEFE3"/></patternFill></fill></dxf><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFBF0CF"/><bgColor rgb="FFFBF0CF"/></patternFill></fill></dxf></dxfs></styleSheet>';

  function Sheet() { this.cells = {}; this.widths = []; this.rowH = {}; this.extra = ""; this.pane = ""; this.maxR = 0; this.maxC = 0; }
  Sheet.prototype.set = function (r, c, v, s, f) { this.cells[r + "," + c] = { v: v, s: s || 0, f: f }; if (r > this.maxR) this.maxR = r; if (c > this.maxC) this.maxC = c; };

  function buildXlsx(gastos, receitas, nowYm) {
    var CATL = ["Moradia", "Contas", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Dívidas", "Outros", "Reserva"];
    var PARAL = ["Ana", "Bruno", "Carla"];
    var FORMA = { debito: "Débito", credito: "Crédito", pix: "Pix", va: "Vale-alimentação" };
    var ORD = { "Conta": 0, "Ajuste": 1, "A receber": 2 };
    var p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    var r2 = function (x) { return Math.round(x * 100) / 100; };
    var rows = [];
    (gastos || []).forEach(function (g) {
      if (!g.data) return;
      var aj = g.tipo === "ajuste";
      rows.push({ k: g.id || "", d: g.data, t: g.criadoEm || 0, ym: g.data.slice(0, 7), tipo: aj ? "Ajuste" : "Conta", desc: g.descricao || "", cat: aj ? null : (g.categoria || "Outros"), valor: g.valor || 0, para: g.para || null, parc: g.parcelas > 1 ? g.parcela : null, tot: g.parcelas > 1 ? g.parcelas : null, forma: FORMA[g.meio] || null, status: g.pago === false ? "Pendente" : "Pago", obs: g.obs || null });
    });
    (receitas || []).forEach(function (r) {
      if (!r.data) return;
      rows.push({ k: r.id || "", d: r.data, t: r.criadoEm || 0, ym: r.data.slice(0, 7), tipo: "A receber", desc: r.descricao || "", cat: null, valor: r.valor || 0, para: null, parc: null, tot: null, forma: r.tipo === "va" ? "Vale-alimentação" : null, status: "Recebido", obs: null });
    });
    rows.sort(function (a, b) {
      if (a.ym !== b.ym) return a.ym < b.ym ? -1 : 1;
      if (a.tipo !== b.tipo) return ORD[a.tipo] - ORD[b.tipo];
      if (a.d !== b.d) return a.d < b.d ? -1 : 1;
      if (a.t !== b.t) return a.t - b.t;
      return a.k < b.k ? -1 : a.k > b.k ? 1 : 0;
    });
    rows.forEach(function (r, i) { r.n = i + 1; });
    var sum = function (pred) { return r2(rows.filter(pred).reduce(function (a, r) { return a + r.valor; }, 0)); };

    var yms = rows.map(function (r) { return r.ym; }); yms.push(nowYm); yms.sort();
    var months = [], cur = yms[0], lastYm = yms[yms.length - 1];
    while (cur <= lastYm && months.length < 36) { months.push(cur); var pp = cur.split("-").map(Number); var nx = new Date(pp[0], pp[1], 1); cur = nx.getFullYear() + "-" + p2(nx.getMonth() + 1); }

    var strs = [], sidx = {};
    function ss(t) { if (!(t in sidx)) { sidx[t] = strs.length; strs.push(t); } return sidx[t]; }
    function sheetXml(sh, tail) {
      var o = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
      o += '<sheetViews><sheetView workbookViewId="0"' + (sh.first ? ' tabSelected="1"' : "") + ">" + sh.pane + "</sheetView></sheetViews><sheetFormatPr defaultRowHeight=\"13.5\"/>";
      if (sh.widths.length) o += "<cols>" + sh.widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols>";
      o += "<sheetData>";
      for (var r = 1; r <= sh.maxR; r++) {
        var cs = "";
        for (var c = 1; c <= sh.maxC; c++) {
          var cell = sh.cells[r + "," + c]; if (!cell) continue;
          var ref = colL(c) + r, v = cell.v, s = cell.s ? ' s="' + cell.s + '"' : "";
          if (cell.f != null) {
            if (typeof v === "string") cs += '<c r="' + ref + '"' + s + ' t="str"><f>' + xe(cell.f) + "</f><v>" + xe(v) + "</v></c>";
            else cs += '<c r="' + ref + '"' + s + "><f>" + xe(cell.f) + "</f><v>" + v + "</v></c>";
          } else if (v == null || v === "") cs += '<c r="' + ref + '"' + s + "/>";
          else if (typeof v === "number") cs += '<c r="' + ref + '"' + s + "><v>" + v + "</v></c>";
          else cs += '<c r="' + ref + '"' + s + ' t="s"><v>' + ss(String(v)) + "</v></c>";
        }
        o += '<row r="' + r + '"' + (sh.rowH[r] ? ' ht="' + sh.rowH[r] + '" customHeight="1"' : "") + ">" + cs + "</row>";
      }
      return o + "</sheetData>" + (tail || "") + "</worksheet>";
    }

    /* Lançamentos */
    var lc = new Sheet(); lc.first = true;
    var HEADS = ["ID", "Mês", "Tipo", "Descrição", "Categoria", "Valor (R$)", "Passar para", "Parcela", "Total de parcelas", "Forma de pagamento", "Status", "Observação"];
    HEADS.forEach(function (h, j) { lc.set(1, j + 1, h, S.head); });
    lc.rowH[1] = 30;
    rows.forEach(function (r, i) {
      var q = i + 2;
      lc.set(q, 1, r.n, S.ctr); lc.set(q, 2, serial(r.ym), S.mon); lc.set(q, 3, r.tipo); lc.set(q, 4, r.desc); lc.set(q, 5, r.cat);
      lc.set(q, 6, r.valor, S.brl); lc.set(q, 7, r.para); lc.set(q, 8, r.parc, S.ctr); lc.set(q, 9, r.tot, S.ctr); lc.set(q, 10, r.forma); lc.set(q, 11, r.status); lc.set(q, 12, r.obs);
    });
    lc.widths = [6, 11, 11, 28, 14, 14, 13, 9, 11, 18, 11, 50];
    lc.pane = '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>';
    var LISTS = [["Tipo", ["Conta", "A receber", "Ajuste"]], ["Categoria", CATL], ["Passar para", PARAL], ["Forma de pagamento", ["Débito", "Crédito", "Pix", "Vale-alimentação", "Boleto", "Dinheiro"]], ["Status", ["Pendente", "Pago", "Recebido", "A definir"]]];
    var DV = [["C", 0], ["E", 1], ["G", 2], ["J", 3], ["K", 4]];
    var last = rows.length + 1;
    var dvx = '<dataValidations count="' + DV.length + '">' + DV.map(function (d) {
      var L = String.fromCharCode(65 + d[1]), n = LISTS[d[1]][1].length + 1;
      return '<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Opção inválida" error="Escolha uma opção da lista (aba Listas)." sqref="' + d[0] + '2:' + d[0] + '500"><formula1>Listas!$' + L + "$2:$" + L + "$" + n + "</formula1></dataValidation>";
    }).join("") + "</dataValidations>";
    var cfx = '<conditionalFormatting sqref="K2:K500"><cfRule type="expression" dxfId="0" priority="1"><formula>$K2="Pago"</formula></cfRule><cfRule type="expression" dxfId="1" priority="2"><formula>$K2="Pendente"</formula></cfRule></conditionalFormatting>';

    /* Resumo */
    var rs = new Sheet();
    rs.set(1, 1, "Resumo mensal", S.title);
    rs.set(2, 1, "Tudo aqui é calculado a partir da aba Lançamentos. Não digite nada nesta aba.", S.note);
    ["Mês", "Contas", "Ajustes", "Total a pagar", "A receber", "Saldo do mês", "Já pago", "Falta pagar", "Passar para " + PARAL[0], "Passar para " + PARAL[1], "Passar para " + PARAL[2], "Linhas a definir"].forEach(function (h, k) { rs.set(4, k + 1, h, S.head); });
    rs.rowH[4] = 30;
    var LV = "'Lançamentos'!$F:$F", LM = "'Lançamentos'!$B:$B", LT = "'Lançamentos'!$C:$C", LP = "'Lançamentos'!$G:$G", LS = "'Lançamentos'!$K:$K", LCt = "'Lançamentos'!$E:$E";
    var first = 5, T = { contas: 0, aj: 0, rec: 0, pago: 0, falta: 0, para: [0, 0, 0] };
    months.forEach(function (ym, q) {
      var r = first + q, inM = function (x) { return x.ym === ym; };
      var contas = sum(function (x) { return inM(x) && x.tipo === "Conta"; });
      var aj = sum(function (x) { return inM(x) && x.tipo === "Ajuste"; });
      var rec = sum(function (x) { return inM(x) && x.tipo === "A receber"; });
      var pago = sum(function (x) { return inM(x) && x.status === "Pago" && x.tipo !== "A receber"; });
      rs.set(r, 1, serial(ym), S.mon);
      rs.set(r, 2, contas, S.brl, "SUMIFS(" + LV + "," + LM + ",$A" + r + "," + LT + ',"Conta")');
      rs.set(r, 3, aj, S.brl, "SUMIFS(" + LV + "," + LM + ",$A" + r + "," + LT + ',"Ajuste")');
      rs.set(r, 4, r2(contas + aj), S.brl, "B" + r + "+C" + r);
      rs.set(r, 5, rec, S.brl, "SUMIFS(" + LV + "," + LM + ",$A" + r + "," + LT + ',"A receber")');
      rs.set(r, 6, rec === 0 ? "" : r2(rec - contas - aj), S.brl, "IF(E" + r + '=0,"",E' + r + "-D" + r + ")");
      rs.set(r, 7, pago, S.brl, "SUMIFS(" + LV + "," + LM + ",$A" + r + "," + LS + ',"Pago",' + LT + ',"<>A receber")');
      rs.set(r, 8, r2(contas + aj - pago), S.brl, "D" + r + "-G" + r);
      PARAL.forEach(function (nm, k) {
        var v = sum(function (x) { return inM(x) && x.para === nm && x.tipo !== "A receber"; });
        rs.set(r, 9 + k, v, S.brl, "SUMIFS(" + LV + "," + LM + ",$A" + r + "," + LP + ',"' + nm + '",' + LT + ',"<>A receber")'); T.para[k] += v;
      });
      rs.set(r, 12, rows.filter(function (x) { return inM(x) && x.status === "A definir"; }).length, S.int, "COUNTIFS(" + LM + ",$A" + r + "," + LS + ',"A definir")');
      T.contas += contas; T.aj += aj; T.rec += rec; T.pago += pago; T.falta += contas + aj - pago;
    });
    var lastR = first + months.length - 1, tr = lastR + 1, j;
    rs.set(tr, 1, "Total", S.totLbl);
    var totals = [null, T.contas, T.aj, T.contas + T.aj, T.rec, null, T.pago, T.falta, T.para[0], T.para[1], T.para[2], 0];
    for (j = 2; j <= 12; j++) {
      if (j === 6) { rs.set(tr, 6, "", S.totLbl); continue; }
      rs.set(tr, j, r2(totals[j - 1]), j === 12 ? S.totInt : S.totBrl, "SUM(" + colL(j) + first + ":" + colL(j) + lastR + ")");
    }
    rs.set(tr + 1, 1, "Saldo só aparece nos meses em que há valores a receber lançados.", S.note);
    var cr = tr + 4;
    rs.set(cr - 1, 1, "Contas por categoria", S.bold);
    rs.set(cr, 1, "Categoria", S.head);
    months.forEach(function (ym, q) { rs.set(cr, 2 + q, serial(ym), S.head); });
    rs.set(cr, 2 + months.length, "Total", S.head);
    CATL.forEach(function (cat, k) {
      var r = cr + 1 + k, rowTot = 0;
      rs.set(r, 1, cat);
      months.forEach(function (ym, q) {
        var v = sum(function (x) { return x.ym === ym && x.tipo === "Conta" && x.cat === cat; }); rowTot += v;
        rs.set(r, 2 + q, v, S.brl, "SUMIFS(" + LV + "," + LM + "," + colL(2 + q) + "$" + cr + "," + LCt + ",$A" + r + "," + LT + ',"Conta")');
      });
      rs.set(r, 2 + months.length, r2(rowTot), S.boldBrl, "SUM(B" + r + ":" + colL(1 + months.length) + r + ")");
    });
    rs.widths = [16]; for (j = 2; j <= Math.max(12, 2 + months.length); j++) rs.widths.push(15);
    rs.pane = '<pane xSplit="1" ySplit="4" topLeftCell="B5" activePane="bottomRight" state="frozen"/><selection pane="topRight" activeCell="B1" sqref="B1"/><selection pane="bottomLeft" activeCell="A5" sqref="A5"/><selection pane="bottomRight" activeCell="B5" sqref="B5"/>';

    /* Listas */
    var ls = new Sheet();
    LISTS.forEach(function (L, k) {
      ls.set(1, k + 1, L[0], S.head);
      L[1].forEach(function (v, q) { ls.set(q + 2, k + 1, v); });
      ls.widths.push(22);
    });
    ls.set(14, 1, "Estas listas alimentam os menus da aba Lançamentos.", S.note);

    var tail1 = cfx + dvx + '<tableParts count="1"><tablePart r:id="rId1"/></tableParts>';
    var x1 = sheetXml(lc, tail1), x2 = sheetXml(rs, ""), x3 = sheetXml(ls, "");
    var tableXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="1" name="Lancamentos" displayName="Lancamentos" ref="A1:L' + last + '" totalsRowShown="0"><autoFilter ref="A1:L' + last + '"/><tableColumns count="12">' +
      HEADS.map(function (h, i) { return '<tableColumn id="' + (i + 1) + '" name="' + xe(h) + '"/>'; }).join("") + '</tableColumns><tableStyleInfo name="TableStyleLight9" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>';
    var sstXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + strs.length + '" uniqueCount="' + strs.length + '">' + strs.map(function (t) { return '<si><t xml:space="preserve">' + xe(t) + "</t></si>"; }).join("") + "</sst>";
    var R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", HD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return zipStore([
      { name: "[Content_Types].xml", text: HD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/></Types>' },
      { name: "_rels/.rels", text: HD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: "xl/workbook.xml", text: HD + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + R + '"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Lançamentos" sheetId="1" r:id="rId1"/><sheet name="Resumo" sheetId="2" r:id="rId2"/><sheet name="Listas" sheetId="3" r:id="rId3"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>' },
      { name: "xl/_rels/workbook.xml.rels", text: HD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + R + '/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + R + '/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="' + R + '/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="' + R + '/styles" Target="styles.xml"/><Relationship Id="rId5" Type="' + R + '/sharedStrings" Target="sharedStrings.xml"/></Relationships>' },
      { name: "xl/styles.xml", text: STYLES_XML },
      { name: "xl/worksheets/sheet1.xml", text: x1 },
      { name: "xl/worksheets/_rels/sheet1.xml.rels", text: HD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + R + '/table" Target="../tables/table1.xml"/></Relationships>' },
      { name: "xl/worksheets/sheet2.xml", text: x2 },
      { name: "xl/worksheets/sheet3.xml", text: x3 },
      { name: "xl/tables/table1.xml", text: tableXml },
      { name: "xl/sharedStrings.xml", text: sstXml }
    ]);
  }
  
module.exports = { buildXlsx: buildXlsx };
