// HyCo Tablet-Prototyp — PROF-Adapter (KONZEPT, kein Schema vorhanden).
//
// Belegt: 07_PROF_Product_Information_Framework/ enthält ausschließlich README.md
// und _PROF_Journal.md — kein Feldschema, keine Beispieldaten, keine Definition.
// Das PROF-README selbst listet als offene Frage: "Zielsystem der Produktdaten
// (JTL/NOVA) und Pflichtfelder?" — es gibt also noch nichts zum Andocken.
//
// Diese Funktion liefert deshalb bewusst KEINE echte Vorschau, sondern nur den
// dokumentierten Hinweis, dass Produktkarten in diesem Prototyp vollständig
// synthetisch sind und später an PROF (nicht an JTL direkt) angebunden werden
// müssten, sobald dort ein Schema existiert.

export function pifHinweis() {
  return {
    adapter: "pif",
    status: "KEIN SCHEMA VORHANDEN — 07_PROF_Product_Information_Framework ist aktuell nur README+Journal, keine Feld-/Datenmodell-Definition.",
    payload: null,
  };
}
