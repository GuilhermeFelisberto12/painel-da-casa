// Faz a tela (feita para o claude.ai) conversar com o armazenamento local do app.
(function () {
  "use strict";
  var api = window.store;
  if (!api) return;
  var state = { gastos: {}, receitas: {}, config: {} };
  var subs = [];
  var ready = api.load().then(function (s) { state = s; });
  function notify() { subs.forEach(function (f) { f(); }); }
  function toast(msg) {
    var t = document.getElementById("__toast");
    if (!t) {
      t = document.createElement("div"); t.id = "__toast"; t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;left:50%;top:14px;transform:translateX(-50%);max-width:min(560px,92vw);background:#E0B683;color:#2A2013;padding:10px 16px;border-radius:12px;font:600 14px/1.35 system-ui,sans-serif;z-index:99999;box-shadow:0 6px 24px rgba(0,0,0,.35)";
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.display = "block";
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = "none"; }, 9000);
  }
  function newId() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function applyLocal(o) {
    var p = o.path.split("/"), col = state[p[0]];
    if (o.op === "set") col[p[1]] = Object.assign({}, o.data);
    else if (o.op === "update") col[p[1]] = Object.assign({}, col[p[1]] || {}, o.data);
    else if (o.op === "delete") delete col[p[1]];
  }
  function send(o) {
    return ready.then(function () {
      applyLocal(o); notify();
      return api.apply([o]);
    }).then(function (r) {
      state = r.state; notify();
      if (r.warn) toast(r.warn);
    }, function (err) {
      return api.load().then(function (s) { state = s; notify(); }).then(function () {
        toast("Não foi possível salvar. Confira se a pasta de dados está acessível (Arquivo > Abrir pasta dos dados).");
        throw err;
      });
    });
  }
  function snap(name) {
    return { docs: Object.keys(state[name]).map(function (id) { var d = state[name][id]; return { id: id, data: function () { return d; } }; }), metadata: { fromCache: false } };
  }
  var db = {
    collection: function (name) {
      return {
        orderBy: function () { return this; }, limit: function () { return this; },
        onSnapshot: function (cb) { var f = function () { cb(snap(name)); }; subs.push(f); ready.then(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
        doc: function (id) { id = id || newId(); return docRef(name + "/" + id); },
        add: function (d) { var id = newId(); return send({ op: "set", path: name + "/" + id, data: d }).then(function () { return { id: id }; }); }
      };
    },
    doc: function (path) { return docRef(path); }
  };
  function docRef(path) {
    var p = path.split("/");
    return {
      id: p[1],
      onSnapshot: function (cb) {
        var f = function () { var d = state[p[0]][p[1]]; cb({ exists: !!d, data: function () { return d; } }); };
        subs.push(f); ready.then(f); return function () { subs = subs.filter(function (x) { return x !== f; }); };
      },
      set: function (d) { return send({ op: "set", path: path, data: d }); },
      update: function (d) { return send({ op: "update", path: path, data: d }); },
      delete: function () { return send({ op: "delete", path: path }); }
    };
  }
  var user = { id: function () { return Promise.resolve("local"); }, can: function () { return Promise.resolve(true); }, profiles: function () { return Promise.resolve({}); }, isOwner: function () { return true; }, canEdit: function () { return true; } };
  window.claude = { use: function (n) { return Promise.resolve(n === "db" ? db : n === "user" ? user : null); } };

  function refresh() { api.load().then(function (s) { state = s; notify(); }).catch(function () {}); }
  window.addEventListener("focus", refresh);
  setInterval(refresh, 30000);
})();
