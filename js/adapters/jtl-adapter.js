// HyCo Tablet-Prototyp — JTL-Adapter (MOCK, NICHT AUSFÜHREND).
//
// Strategische Systemgrenze (Auftrag): JTL bleibt führend für Artikel, Preis,
// Bestand, Kauf, Auftrag, Rechnung, Zahlung, Lieferung, Retoure. NUR
// kaufrelevante, bestätigte Daten sollen später über eine noch zu belegende
// Schnittstelle nach JTL geschrieben werden — auch das erst in einem echten
// System, nicht hier.
//
// Dieser Adapter führt NIE einen Schreibzugriff aus. Er liefert ausschließlich
// eine Vorschau, welche Felder ein späteres System übergeben würde, und nur
// dann, wenn der Entscheidungsstatus "kaufbereit" ist — vorher gibt es aus
// Sicht dieses Prototyps nichts Kaufrelevantes zu übergeben.
//
// Automatische Bestellung/Reservierung ist im gesamten Prototyp nicht
// freigegeben und wird hier bewusst nicht simuliert.

export function jtlVorschau(state) {
  const kaufbereit = state.ergebnis.entscheidungsstatus === "kaufbereit";
  if (!kaufbereit) {
    return {
      adapter: "jtl",
      status: "KEINE ÜBERGABE — Entscheidungsstatus ist noch nicht „kaufbereit“.",
      payload: null,
    };
  }
  return {
    adapter: "jtl",
    status: "MOCK — NICHT GESENDET. Nur Vorschau, welche Felder später an JTL gingen (kein Schreibzugriff in diesem Prototyp, kein belegtes Live-Schema — UNGEKLAERT).",
    payload: {
      kunde: state.kunde.name,
      thema: state.thema,
      kundenfavoriten: state.ergebnis.kundenfavoriten,
      hinweis: "Artikelnummer/Preis/Bestand sind in diesem Prototyp nicht mit JTL verbunden — synthetische Platzhalter, siehe ADAPTERGRENZEN.md.",
    },
  };
}
