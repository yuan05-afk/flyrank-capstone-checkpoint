(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector("script[data-widget-id]");
  if (!script) return;

  var widgetId = script.getAttribute("data-widget-id");
  if (!widgetId) {
    console.error("[wp] missing data-widget-id");
    return;
  }

  var src = script.src || "";
  var origin = src.replace(/\/widget\.js(?:\?.*)?$/, "");
  if (!origin) origin = window.location.origin;

  var STYLE = [
    ".wp-root{all:initial;font-family:Figtree,Segoe UI,sans-serif;position:fixed;inset:auto 16px 16px auto;z-index:2147483000;}",
    ".wp-shell{color:#0C1222;}",
    ".wp-ticket{position:relative;background:#FFFFFF;border:1px solid #E2E8F2;border-radius:16px;box-shadow:0 16px 40px -24px rgba(12,18,34,.35);padding:18px 16px 14px;max-width:320px;}",
    ".wp-brand{font-family:Sora,Figtree,sans-serif;color:#0F766E;font-weight:600;font-size:12px;margin-bottom:8px;}",
    ".wp-headline{font-family:Sora,Figtree,sans-serif;font-size:18px;font-weight:600;margin:0 0 6px;color:#0C1222;letter-spacing:-.02em;}",
    ".wp-body{font-size:13px;line-height:1.5;margin:0 0 12px;color:#5B6578;}",
    ".wp-field{display:block;margin-bottom:8px;font-size:12px;color:#5B6578;}",
    ".wp-field span{display:block;margin-bottom:4px;font-weight:500;}",
    ".wp-field input,.wp-field textarea{width:100%;box-sizing:border-box;background:#F4F7FB;border:1px solid #E2E8F2;border-radius:10px;color:#0C1222;padding:8px 10px;font-family:inherit;font-size:13px;}",
    ".wp-submit{margin-top:8px;background:#0F766E;color:#fff;border:none;border-radius:10px;padding:9px 14px;font-family:Sora,Figtree,sans-serif;font-weight:600;cursor:pointer;font-size:13px;box-shadow:0 8px 18px -12px rgba(15,118,110,.7);}",
    ".wp-submit:hover{background:#14B8A6;}",
    ".wp-hp{position:absolute!important;left:-9999px!important;opacity:0!important;height:0!important;width:0!important;}",
    ".wp-status{margin-top:10px;font-size:12px;}",
    ".wp-status.ok{color:#15803D;}",
    ".wp-status.bad{color:#DC2626;}",
    ".wp-cta-only .wp-form{display:flex;gap:8px;align-items:flex-end;}",
  ].join("");

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mount(config) {
    var root = document.createElement("div");
    root.className = "wp-root";
    root.setAttribute("data-widget-id", config.id);

    var style = document.createElement("style");
    style.textContent = STYLE;
    root.appendChild(style);

    var fields = (config.fields || [])
      .map(function (f) {
        var input =
          f.type === "textarea"
            ? '<textarea name="' +
              esc(f.name) +
              '" ' +
              (f.required ? "required" : "") +
              ' rows="3"></textarea>'
            : '<input name="' +
              esc(f.name) +
              '" type="' +
              esc(f.type || "text") +
              '" ' +
              (f.required ? "required" : "") +
              " />";
        return (
          '<label class="wp-field"><span>' +
          esc(f.label) +
          "</span>" +
          input +
          "</label>"
        );
      })
      .join("");

    var typeClass = config.type === "cta" ? " wp-cta-only" : "";
    var shell = document.createElement("div");
    shell.innerHTML =
      '<div class="wp-shell' +
      typeClass +
      '" data-wp-type="' +
      esc(config.type) +
      '"><div class="wp-ticket"><div class="wp-brand">Checkpoint</div><h2 class="wp-headline">' +
      esc((config.copy && config.copy.headline) || "Stay in the loop") +
      '</h2><p class="wp-body">' +
      esc((config.copy && config.copy.body) || "") +
      '</p><form class="wp-form" novalidate>' +
      fields +
      '<input type="text" name="_hp" value="" tabindex="-1" autocomplete="off" class="wp-hp" aria-hidden="true" /><button type="submit" class="wp-submit">' +
      esc((config.copy && config.copy.buttonLabel) || "Submit") +
      '</button></form><div class="wp-status" hidden></div></div></div>';

    root.appendChild(shell.firstChild);
    document.body.appendChild(root);

    var form = root.querySelector(".wp-form");
    var status = root.querySelector(".wp-status");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var payload = {};
      fd.forEach(function (v, k) {
        payload[k] = v;
      });
      var hp = payload._hp || "";
      delete payload._hp;

      status.hidden = false;
      status.className = "wp-status";
      status.textContent = "Filing…";

      fetch(origin + "/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: config.id,
          payload: payload,
          _hp: hp,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { res: res, data: data };
          });
        })
        .then(function (_ref) {
          var res = _ref.res;
          var data = _ref.data;
          if (!res.ok) {
            status.className = "wp-status bad";
            status.textContent =
              (data && data.error) || "Rejected (" + res.status + ")";
            return;
          }
          status.className = "wp-status ok";
          status.textContent =
            (config.copy && config.copy.successMessage) ||
            "ACCEPTED - filed as " + (data.verdict || "OK");
          form.reset();
        })
        .catch(function (err) {
          status.className = "wp-status bad";
          status.textContent = "Transport error: " + err.message;
        });
    });
  }

  fetch(origin + "/api/widgets/" + encodeURIComponent(widgetId) + "/config", {
    headers: { Accept: "application/json" },
  })
    .then(function (res) {
      if (!res.ok) throw new Error("config " + res.status);
      return res.json();
    })
    .then(mount)
    .catch(function (err) {
      console.error("[wp] failed to load config", err);
    });
})();
