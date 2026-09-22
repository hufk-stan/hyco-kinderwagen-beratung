// HyCo Tablet-Prototyp — Themen-Konfiguration "Kinderwagen".
// Modulares Muster: weitere Beratungsthemen (Erstausstattung, Kinderzimmer,
// Geschenke) können später als eigene Datei nach demselben Schema ergänzt
// werden (siehe js/themen/README.md), ohne app.js/state.js anzufassen.
// Alle Optionen sind KONZEPTVORSCHLAG (Auftragsvorgabe 2026-08-01, schlanker
// Ablauf), keine bestehenden PROF-/JTL-Kategorien — siehe ADAPTERGRENZEN.md.

export const THEMA_KINDERWAGEN = Object.freeze({
  id: "kinderwagen",
  label: "Kinderwagen",

  // Rahmenblock 1 — Wohn- und Hauptnutzungsumfeld
  umfeldOptionen: [
    { id: "stadt", label: "Stadt" },
    { id: "stadtrand", label: "Stadtrand" },
    { id: "laendlich", label: "Ländlich" },
    { id: "gemischt", label: "Gemischt" },
  ],

  // Rahmenblock 2 — Zugang, Abstellen, Größenbegrenzungen (Mehrfachauswahl)
  zugangBegrenzungOptionen: [
    { id: "enger-eingang", label: "Enger Eingang / Durchgang" },
    { id: "lift", label: "Lift vorhanden" },
    { id: "stiegen", label: "Stiegen / Stockwerk ohne Lift" },
    { id: "abstellmoeglichkeit", label: "Abstellmöglichkeit vorhanden" },
  ],

  // Rahmenblock 3 — Haupttransport
  transportOptionen: [
    { id: "zu-fuss", label: "Zu Fuß" },
    { id: "oepnv", label: "Öffentliche Verkehrsmittel" },
    { id: "auto", label: "Auto" },
    { id: "gemischt", label: "Gemischt" },
  ],

  // Marken-/Modellkatalog für Screen 4 — KONZEPTVORSCHLAG, am 2026-09-22 aus dem
  // Vergleichs-Prototyp (chatgpt.site-Demo) übernommen (Stephans Entscheidung:
  // "die echten Marken und Artikel auch übernehmen"), technisch direkt aus dessen
  // <select>-Optionen ausgelesen, nicht abgetippt. UNGEPRÜFTE Übernahme — welche
  // Marken/Modelle HFK tatsächlich führt, ist NICHT durch JTL/PROF belegt und von
  // Stephan zu bestätigen/korrigieren. Keine Live-/Bestands-/Preisanbindung, siehe
  // ADAPTERGRENZEN.md.
  markenKatalog: [
    { marke: "Bugaboo", modelle: ["Butterfly 2", "Cub", "Donkey 6", "Dragonfly Plus", "Fox 5 Renew"] },
    { marke: "Cybex", modelle: ["Coya Comfort", "Coya Style", "Gazelle S", "e-Gazelle S", "Priam 5 Comfort", "Priam 5 Style", "e-Priam 5 Comfort"] },
    { marke: "Joolz", modelle: ["Aer2", "Day5", "Geo5", "Hub2"] },
    { marke: "Naturkind", modelle: ["Ida + Solight", "Lars", "Lux Evo", "Mads"] },
    { marke: "Stokke", modelle: ["YOYO² 6+"] },
    { marke: "Maxi-Cosi", modelle: ["Fame", "Fame Cabin"] },
    { marke: "Mozomoza", modelle: ["Panda"] },
    { marke: "Thule", modelle: ["Charm 2-in-1", "Sleek 2", "Spring 2", "Urban Glide 3 Double", "Urban Glide 4-Wheel"] },
  ],
  markenKatalogStand: "2026-09-22",
  markenKatalogHinweis: "Demo-Sortimentsliste, keine Live-/JTL-/PROF-Anbindung — von HFK zu bestätigen.",
});

export const THEMEN_REGISTRY = Object.freeze({
  kinderwagen: THEMA_KINDERWAGEN,
  // erstausstattung: THEMA_ERSTAUSSTATTUNG,  // vorbereitet, noch nicht gebaut
  // kinderzimmer: THEMA_KINDERZIMMER,        // vorbereitet, noch nicht gebaut
  // geschenke: THEMA_GESCHENKE,              // vorbereitet, noch nicht gebaut
});

export function themaLaden(themaId) {
  const thema = THEMEN_REGISTRY[themaId];
  if (!thema) {
    throw new Error(`Unbekanntes Beratungsthema: "${themaId}" (nur "kinderwagen" ist im Prototyp hinterlegt)`);
  }
  return thema;
}
