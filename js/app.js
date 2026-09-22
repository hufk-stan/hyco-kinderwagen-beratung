// HyCo Tablet-Prototyp — Screen-Controller.
// Verdrahtet state.js + validation.js + voiS.js + adapters/* mit dem DOM.
// Keine externen Requests, keine Frameworks, keine Build-Schritte.
//
// Schlanker Ablauf (2026-08-01): 6 Schritte. Rahmen (3 sachliche Blöcke) VOR
// der Beratung, dann "Tablet weg", dann Ergebnis, dann VoiS-Endkommentar der
// Beratungsperson (NICHT das Kundengespräch), dann VoiS prüfen & bestätigen.

import { erstelleStore, leererState } from "./state.js";
import { themaLaden } from "./themen/kinderwagen.js";
import { TESTFALL, TESTFALL_ENDKOMMENTAR } from "./testdaten.js";
import {
  validiereSchritt,
} from "./validation.js";
import { baueVoiS } from "./voiS.js";
import { mamiVorschau } from "./adapters/mami-adapter.js";
import { jtlVorschau } from "./adapters/jtl-adapter.js";
import { seboVorschau } from "./adapters/sebo-adapter.js";
import { pifHinweis } from "./adapters/pif-adapter.js";
import {
  ENTSCHEIDUNGSSTATUS_LABEL, NEXTSTEP_LABEL, BERATUNGSWEG_LABEL, label,
} from "./labels.js";

const SCHRITT_TITEL = [
  null,
  "Beratung öffnen", "Rahmen erfassen", "Beratung läuft",
  "Ergebnis", "VoiS – Endkommentar", "VoiS prüfen",
];
const SCHRITT_WEITER_LABEL = [
  null,
  "Weiter", "Weiter zur Beratung", "Beratung beendet – weiter",
  "Kundengespräch abschließen", "Entwurf erzeugen", null,
];
const ANZAHL_SCHRITTE = 6;

const store = erstelleStore();
const thema = themaLaden(store.get().thema || "kinderwagen");

