"use strict";
// Banco de dados em arquivo: dados.json é a fonte; CONTAS_.xlsx é regenerado a cada alteração.
const fs = require("fs");
const path = require("path");
const { buildXlsx } = require("./xlsx.js");

const VAZIO = () => ({ versao: 1, gastos: {}, receitas: {}, config: {} });

function readAll(dir) {
  const f = path.join(dir, "dados.json");
  if (!fs.existsSync(f)) return VAZIO();
  const o = JSON.parse(fs.readFileSync(f, "utf8"));
  return { versao: 1, gastos: o.gastos || {}, receitas: o.receitas || {}, config: o.config || {} };
}

function writeAtomic(file, data) {
  const tmp = file + ".tmp-" + process.pid;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

function toList(obj) { return Object.keys(obj).map((id) => Object.assign({}, obj[id], { id })); }

function nowYm() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
}

function writeXlsx(dir, state) {
  const bytes = buildXlsx(toList(state.gastos), toList(state.receitas), nowYm());
  writeAtomic(path.join(dir, "CONTAS_.xlsx"), Buffer.from(bytes));
}

// ops: [{op:"set"|"update"|"delete", path:"gastos/ID", data}]. Relê o arquivo antes de aplicar,
// para não perder o que a outra pessoa lançou enquanto este app estava aberto.
function applyOps(dir, ops) {
  fs.mkdirSync(dir, { recursive: true });
  const st = readAll(dir);
  ops.forEach((o) => {
    const p = String(o.path).split("/");
    if (p.length !== 2 || !["gastos", "receitas", "config"].includes(p[0])) throw new Error("caminho inválido: " + o.path);
    const col = st[p[0]], id = p[1];
    if (o.op === "set") col[id] = o.data || {};
    else if (o.op === "update") col[id] = Object.assign({}, col[id] || {}, o.data || {});
    else if (o.op === "delete") delete col[id];
    else throw new Error("operação inválida: " + o.op);
  });
  writeAtomic(path.join(dir, "dados.json"), JSON.stringify(st, null, 1));
  let warn = null;
  try { writeXlsx(dir, st); } catch (e) {
    warn = e && (e.code === "EBUSY" || e.code === "EPERM" || e.code === "EACCES")
      ? "O lançamento foi salvo, mas a planilha CONTAS_.xlsx está aberta no Excel e não pôde ser atualizada. Feche-a; ela será atualizada no próximo lançamento."
      : "O lançamento foi salvo, mas não foi possível atualizar a planilha CONTAS_.xlsx.";
  }
  return { state: st, warn };
}

// Primeira execução: copia os dados iniciais e gera a planilha.
function ensureSeed(dir, seedFile) {
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(path.join(dir, "dados.json"))) return false;
  const seed = fs.existsSync(seedFile) ? JSON.parse(fs.readFileSync(seedFile, "utf8")) : VAZIO();
  writeAtomic(path.join(dir, "dados.json"), JSON.stringify(seed, null, 1));
  try { writeXlsx(dir, readAll(dir)); } catch (e) { /* tenta de novo no próximo lançamento */ }
  return true;
}

module.exports = { readAll, applyOps, ensureSeed, writeXlsx };
