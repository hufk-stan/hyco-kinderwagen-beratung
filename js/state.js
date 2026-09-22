// HyCo Tablet-Prototyp — zentraler App-State.
// Persistenz: ausschließlich sessionStorage (Browser-Tab-lokal, weg beim Schließen).
// Das ist bewusst KEINE echte Speicherung personenbezogener Daten und KEIN
// Ersatz für eine Datenbank — nur "Eingaben bleiben während der Sitzung erhalten"
// (Auftragsvorgabe). Refresh liest denselben sessionStorage zurück, erzeugt aber
// nichts Neues und schreibt nirgendwo produktiv.
//
// Schlanker Ablauf (Auftragsvorgabe 2026-08-01): 6 Schritte statt vormals 8 —
// Öffnen → Rahmen (3 Blöcke) → Beratung läuft (Tablet weg) → Ergebnis →
// VoiS-Endkommentar → VoiS prüfen & bestätigen. Kein Kundengespräch wird je
// aufgenommen; VoiS ist ausschließlich der nachgelagerte Endkommentar der
// Beratungsperson (siehe voiS.js).

const STORAGE_KEY = "hyco-prototyp-v2";

export function leererState() {
  return {
    meta: { version: 2, gestartetAm: null },
    thema: "kinderwagen",
    kunde: { name: "", istVorlaeufig: true, kundenReferenzBestaetigt: false, telefon: "", email: "" },
    termin: { beratungsweg: "", beratungsperson: "", zeitpunkt: "", vorbereitungNotiz: "" },

    // Rahmenblöcke — objektive, sachliche Fakten, VOR der eigentlichen Beratung erfasst.
    rahmen: {
      umfeld: "",                 // Block 1, Pflicht
      begrenzungen: [],           // Block 2, Mehrfachauswahl
      keineBegrenzung: false,     // Block 2, Alternative zu begrenzungen
      begrenzungMass: "",         // Block 2, optional
      transport: "",              // Block 3, Pflicht
      kofferraumBegrenzung: "",   // Block 3, optional (nur relevant bei Auto/gemischt)
      ergaenzung: "",             // gemeinsames optionales Freitextfeld
    },

    beratungLaeuft: { begonnenAm: null },

    // Ergebnis — NUR das gemeinsam mit dem Kunden festgehaltene Ergebnis nach
    // der eigentlichen (nicht protokollierten) Beratung.
    ergebnis: {
      produkteGezeigt: { a: { marke: "", modell: "" }, b: { marke: "", modell: "" } },
      keineProduktauswahl: false,
      hfkEmpfehlung: { marke: "", modell: "" },
      keineEmpfehlung: false,
      kundenfavoriten: [],
      entscheidungsstatus: "orientierung",
      ergaenzung: "",
    },

    nextStep: { haupt: "", weitere: [], verantwortlich: "", faelligkeit: "", kanal: "", empfaenger: "" },

    kundengespraech: { beendetAm: null },

    // VoiS = Voice Summary: NUR der Endkommentar der Beratungsperson NACH dem
    // Kundengespräch. Das Kundengespräch selbst wird nie aufgenommen.
    voiS: { endkommentar: "", bearbeitet: {}, verworfen: {}, bestaetigt: false },

    navigation: { aktuellerSchritt: 1, besuchteSchritte: [1] },
  };
}

function tiefeKopie(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function erstelleStore() {
  let state = ausSessionStorageLesenOderNeu();
  const zuhoerer = new Set();

  function notify() {
    speichern(state);
    zuhoerer.forEach((fn) => fn(state));
  }

  return {
    get() {
      return state;
    },
    setzen(pfadUpdater) {
      state = pfadUpdater(tiefeKopie(state));
      notify();
    },
    abonnieren(fn) {
      zuhoerer.add(fn);
      return () => zuhoerer.delete(fn);
    },
    zuruecksetzen() {
      state = leererState();
      notify();
    },
    testfallLaden(testfall, jetztIso, naechsterWerktagIso) {
      const neu = leererState();
      neu.meta.gestartetAm = jetztIso;
      neu.thema = testfall.termin.thema;
      neu.kunde = { ...neu.kunde, name: testfall.kunde.name, istVorlaeufig: testfall.kunde.istVorlaeufig, kundenReferenzBestaetigt: true };
      neu.termin = { ...testfall.termin, zeitpunkt: jetztIso };
      neu.rahmen = { ...neu.rahmen, ...testfall.rahmen };
      neu.ergebnis = { ...neu.ergebnis, ...testfall.ergebnis };
      neu.nextStep = { ...testfall.nextStep, faelligkeit: naechsterWerktagIso };
      state = neu;
      notify();
    },
  };
}

function speichern(state) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    // Storage kann in privaten/eingeschränkten Kontexten fehlschlagen — Prototyp
    // läuft dann einfach ohne Zwischenspeicherung weiter (kein harter Fehler).
    console.warn("HyCo: sessionStorage nicht verfügbar, Zustand wird nicht gehalten.", e);
  }
}

function ausSessionStorageLesenOderNeu() {
  try {
    if (typeof sessionStorage !== "undefined") {
      const roh = sessionStorage.getItem(STORAGE_KEY);
      if (roh) return JSON.parse(roh);
    }
  } catch (e) {
    console.warn("HyCo: gespeicherter Zustand konnte nicht gelesen werden.", e);
  }
  return leererState();
}
