"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("store", {
  load: () => ipcRenderer.invoke("store:load"),
  apply: (ops) => ipcRenderer.invoke("store:apply", ops),
  dir: () => ipcRenderer.invoke("store:dir")
});
