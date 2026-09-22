// HyCo Tablet-Prototyp — Validierungsregeln, ein Set reiner Funktionen (state) => Ergebnis.
// Bewusst ohne DOM-Zugriff, damit sie ohne Browser testbar sind (siehe tests/logic.test.mjs).
// Pflichtfelder sind bewusst extrem sparsam gehalten (Auftragsvorgabe 2026-08-01) —
// ein Feld ist nur Pflicht, wenn der Ablauf ohne es fachlich keinen sinnvollen
// Beratungsvorgang/Abschluss darstellen kann. KEINE Top-3-Priorisierung, KEIN
// Kachel-Limit mehr — dieser Mechanismus wurde mit dem alten 8-Schritt-Ablauf
// bewusst verworfen.

const NEXTSTEP_MIT_VERSAND = new Set(["zusammenfassung-senden"]);
const NEXTSTEP_MIT_AUFGABE = new Set([
  "angebot-erstellen",
  "verfuegbarkeit-klaeren",
  "benachrichtigungsfall-anlegen",
  "weiterer-termin",
]);

function leer(wert) {
  return wert === undefined || wert === null || String(wert).trim() === "";
}

// -- Schritt 1: Beratung öffnen ------------------------------------------
export function validiereSchritt1(state) {
  const fehler = [];
  const hatKundenReferenz = state.kunde.kundenReferenzBestaetigt || state.kunde.istVorlaeufig;
  if (!hatKundenReferenz) fehler.push("Kundenreferenz bestätigen oder vorläufigen Kunden anlegen.");
  if (leer(state.termin.beratungsperson)) fehler.push("Beratungsperson fehlt.");
  if (leer(state.termin.zeitpunkt)) fehler.push("Zeitpunkt fehlt.");
  if (leer(state.termin.beratungsweg)) fehler.push("Beratungsweg fehlt.");
  if (leer(state.thema)) fehler.push("Thema fehlt.");
  return { gueltig: fehler.length === 0, fehler };
}

// -- Schritt 2: Rahmen (3 sachliche Blöcke) -------------------------------
export function validiereSchritt2(state) {
  const fehler = [];
  if (leer(state.rahmen.umfeld)) fehler.push("Wohn-/Hauptnutzungsumfeld fehlt.");
  const block2Beantwortet = state.rahmen.begrenzungen.length > 0 || state.rahmen.keineBegrenzung;
  if (!block2Beantwortet) fehler.push("Zugang/Größenbegrenzung fehlt (oder „keine relevante Begrenzung“ markieren).");
  if (leer(state.rahmen.transport)) fehler.push("Haupttransport fehlt.");
  return { gueltig: fehler.length === 0, fehler };
}

// -- Schritt 3: Beratung läuft (Tablet weg) — keine Pflichtfelder --------
export function validiereSchritt3(_state) {
  return { gueltig: true, fehler: [] };
}

// -- Schritt 4: Ergebnis ---------------------------------------------------
function produktGefuellt(slot) {
  return !!(slot && slot.marke && slot.modell);
}

export function validiereSchritt4(state) {
  const fehler = [];
  const produktAussage = produktGefuellt(state.ergebnis.produkteGezeigt.a) || produktGefuellt(state.ergebnis.produkteGezeigt.b) || state.ergebnis.keineProduktauswahl;
  if (!produktAussage) fehler.push("Gezeigtes Produkt markieren oder „noch keine konkrete Produktauswahl“.");
  const empfehlungAussage = produktGefuellt(state.ergebnis.hfkEmpfehlung) || state.ergebnis.keineEmpfehlung;
  if (!empfehlungAussage) fehler.push("HFK-Empfehlung wählen oder „noch keine Empfehlung“.");
  if (leer(state.ergebnis.entscheidungsstatus)) fehler.push("Entscheidungsstand fehlt.");
  if (leer(state.nextStep.haupt)) fehler.push("Nächster Schritt fehlt.");

  const brauchtAufgabe = NEXTSTEP_MIT_AUFGABE.has(state.nextStep.haupt) || state.nextStep.weitere.length > 0;
  if (brauchtAufgabe) {
    if (leer(state.nextStep.verantwortlich)) fehler.push("Verantwortliche Person für die Aufgabe fehlt.");
    if (leer(state.nextStep.faelligkeit)) fehler.push("Fälligkeit für die Aufgabe fehlt.");
  }
  if (NEXTSTEP_MIT_VERSAND.has(state.nextStep.haupt)) {
    if (leer(state.nextStep.kanal)) fehler.push("Kontaktkanal für den Versand fehlt.");
    if (leer(state.nextStep.empfaenger)) fehler.push("Empfänger für den Versand fehlt.");
    if (leer(state.kunde.telefon) && leer(state.kunde.email)) {
      fehler.push("Kontaktdaten (Telefon oder E-Mail) fehlen — erst ab Versand/Nachfassen Pflicht.");
    }
  }
  return { gueltig: fehler.length === 0, fehler };
}

// -- Schritt 5: VoiS-Endkommentar ------------------------------------------
export function validiereSchritt5(state) {
  const fehler = [];
  if (leer(state.voiS.endkommentar)) fehler.push("Endkommentar fehlt — kurz einsprechen/eintragen, bevor der Entwurf erzeugt werden kann.");
  return { gueltig: fehler.length === 0, fehler };
}

// -- Schritt 6: VoiS prüfen & bestätigen — Gate ist die Bestätigung selbst --
export function validiereSchritt6(_state) {
  return { gueltig: true, fehler: [] };
}

const VALIDATOREN = [
  null, // Index 0 ungenutzt, Schritte sind 1-basiert
  validiereSchritt1,
  validiereSchritt2,
  validiereSchritt3,
  validiereSchritt4,
  validiereSchritt5,
  validiereSchritt6,
];

export function validiereSchritt(nr, state) {
  const fn = VALIDATOREN[nr];
  if (!fn) throw new Error(`Kein Validator für Schritt ${nr}`);
  return fn(state);
}

export function kannWeiter(nr, state) {
  return validiereSchritt(nr, state).gueltig;
}
