"use strict";
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const store = require("./store.js");

let win = null;
const cfgFile = () => path.join(app.getPath("userData"), "config.json");

function defaultDir() {
  const candidatos = [
    path.join(os.homedir(), "OneDrive", "Documentos", "Contas a Pagar"),
    path.join(os.homedir(), "OneDrive", "Documents", "Contas a Pagar"),
    path.join(os.homedir(), "Documents", "Contas a Pagar")
  ];
  // usa a pasta do OneDrive se a pasta-mãe (Documentos) existir
  for (const c of candidatos) if (fs.existsSync(path.dirname(c))) return c;
  return candidatos[2];
}
function getDir() {
  try { const c = JSON.parse(fs.readFileSync(cfgFile(), "utf8")); if (c.dir) return c.dir; } catch (e) {}
  return defaultDir();
}
function setDir(d) { fs.mkdirSync(path.dirname(cfgFile()), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify({ dir: d })); }

function seedFile() { return path.join(__dirname, "seed", "dados.json"); }

function createWindow() {
  win = new BrowserWindow({
    width: 1100, height: 900, minWidth: 380, minHeight: 600,
    backgroundColor: "#17202B", title: "Painel da Casa",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, "app", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.setTitle("Painel da Casa — " + getDir());
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "Arquivo", submenu: [
      { label: "Abrir pasta dos dados", click: () => shell.openPath(getDir()) },
      { label: "Escolher outra pasta de dados...", click: async () => {
        const r = await dialog.showOpenDialog(win, { title: "Escolha a pasta Contas a Pagar", properties: ["openDirectory", "createDirectory"], defaultPath: getDir() });
        if (r.canceled || !r.filePaths[0]) return;
        setDir(r.filePaths[0]);
        store.ensureSeed(r.filePaths[0], seedFile());
        win.setTitle("Painel da Casa — " + r.filePaths[0]);
        win.webContents.reload();
      } },
      { type: "separator" },
      { role: "quit", label: "Sair" }
    ] },
    { label: "Exibir", submenu: [{ role: "reload", label: "Recarregar" }, { role: "togglefullscreen", label: "Tela cheia" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" }] }
  ]));
}

ipcMain.handle("store:load", () => store.readAll(getDir()));
ipcMain.handle("store:apply", (_e, ops) => store.applyOps(getDir(), ops));
ipcMain.handle("store:dir", () => getDir());

const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    try { store.ensureSeed(getDir(), seedFile()); } catch (e) { dialog.showErrorBox("Painel da Casa", "Não foi possível preparar a pasta de dados:\n" + getDir() + "\n\n" + e.message); }
    buildMenu();
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
