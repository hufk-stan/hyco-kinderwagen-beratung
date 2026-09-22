// HyCo Tablet-Prototyp — Anzeige-Labels für Enum-Werte.
// Werte/Optionen sind KONZEPTVORSCHLAG aus dem Auftrag vom 2026-08-01 (schlanker
// Ablauf), keine bestehenden SeBo-/JTL-Enums — siehe ADAPTERGRENZEN.md.

export const ENTSCHEIDUNGSSTATUS_LABEL = {
  "orientierung": "Orientierung",
  "engere-auswahl": "Engere Auswahl",
  "favorit-vorhanden": "Favorit vorhanden",
  "kaufbereit": "Kaufbereit",
  "vertagt": "Vertagt",
  "keine-passende-loesung": "Keine passende Lösung",
};

export const BERATUNGSWEG_LABEL = {
  store: "Im Store",
  online: "Online-Termin",
  telefon: "Telefon",
};

export const NEXTSTEP_LABEL = {
  "zusammenfassung-senden": { titel: "Zusammenfassung senden", sub: "per E-Mail/Telefon" },
  "angebot-erstellen": { titel: "Angebot erstellen", sub: "Aufgabe für Beratungsperson" },
  "verfuegbarkeit-klaeren": { titel: "Verfügbarkeit klären", sub: "Aufgabe, keine automatische Reservierung" },
  "benachrichtigungsfall-anlegen": { titel: "Benachrichtigungsfall anlegen", sub: "SeBo-Benachrichtigungsliste (Vorschau)" },
  "weiterer-termin": { titel: "Weiterer Beratungstermin", sub: "Aufgabe: Termin vereinbaren" },
  "kunde-entscheidet-spaeter": { titel: "Kunde entscheidet später", sub: "kein aktiver nächster Schritt" },
  "ohne-weiteren-schritt": { titel: "Ohne weiteren Schritt abschließen", sub: "" },
};

export function label(map, key, fallback = "—") {
  if (!key) return fallback;
  const eintrag = map[key];
  if (!eintrag) return key;
  return typeof eintrag === "string" ? eintrag : eintrag.titel;
}
