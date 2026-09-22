// HyCo Tablet-Prototyp — SeBo-Adapter (MOCK, KEIN Write-back).
//
// Ein SeBo-Fall entsteht laut Auftrag NUR, wenn die Beratung tatsächlich einen
// Service-/Benachrichtigungsfall erzeugt — hier: Next Step "Benachrichtigungsfall
// anlegen" (Screen 4). Für jeden anderen Next Step liefert dieser Adapter keine
// Vorschau.
//
// Feldnamen und Pflicht/Optional-Einteilung sind BELEGT aus
// 08_SeBo_ServiceBot/benachrichtigungsliste/app/db.py (Tabelle `kundenwunsch`)
// und app/logic.py (ART_DES_WUNSCHES, KONTAKTPRAEFERENZ). `verlauf` ist dort
// ausschließlich Fall-Audit-Log dieser einen Benachrichtigungsliste, keine
// allgemeine Kundenhistorie — wird hier bewusst NICHT nachgebaut.
//
// Diese Funktion schreibt NICHTS in die echte SQLite-Datenbank
// (data_local/benachrichtigungsliste.db). Sie ist reine Vorschau/Simulation.

const ART_DES_WUNSCHES_MAPPING_HINWEIS =
  "Zuordnung Next-Step → art_des_wunsches ist ein Vorschlag dieses Prototyps, " +
  "keine bestätigte SeBo-Regel — vor echtem Andocken mit SeBo/Mago klären.";

function schaetzeArtDesWunsches(state) {
  // BELEGT: gültige Werte sind informieren | informieren_zuruecklegen |
  // info_klaeren | aussteller_muster (logic.py ART_DES_WUNSCHES).
  // Welcher Wert im Beratungskontext passt, ist NICHT belegt — einfache,
  // klar gekennzeichnete Heuristik statt Erfindung eines neuen Enum-Werts.
  const hinweistext = `${state.ergebnis.ergaenzung || ""} ${state.voiS.endkommentar || ""}`;
  if (/verfügbar|liefertermin|bestellbar/i.test(hinweistext)) {
    return "info_klaeren";
  }
  return "informieren";
}

function schaetzeKontaktpraeferenz(state) {
  const hatTelefon = !!state.kunde.telefon;
  const hatEmail = !!state.kunde.email;
  if (hatTelefon && hatEmail) return "beides";
  if (hatTelefon) return "telefon";
  if (hatEmail) return "email";
  return null; // UNGEKLAERT — keine Kontaktdaten erfasst
}

function produktSlotLabel(slot) {
  return slot && slot.marke && slot.modell ? `${slot.marke} · ${slot.modell}` : null;
}

function favoritName(state, thema) {
  const slotFuer = (id) => (id === "produkt-a" ? state.ergebnis.produkteGezeigt.a : id === "produkt-b" ? state.ergebnis.produkteGezeigt.b : null);
  const ersterFavorit = state.ergebnis.kundenfavoriten[0];
  return produktSlotLabel(slotFuer(ersterFavorit))
    || produktSlotLabel(state.ergebnis.hfkEmpfehlung)
    || thema.label;
}

export function seboVorschau(state, thema) {
  if (state.nextStep.haupt !== "benachrichtigungsfall-anlegen") {
    return {
      adapter: "sebo",
      status: "KEINE ÜBERGABE — Next Step ist nicht „Benachrichtigungsfall anlegen“.",
      payload: null,
    };
  }

  return {
    adapter: "sebo",
    status: "MOCK — Vorschau der Benachrichtigungsliste-Felder, KEIN echter Write-back in data_local/benachrichtigungsliste.db.",
    hinweis: ART_DES_WUNSCHES_MAPPING_HINWEIS,
    pflichtfelder: {
      kundenname: state.kunde.name || null,
      telefon: state.kunde.telefon || null,
      email: state.kunde.email || null,
      artikelbeschreibung: `${thema.label}: ${favoritName(state, thema)}`,
      erfasst_von: state.termin.beratungsperson || null,
      art_des_wunsches: schaetzeArtDesWunsches(state),
      naechster_pruefetermin: state.nextStep.faelligkeit || null,
    },
    optionaleFelder: {
      zustaendig: state.nextStep.verantwortlich || null,
      kundennummer: null, // UNGEKLAERT — in diesem Beratungsflow nicht erfasst
      kontaktpraeferenz: schaetzeKontaktpraeferenz(state),
      jtl_artikelnummer: null, // UNGEKLAERT — kein echtes Produkt verbunden
      ean: null,
      marke: null,
      variante: null,
      menge: null,
      spaetester_bedarfstermin: null,
      prioritaet: 0,
      notiz: state.ergebnis.ergaenzung || null,
      quelle: "beratung-tablet-prototyp", // NEUER Wertevorschlag, nicht bestätigt (bisher nur Default "neu" belegt)
    },
  };
}
