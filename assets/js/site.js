/* ============================================================================
   Integrita – Website-Skript
   - Mobiles Menü
   - Einwilligungsverwaltung (Banner + Seite /cookie-einstellungen/)
   - Kontaktformular über Formspring (Versand per fetch; Einwilligungs-Sperre nur,
     wenn in _data/consent.yml ein Eintrag "kontaktformular" steht)
   Keine externen Bibliotheken, keine Tracker.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  /* --- Einwilligung ------------------------------------------------------- */
  var COOKIE = "cookie-settings";
  var TAGE = 365;
  var VERSION = 2; // erhöhen, wenn Dienste dazukommen/wegfallen -> Banner erscheint erneut

  function lesen() {
    var m = document.cookie.match(/(?:^|;\s*)cookie-settings=([^;]*)/);
    if (!m) return null;
    try {
      var c = JSON.parse(decodeURIComponent(m[1]));
      return c && c.v === VERSION ? c : null;
    } catch (e) {
      return null;
    }
  }

  function speichern(auswahl) {
    var c = { v: VERSION, notwendig: true, datum: new Date().toISOString().slice(0, 10) };
    Object.keys(auswahl).forEach(function (k) { if (k !== "v" && k !== "datum") c[k] = !!auswahl[k]; });
    c.notwendig = true;
    var ablauf = new Date(Date.now() + TAGE * 864e5).toUTCString();
    document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(c)) +
      "; expires=" + ablauf + "; path=/; SameSite=Lax" +
      (location.protocol === "https:" ? "; Secure" : "");
    document.dispatchEvent(new CustomEvent("consent:change", { detail: c }));
    return c;
  }

  function erlaubt(id) {
    var c = lesen();
    return !!(c && c[id]);
  }

  function erteilen(id) {
    var c = lesen() || {};
    c[id] = true;
    return speichern(c);
  }

  window.IntegritaConsent = { read: lesen, save: speichern, has: erlaubt, grant: erteilen };

  /* --- Mobiles Menü ------------------------------------------------------- */
  function initNav() {
    var btn = document.querySelector(".nav-toggle");
    var nav = document.getElementById("hauptnavigation");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var offen = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", offen ? "true" : "false");
      btn.setAttribute("aria-label", offen ? "Menü schließen" : "Menü öffnen");
    });
  }

  /* --- Banner ------------------------------------------------------------- */
  function initBanner() {
    var banner = document.querySelector("[data-consent-banner]");
    if (!banner) return;
    // Auf der Einstellungsseite selbst kein Banner zeigen
    if (document.querySelector("[data-consent-settings]")) return;
    if (lesen()) return;

    var dienste = (banner.getAttribute("data-services") || "").split(",").filter(Boolean);
    banner.hidden = false;

    banner.addEventListener("click", function (e) {
      var ziel = e.target.closest("[data-consent-action]");
      if (!ziel) return;
      var alle = ziel.getAttribute("data-consent-action") === "alle";
      var auswahl = {};
      dienste.forEach(function (id) { auswahl[id] = alle; });
      speichern(auswahl);
      banner.hidden = true;
    });
  }

  /* --- Einstellungsseite -------------------------------------------------- */
  function initEinstellungen() {
    var form = document.querySelector("[data-consent-settings]");
    if (!form) return;
    var c = lesen() || {};
    var boxen = form.querySelectorAll("input[type=checkbox][name]:not([disabled])");
    boxen.forEach(function (b) { b.checked = !!c[b.name]; });

    var hinweis = form.querySelector("[data-consent-saved]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var auswahl = {};
      boxen.forEach(function (b) { auswahl[b.name] = b.checked; });
      var neu = speichern(auswahl);
      if (hinweis) {
        hinweis.textContent = "Gespeichert am " + neu.datum.split("-").reverse().join(".") + ".";
        hinweis.hidden = false;
      }
    });
  }

  /* --- Kontaktformular ---------------------------------------------------- */
  function initKontakt() {
    var form = document.getElementById("kontakt-form");
    if (!form) return;
    var endpunkt = form.getAttribute("data-endpoint");
    var feldset = form.querySelector("fieldset");
    var sperre = document.querySelector("[data-form-gate]");
    var fehlt = document.querySelector("[data-form-unconfigured]");
    var meldung = form.querySelector("[data-form-msg]");
    var knopf = form.querySelector("button[type=submit]");
    // Nur gesetzt, wenn _data/consent.yml einen Eintrag "kontaktformular" hat
    var einwilligung = form.getAttribute("data-einwilligung");

    function freigegeben() {
      return !einwilligung || erlaubt(einwilligung);
    }

    function aktualisieren() {
      if (!endpunkt) {
        feldset.disabled = true;
        if (sperre) sperre.hidden = true;
        if (fehlt) fehlt.hidden = false;
        return;
      }
      var ok = freigegeben();
      feldset.disabled = !ok;
      if (sperre) sperre.hidden = ok;
    }

    if (sperre && einwilligung) {
      sperre.addEventListener("click", function (e) {
        if (!e.target.closest("[data-consent-grant]")) return;
        erteilen(einwilligung);
        var erstes = document.getElementById("kf-name");
        if (erstes) erstes.focus();
      });
    }
    document.addEventListener("consent:change", aktualisieren);
    aktualisieren();

    function zeige(text, art) {
      meldung.textContent = text;
      meldung.className = "form-msg " + (art || "info");
      meldung.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!endpunkt || !freigegeben()) return;
      if (form.querySelector(".hp input").value) return; // Spam-Falle ausgefüllt

      knopf.disabled = true;
      zeige("Nachricht wird gesendet …", "info");

      // Als normales Formular (x-www-form-urlencoded) senden: so dokumentiert der
      // Anbieter es, und der Browser braucht keine CORS-Vorabanfrage.
      fetch(endpunkt, {
        method: "POST",
        body: new URLSearchParams(new FormData(form)),
        headers: { Accept: "application/json" }
      }).then(function (antwort) {
        if (antwort.ok) {
          window.location.href = form.getAttribute("data-next");
          return;
        }
        return antwort.json().catch(function () { return {}; }).then(function (daten) {
          var details = "";
          if (daten && Array.isArray(daten.errors)) {
            details = daten.errors.map(function (x) { return x.message || x; }).join(" ");
          } else if (daten && (daten.message || daten.error)) {
            details = daten.message || daten.error;
          } else if (antwort.status === 402) {
            details = "Das Formular hat sein Monatskontingent erreicht.";
          }
          throw new Error(details);
        });
      }).catch(function (fehler) {
        knopf.disabled = false;
        zeige("Die Nachricht konnte nicht gesendet werden. " + (fehler && fehler.message ? fehler.message + " " : "") +
          "Bitte versuchen Sie es erneut oder schreiben Sie uns direkt per E-Mail.", "err");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initBanner();
    initEinstellungen();
    initKontakt();
  });
})();