function nowIso() { return new Date().toISOString(); }
function naechsterWerktagIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// -- Kleine DOM-Helfer --------------------------------------------------
function el(tag, attrs = {}, kinder = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const kind of kinder) {
    if (kind === null || kind === undefined) continue;
    node.appendChild(typeof kind === "string" ? document.createTextNode(kind) : kind);
  }
  return node;
}
function leeren(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function q(id) { return document.getElementById(id); }

// -- Stepper --------------------------------------------------------------
function renderStepper() {
  const s = store.get();
  const ul = q("stepper");
  leeren(ul);
  for (let i = 1; i <= ANZAHL_SCHRITTE; i++) {
    const besucht = s.navigation.besuchteSchritte.includes(i);
    const li = el("li", { class: i === s.navigation.aktuellerSchritt ? "current" : besucht ? "done" : "" });
    const btn = el("button", {
      type: "button",
      disabled: besucht ? null : "disabled",
      onclick: () => besucht && gehe(i),
    }, [
      el("span", { class: "nr" }, [String(i)]),
      el("span", { class: "label" }, [SCHRITT_TITEL[i]]),
    ]);
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

// -- Navigation -------------------------------------------------------------
function gehe(nr) {
  store.setzen((s) => {
    s.navigation.aktuellerSchritt = nr;
    if (!s.navigation.besuchteSchritte.includes(nr)) s.navigation.besuchteSchritte.push(nr);
    return s;
  });
  zeigeSchritt(nr);
}

function weiter() {
  const s = store.get();
  const nr = s.navigation.aktuellerSchritt;
  const ergebnis = validiereSchritt(nr, s);
  if (!ergebnis.gueltig) { zeigeFehler(ergebnis.fehler); return; }

  // Phase E: Kundengespräch wird beim Verlassen von Schritt 4 (Ergebnis)
  // sichtbar abgeschlossen — erst danach darf VoiS angeboten werden.
  if (nr === 4) {
    store.setzen((st) => { st.kundengespraech.beendetAm = nowIso(); return st; });
  }
  if (nr === 3) {
    store.setzen((st) => { if (!st.beratungLaeuft.begonnenAm) st.beratungLaeuft.begonnenAm = nowIso(); return st; });
  }

  if (nr < ANZAHL_SCHRITTE) gehe(nr + 1);
}
function zurueck() {
  const nr = store.get().navigation.aktuellerSchritt;
  if (nr > 1) gehe(nr - 1);
}

function zeigeFehler(fehler) {
  const box = q("fehlerliste");
  leeren(box);
  if (!fehler || fehler.length === 0) return;
  box.appendChild(el("strong", {}, ["Fehlende Pflichtangaben:"]));
  const ul = el("ul", {}, fehler.map((f) => el("li", {}, [f])));
  box.appendChild(ul);
}

function zeigeSchritt(nr) {
  document.querySelectorAll(".screen").forEach((sec) => {
    sec.classList.toggle("active", Number(sec.dataset.screen) === nr);
  });
  zeigeFehler([]);
  renderStepper();
  q("btn-zurueck").disabled = nr === 1;
  const btnWeiter = q("btn-weiter");
  if (nr === ANZAHL_SCHRITTE) {
    btnWeiter.style.display = "none";
  } else {
    btnWeiter.style.display = "";
    btnWeiter.textContent = SCHRITT_WEITER_LABEL[nr];
  }
  renderAlleSchrittinhalte();
  const erste = document.querySelector(`.screen[data-screen="${nr}"] h2`);
  if (erste) erste.setAttribute("tabindex", "-1"), erste.focus({ preventScroll: false });
}

// -- Kachel-/Pill-Rendering (generisch) --------------------------------------
function renderKachelGruppe(containerId, katalog, ausgewaehlt, onToggle) {
  const box = q(containerId);
  leeren(box);
  for (const item of katalog) {
    const aktiv = ausgewaehlt.includes(item.id);
    box.appendChild(el("button", {
      type: "button",
      class: "kachel",
      "aria-pressed": String(aktiv),
      onclick: () => onToggle(item.id),
    }, [item.label]));
  }
}

function renderPillGruppe(containerId, map, wert, onSelect) {
  const box = q(containerId);
  leeren(box);
  for (const [key, val] of Object.entries(map)) {
    const text = typeof val === "string" ? val : val.titel;
    box.appendChild(el("button", {
      type: "button",
      class: "pill",
      role: "radio",
      "aria-checked": String(wert === key),
      "aria-pressed": String(wert === key),
      onclick: () => onSelect(key),
    }, [text]));
  }
}

function renderMultiPillGruppe(containerId, map, werte, onToggle) {
  const box = q(containerId);
  leeren(box);
  for (const [key, val] of Object.entries(map)) {
    const text = typeof val === "string" ? val : val.titel;
    const aktiv = werte.includes(key);
    box.appendChild(el("button", {
      type: "button",
      class: "pill",
      role: "checkbox",
      "aria-checked": String(aktiv),
      "aria-pressed": String(aktiv),
      onclick: () => onToggle(key),
    }, [text]));
  }
}

// -- Kontextpanel (persistent, alle Screens) ----------------------------------
let zuletztGespeichertAm = null;

function renderKontextpanel() {
  const s = store.get();
  q("kontext-kunde-name").textContent = s.kunde.name
    ? `${s.kunde.name}${s.kunde.istVorlaeufig ? " (vorläufig)" : ""}`
    : "—";
  q("kontext-termin").textContent = s.termin.zeitpunkt ? new Date(s.termin.zeitpunkt).toLocaleString("de-AT") : "—";
  q("kontext-beratungsweg").textContent = label(BERATUNGSWEG_LABEL, s.termin.beratungsweg);
  q("kontext-thema").textContent = thema.label;
  q("kontext-beratungsperson").textContent = s.termin.beratungsperson || "—";
  q("kontext-speicherstatus").textContent = zuletztGespeichertAm
    ? `● Lokal gespeichert · Zuletzt ${zuletztGespeichertAm.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`
    : "Noch keine Eingabe gespeichert.";
}

// -- Screen 1 — Beratung öffnen ----------------------------------------------
function renderSchritt1() {
  const s = store.get();
  q("kunde-name").value = s.kunde.name;
  q("kunde-name").oninput = (e) => store.setzen((st) => { st.kunde.name = e.target.value; return st; });

  q("btn-kunde-bestaetigt").setAttribute("aria-pressed", String(s.kunde.kundenReferenzBestaetigt));
  q("btn-kunde-bestaetigt").onclick = () => store.setzen((st) => {
    st.kunde.kundenReferenzBestaetigt = true; st.kunde.istVorlaeufig = false; return st;
  });
  q("btn-kunde-suchen").onclick = () => zeigeInlineHinweis(
    "kunde-suche-hinweis",
    q("btn-kunde-suchen").closest(".feld") || q("btn-kunde-suchen").parentElement,
    "Prototyp: Kundensuche ist ein Platzhalter — kein echtes Kundenmodell im Repo belegt (siehe ADAPTERGRENZEN.md)."
  );
  q("btn-kunde-vorlaeufig").setAttribute("aria-pressed", String(s.kunde.istVorlaeufig));
  q("btn-kunde-vorlaeufig").onclick = () => store.setzen((st) => {
    st.kunde.istVorlaeufig = true; st.kunde.kundenReferenzBestaetigt = false; return st;
  });

  q("termin-beratungsweg").value = s.termin.beratungsweg;
  q("termin-beratungsweg").onchange = (e) => store.setzen((st) => { st.termin.beratungsweg = e.target.value; return st; });

  q("termin-beratungsperson").value = s.termin.beratungsperson;
  q("termin-beratungsperson").oninput = (e) => store.setzen((st) => { st.termin.beratungsperson = e.target.value; return st; });

  if (!s.termin.zeitpunkt) {
    store.setzen((st) => { st.termin.zeitpunkt = nowIso(); return st; });
  }
  q("termin-zeitpunkt").value = new Date(store.get().termin.zeitpunkt).toLocaleString("de-AT");

  q("termin-vorbereitung").value = s.termin.vorbereitungNotiz;
  q("termin-vorbereitung").oninput = (e) => store.setzen((st) => { st.termin.vorbereitungNotiz = e.target.value; return st; });

  q("testfall-laden-btn").onclick = () => {
    store.testfallLaden(TESTFALL, nowIso(), naechsterWerktagIso());
    store.setzen((st) => { st.voiS.endkommentar = TESTFALL_ENDKOMMENTAR; return st; });
    zeigeSchritt(store.get().navigation.aktuellerSchritt);
  };
}

// -- Screen 2 — Rahmen (3 sachliche Blöcke) ---------------------------------
function renderSchritt2() {
  const s = store.get();

  renderPillGruppe("umfeld-pillen", Object.fromEntries(thema.umfeldOptionen.map((o) => [o.id, o.label])), s.rahmen.umfeld, (key) => {
    store.setzen((st) => { st.rahmen.umfeld = key; return st; });
    renderSchritt2();
  });

  renderKachelGruppe("begrenzung-kacheln", thema.zugangBegrenzungOptionen, s.rahmen.keineBegrenzung ? [] : s.rahmen.begrenzungen, (id) => {
    store.setzen((st) => {
      const liste = st.rahmen.begrenzungen;
      st.rahmen.begrenzungen = liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
      st.rahmen.keineBegrenzung = false;
      return st;
    });
    renderSchritt2();
  });
  q("btn-keine-begrenzung").setAttribute("aria-pressed", String(s.rahmen.keineBegrenzung));
  q("btn-keine-begrenzung").onclick = () => {
    store.setzen((st) => {
      st.rahmen.keineBegrenzung = !st.rahmen.keineBegrenzung;
      if (st.rahmen.keineBegrenzung) st.rahmen.begrenzungen = [];
      return st;
    });
    renderSchritt2();
  };

  q("rahmen-begrenzung-mass").value = s.rahmen.begrenzungMass;
  q("rahmen-begrenzung-mass").oninput = (e) => store.setzen((st) => { st.rahmen.begrenzungMass = e.target.value; return st; });

  renderPillGruppe("transport-pillen", Object.fromEntries(thema.transportOptionen.map((o) => [o.id, o.label])), s.rahmen.transport, (key) => {
    store.setzen((st) => { st.rahmen.transport = key; return st; });
    renderSchritt2();
  });

  const kofferraumFeld = q("kofferraum-feld");
  const relevantFuerAuto = s.rahmen.transport === "auto" || s.rahmen.transport === "gemischt";
  kofferraumFeld.style.display = relevantFuerAuto ? "" : "none";
  q("rahmen-kofferraum").value = s.rahmen.kofferraumBegrenzung;
  q("rahmen-kofferraum").oninput = (e) => store.setzen((st) => { st.rahmen.kofferraumBegrenzung = e.target.value; return st; });

  q("rahmen-ergaenzung").value = s.rahmen.ergaenzung;
  q("rahmen-ergaenzung").oninput = (e) => store.setzen((st) => { st.rahmen.ergaenzung = e.target.value; return st; });
}

// -- Screen 3 — Beratung läuft (Tablet weg) ---------------------------------
function renderSchritt3() {
  // Rein informativ, keine Formularfelder — die eigentliche Beratung findet
  // ohne fortlaufende Dateneingabe statt (Auftragsvorgabe).
}

// -- Screen 4 — Ergebnis -----------------------------------------------------
function produktSlotLabel(slot) {
  return slot && slot.marke && slot.modell ? `${slot.marke} · ${slot.modell}` : "";
}

function produktPillOptionen(s) {
  const opts = {};
  const a = produktSlotLabel(s.ergebnis.produkteGezeigt.a);
  const b = produktSlotLabel(s.ergebnis.produkteGezeigt.b);
  if (a) opts["produkt-a"] = a;
  if (b) opts["produkt-b"] = b;
  return opts;
}

function modelleFuerMarke(markeName) {
  const eintrag = thema.markenKatalog.find((m) => m.marke === markeName);
  return eintrag ? eintrag.modelle : [];
}

function renderMarkeModellSlot(idPrefix, slot, aufMarkeGeaendert, aufModellGeaendert) {
  const markeSel = q(`${idPrefix}-marke`);
  const modellSel = q(`${idPrefix}-modell`);

  leeren(markeSel);
  markeSel.appendChild(el("option", { value: "" }, ["— wählen —"]));
  for (const eintrag of thema.markenKatalog) {
    markeSel.appendChild(el("option", { value: eintrag.marke }, [eintrag.marke]));
  }
  markeSel.value = slot.marke;
  markeSel.onchange = (e) => aufMarkeGeaendert(e.target.value);

  leeren(modellSel);
  modellSel.appendChild(el("option", { value: "" }, ["— wählen —"]));
  for (const modellName of modelleFuerMarke(slot.marke)) {
    modellSel.appendChild(el("option", { value: modellName }, [modellName]));
  }
  modellSel.value = slot.modell;
  modellSel.disabled = !slot.marke;
  modellSel.onchange = (e) => aufModellGeaendert(e.target.value);
}

function renderProduktSlot(slotKey) {
  const s = store.get();
  renderMarkeModellSlot(`produkt-${slotKey}`, s.ergebnis.produkteGezeigt[slotKey],
    (wert) => {
      store.setzen((st) => {
        st.ergebnis.produkteGezeigt[slotKey].marke = wert;
        st.ergebnis.produkteGezeigt[slotKey].modell = "";
        if (wert) st.ergebnis.keineProduktauswahl = false;
        return st;
      });
      renderSchritt4();
    },
    (wert) => {
      store.setzen((st) => {
        st.ergebnis.produkteGezeigt[slotKey].modell = wert;
        if (wert) st.ergebnis.keineProduktauswahl = false;
        return st;
      });
      renderSchritt4();
    });
}

function renderEmpfehlungSlot() {
  const s = store.get();
  renderMarkeModellSlot("empfehlung", s.ergebnis.hfkEmpfehlung,
    (wert) => {
      store.setzen((st) => {
        st.ergebnis.hfkEmpfehlung.marke = wert;
        st.ergebnis.hfkEmpfehlung.modell = "";
        if (wert) st.ergebnis.keineEmpfehlung = false;
        return st;
      });
      renderSchritt4();
    },
    (wert) => {
      store.setzen((st) => {
        st.ergebnis.hfkEmpfehlung.modell = wert;
        if (wert) st.ergebnis.keineEmpfehlung = false;
        return st;
      });
      renderSchritt4();
    });
}

function renderSchritt4() {
  renderProduktSlot("a");
  renderProduktSlot("b");
  renderEmpfehlungSlot();

  const s = store.get();
  q("keine-produktauswahl").setAttribute("aria-pressed", String(s.ergebnis.keineProduktauswahl));
  q("keine-produktauswahl").onclick = () => {
    store.setzen((st) => {
      st.ergebnis.keineProduktauswahl = !st.ergebnis.keineProduktauswahl;
      if (st.ergebnis.keineProduktauswahl) st.ergebnis.produkteGezeigt = { a: { marke: "", modell: "" }, b: { marke: "", modell: "" } };
      return st;
    });
    renderSchritt4();
  };

  q("keine-empfehlung").checked = s.ergebnis.keineEmpfehlung;
  q("keine-empfehlung").onchange = (e) => store.setzen((st) => {
    st.ergebnis.keineEmpfehlung = e.target.checked;
    if (e.target.checked) st.ergebnis.hfkEmpfehlung = { marke: "", modell: "" };
    return st;
  });

  // Datenpflege: Kundenfavoriten, deren Produkt-Slot wieder geleert wurde,
  // dürfen nicht als stille, unsichtbare Altangabe stehen bleiben.
  const optionenVorher = produktPillOptionen(s);
  if (s.ergebnis.kundenfavoriten.some((id) => !optionenVorher[id])) {
    store.setzen((st) => {
      st.ergebnis.kundenfavoriten = st.ergebnis.kundenfavoriten.filter((id) => optionenVorher[id]);
      return st;
    });
  }
  const s2 = store.get();
  const produktOptionen = produktPillOptionen(s2);

  renderMultiPillGruppe("kundenfavorit-pillen", produktOptionen, s2.ergebnis.kundenfavoriten, (key) => {
    store.setzen((st) => {
      const liste = st.ergebnis.kundenfavoriten;
      st.ergebnis.kundenfavoriten = liste.includes(key) ? liste.filter((x) => x !== key) : [...liste, key];
      return st;
    });
    renderSchritt4();
  });

  renderPillGruppe("entscheidungsstatus-pillen", ENTSCHEIDUNGSSTATUS_LABEL, s.ergebnis.entscheidungsstatus, (key) => {
    store.setzen((st) => { st.ergebnis.entscheidungsstatus = key; return st; });
    renderSchritt4();
  });

  q("ergebnis-ergaenzung").value = s.ergebnis.ergaenzung;
  q("ergebnis-ergaenzung").oninput = (e) => store.setzen((st) => { st.ergebnis.ergaenzung = e.target.value; return st; });

  renderNextStepBlock();
}

function renderNextStepBlock() {
  const s = store.get();
  const box = q("nextstep-kacheln");
  leeren(box);
  for (const [key, val] of Object.entries(NEXTSTEP_LABEL)) {
    const aktiv = s.nextStep.haupt === key;
    box.appendChild(el("button", {
      type: "button", class: "nextstep-kachel", role: "radio", "aria-checked": String(aktiv), "aria-pressed": String(aktiv),
      onclick: () => { store.setzen((st) => { st.nextStep.haupt = key; return st; }); renderNextStepBlock(); },
    }, [
      el("span", { class: "titel" }, [val.titel]),
      val.sub ? el("span", { class: "sub" }, [val.sub]) : null,
    ]));
  }

  const details = q("nextstep-details");
  leeren(details);
  if (!s.nextStep.haupt) return;

  const brauchtAufgabe = ["angebot-erstellen", "verfuegbarkeit-klaeren", "benachrichtigungsfall-anlegen", "weiterer-termin"].includes(s.nextStep.haupt);
  const brauchtVersand = s.nextStep.haupt === "zusammenfassung-senden";

  if (brauchtAufgabe || brauchtVersand) {
    const card = el("div", { class: "card" });
    const feldVerantwortlich = el("div", { class: "feld" }, [
      el("label", { for: "ns-verantwortlich" }, ["Verantwortliche Person"]),
      el("input", { type: "text", id: "ns-verantwortlich", value: s.nextStep.verantwortlich }),
    ]);
    const feldFaelligkeit = el("div", { class: "feld" }, [
      el("label", { for: "ns-faelligkeit" }, ["Fälligkeit"]),
      el("input", { type: "date", id: "ns-faelligkeit", value: s.nextStep.faelligkeit || "" }),
    ]);
    card.appendChild(feldVerantwortlich);
    card.appendChild(feldFaelligkeit);

    if (brauchtVersand) {
      const feldKanal = el("div", { class: "feld" }, [
        el("label", { for: "ns-kanal" }, ["Kontaktkanal"]),
        el("select", { id: "ns-kanal" }, [
          el("option", { value: "" }, ["— wählen —"]),
          el("option", { value: "email" }, ["E-Mail"]),
          el("option", { value: "telefon" }, ["Telefon"]),
        ]),
      ]);
      const feldEmpfaenger = el("div", { class: "feld" }, [
        el("label", { for: "ns-empfaenger" }, ["Empfänger"]),
        el("input", { type: "text", id: "ns-empfaenger", value: s.nextStep.empfaenger || "" }),
      ]);
      card.appendChild(feldKanal);
      card.appendChild(feldEmpfaenger);
      card.appendChild(el("div", { class: "feld" }, [
        el("label", {}, ["Kontaktdaten Kunde"]),
        el("input", { type: "tel", placeholder: "Telefon", value: s.kunde.telefon, oninput: (e) => store.setzen((st) => { st.kunde.telefon = e.target.value; return st; }) }),
        el("input", { type: "email", placeholder: "E-Mail", value: s.kunde.email, oninput: (e) => store.setzen((st) => { st.kunde.email = e.target.value; return st; }), style: "margin-top:8px" }),
      ]));
    }
    details.appendChild(card);

    q("ns-verantwortlich").oninput = (e) => store.setzen((st) => { st.nextStep.verantwortlich = e.target.value; return st; });
    q("ns-faelligkeit").onchange = (e) => store.setzen((st) => { st.nextStep.faelligkeit = e.target.value; return st; });
    if (brauchtVersand) {
      q("ns-kanal").value = s.nextStep.kanal || "";
      q("ns-kanal").onchange = (e) => store.setzen((st) => { st.nextStep.kanal = e.target.value; return st; });
      q("ns-empfaenger").oninput = (e) => store.setzen((st) => { st.nextStep.empfaenger = e.target.value; return st; });
    }
  }

  if (s.nextStep.haupt === "verfuegbarkeit-klaeren") {
    details.appendChild(el("p", { class: "hinweis" }, [
      "„Produkt zurücklegen“ ist bewusst keine automatische Aktion — nur eine Aufgabe zum Klären der Verfügbarkeit.",
    ]));
  }
}

// -- Screen 5 — VoiS-Endkommentar --------------------------------------------
function renderSchritt5() {
  const s = store.get();
  const status = q("kundengespraech-status");
  status.textContent = s.kundengespraech.beendetAm
    ? `✓ Kundengespräch abgeschlossen um ${new Date(s.kundengespraech.beendetAm).toLocaleString("de-AT")}`
    : "Kundengespräch noch nicht abgeschlossen.";

  const feld = q("vois-endkommentar");
  feld.value = s.voiS.endkommentar;
  feld.oninput = (e) => store.setzen((st) => { st.voiS.endkommentar = e.target.value; return st; });
}

// -- Screen 6 — VoiS prüfen & bestätigen -------------------------------------
function renderVoiSAbschnitt(container, titel, inhalt, key) {
  const s = store.get();
  const verworfen = s.voiS.verworfen[key];
  const abschnitt = el("div", { class: "vois-abschnitt" }, [
    el("h4", {}, [titel]),
    el("div", { class: "inhalt" }, [verworfen ? "— verworfen —" : (inhalt || "—")]),
    el("div", { class: "aktionen no-print" }, [
      el("button", { type: "button", class: "btn btn-ghost", onclick: (e) => bearbeiteAbschnitt(key, titel, e.currentTarget) }, ["Bearbeiten"]),
      el("button", {
        type: "button", class: "btn btn-danger",
        onclick: () => { store.setzen((st) => { st.voiS.verworfen[key] = !st.voiS.verworfen[key]; return st; }); renderSchritt6(); },
      }, [verworfen ? "Wiederherstellen" : "Verwerfen"]),
    ]),
  ]);
  container.appendChild(abschnitt);
}

function bearbeiteAbschnitt(key, titel, auslöser) {
  store.setzen((st) => { st.voiS.bearbeitet[key] = true; return st; });
  zeigeInlineHinweis(
    `bearbeiten-hinweis-${key}`,
    auslöser.closest(".vois-abschnitt"),
    `„${titel}“ bearbeiten würde zum jeweiligen Schritt zurückspringen. Nutze die Fortschrittsanzeige oben, um direkt zu Schritt 2/4/5 zu springen.`
  );
}

function zeigeInlineHinweis(id, ankerNode, text) {
  if (!ankerNode) return;
  let hinweis = ankerNode.querySelector(`[data-hinweis-id="${id}"]`);
  if (hinweis) { hinweis.remove(); return; } // erneuter Klick blendet aus (Toggle)
  hinweis = el("p", { class: "hinweis", "data-hinweis-id": id, style: "margin-top:6px;color:var(--petrol)" }, [text]);
  ankerNode.appendChild(hinweis);
}

function renderDruckKopfzeile(s) {
  const box = q("print-kopfzeile");
  leeren(box);
  box.appendChild(el("h1", {}, ["HyCo Beratungsprotokoll — Kinderwagen"]));
  box.appendChild(el("p", {}, [
    `Kunde: ${s.kunde.name || "—"}${s.kunde.istVorlaeufig ? " (vorläufig)" : ""} · `,
    `Beratungsperson: ${s.termin.beratungsperson || "—"} · `,
    `Beratungsweg: ${label(BERATUNGSWEG_LABEL, s.termin.beratungsweg)} · `,
    `Datum: ${s.termin.zeitpunkt ? new Date(s.termin.zeitpunkt).toLocaleString("de-AT") : "—"}`,
  ]));
  if (s.kunde.telefon || s.kunde.email) {
    box.appendChild(el("p", {}, [
      "Kontakt: ",
      [s.kunde.telefon, s.kunde.email].filter(Boolean).join(" · "),
    ]));
  }
  box.appendChild(el("p", { class: "hinweis" }, [
    "Synthetischer Testfall, keine Live-Daten — Prototyp Hybrid Consulting Funnel (HyCo). Kein produktiver Schreibzugriff auf JTL/SeBo/MaMi.",
  ]));
}

function renderSchritt6() {
  const s = store.get();
  const voiS = baueVoiS(s, thema);

  renderDruckKopfzeile(s);

  const box = q("vois-inhalt");
  leeren(box);
  renderVoiSAbschnitt(box, "Rahmen (vor der Beratung erfasst)", [
    `Umfeld: ${voiS.rahmen.umfeld || "—"}`,
    voiS.rahmen.begrenzungen.length ? `Zugang/Begrenzung: ${voiS.rahmen.begrenzungen.join(", ")}` : null,
    voiS.rahmen.begrenzungMass ? `Maß: ${voiS.rahmen.begrenzungMass}` : null,
    `Transport: ${voiS.rahmen.transport || "—"}`,
    voiS.rahmen.kofferraumBegrenzung ? `Kofferraum: ${voiS.rahmen.kofferraumBegrenzung}` : null,
    voiS.rahmen.ergaenzung || null,
  ].filter(Boolean).join(" · "), "rahmen");
  renderVoiSAbschnitt(box, "Ergebnis", [
    `Gezeigte Produkte: ${voiS.ergebnis.gezeigteProdukte.join(", ") || "—"}`,
    `HFK-Empfehlung: ${voiS.ergebnis.hfkEmpfehlung || "—"}`,
    voiS.ergebnis.kundenfavoriten.length ? `Kundenfavoriten: ${voiS.ergebnis.kundenfavoriten.join(", ")}` : null,
    `Entscheidungsstand: ${voiS.ergebnis.entscheidungsstatus}`,
    voiS.ergebnis.ergaenzung || null,
  ].filter(Boolean).join(" · "), "ergebnis");
  renderVoiSAbschnitt(box, "Endkommentar der Beratungsperson", voiS.endkommentar, "endkommentar");
  renderVoiSAbschnitt(box, "Next Step", `${voiS.nextStep.haupt} · verantwortlich: ${voiS.nextStep.verantwortlich || "—"} · Frist: ${voiS.nextStep.faelligkeit || "—"}`, "nextstep");

  const mami = mamiVorschau(s, voiS);
  const sebo = seboVorschau(s, thema);
  const jtl = jtlVorschau(s);
  const pif = pifHinweis();

  renderAdapterBox("adapter-mami", "MaMi (Speicherort dieses Prototyps)", mami);
  renderAdapterBox("adapter-sebo", "SeBo — Benachrichtigungsliste", sebo);
  renderAdapterBox("adapter-jtl", "JTL", jtl);
  renderAdapterBox("adapter-pif", "PROF", pif);

  q("vois-final-bestaetigen").onclick = () => {
    store.setzen((st) => { st.voiS.bestaetigt = true; return st; });
    q("vois-abschluss-status").textContent = `✓ Final bestätigt am ${new Date().toLocaleString("de-AT")} — Testvorgang abgeschlossen. Keine produktive Folgeaktion ausgelöst.`;
  };
  q("vois-ohne-abschliessen").onclick = () => {
    q("vois-abschluss-status").textContent = "Ohne VoiS abgeschlossen — kein VoiS-Datensatz übernommen, keine produktive Folgeaktion ausgelöst.";
  };
  q("vois-abschluss-status").textContent = s.voiS.bestaetigt ? "✓ Bereits final bestätigt." : "";

  q("pdf-export-btn").onclick = () => window.print();

  q("mailto-protokoll-btn").onclick = () => {
    const betreff = `HyCo Beratungsprotokoll – ${s.kunde.name || "Testkunde"} – ${thema.label}`;
    const zeilen = [
      `Kunde: ${s.kunde.name || "—"}${s.kunde.istVorlaeufig ? " (vorläufig)" : ""}`,
      `Beratungsperson: ${s.termin.beratungsperson || "—"}`,
      `Rahmen: Umfeld ${voiS.rahmen.umfeld || "—"} · Transport ${voiS.rahmen.transport || "—"}`,
      `Gezeigte Produkte: ${voiS.ergebnis.gezeigteProdukte.join(", ") || "—"}`,
      `HFK-Empfehlung: ${voiS.ergebnis.hfkEmpfehlung || "—"}`,
      `Entscheidungsstand: ${voiS.ergebnis.entscheidungsstatus}`,
      "",
      "Endkommentar:",
      voiS.endkommentar || "—",
      "",
      `Nächster Schritt: ${voiS.nextStep.haupt} · verantwortlich: ${voiS.nextStep.verantwortlich || "—"} · Frist: ${voiS.nextStep.faelligkeit || "—"}`,
      "",
      "— Demo-Entwurf, HyCo Tablet-Prototyp, keine Live-Daten.",
    ];
    const empfaenger = "service@herrundfrauklein.com";
    window.location.href = `mailto:${empfaenger}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(zeilen.join("\n"))}`;
  };
}

function renderAdapterBox(containerId, titel, ergebnis) {
  const box = q(containerId);
  leeren(box);
  const badgeKlasse = ergebnis.payload || ergebnis.pflichtfelder ? "mock" : "ungeklaert";
  box.appendChild(el("div", {}, [
    el("strong", {}, [titel + " "]),
    el("span", { class: `badge ${badgeKlasse}` }, [ergebnis.status.startsWith("KEIN") ? "keine übergabe" : "mock"]),
  ]));
  box.appendChild(el("p", { class: "hinweis" }, [ergebnis.status]));
  const daten = ergebnis.pflichtfelder || ergebnis.datensatz || ergebnis.payload;
  if (daten) {
    const pre = el("pre", { style: "background:#f6f5f2;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:12px;overflow-x:auto;" });
    pre.textContent = JSON.stringify(daten, null, 2);
    box.appendChild(pre);
  }
}

// -- Renderer-Register -------------------------------------------------------
const RENDERER = [null, renderSchritt1, renderSchritt2, renderSchritt3, renderSchritt4, renderSchritt5, renderSchritt6];

function renderAlleSchrittinhalte() {
  const nr = store.get().navigation.aktuellerSchritt;
  RENDERER[nr]();
}

// -- Init -----------------------------------------------------------------
function init() {
  if (!store.get().meta.gestartetAm) {
    store.setzen((s) => { s.meta.gestartetAm = nowIso(); return s; });
  }
  q("btn-weiter").addEventListener("click", weiter);
  q("btn-zurueck").addEventListener("click", zurueck);

  q("kontext-reset-btn").onclick = () => {
    if (!window.confirm("Testfall wirklich zurücksetzen? Alle aktuellen Eingaben gehen verloren.")) return;
    store.zuruecksetzen();
    zeigeSchritt(1);
  };
  store.abonnieren(() => {
    zuletztGespeichertAm = new Date();
    renderKontextpanel();
  });
  renderKontextpanel();

  zeigeSchritt(store.get().navigation.aktuellerSchritt);
}

init();

// Für tests/manuelles Debugging im Browser zugänglich (kein produktiver API-Endpunkt).
window.__HYCO_TEST_API__ = { store, thema, leererState, validiereSchritt, baueVoiS, seboVorschau, jtlVorschau };
