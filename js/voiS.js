// HyCo Tablet-Prototyp — VoiS-Erzeugung (Voice Summary).
//
// VoiS = KI-gestütztes Aufnehmen, Transkribieren und Strukturieren AUSSCHLIESSLICH
// des gesprochenen Endkommentars der Beratungsperson NACH der Beratung — niemals
// des Kundengesprächs selbst. Es gibt keine laufende Aufnahme während der
// Beratung, kein Kundenaudio, kein Gesprächstranskript.
//
// WICHTIG: VoiS entsteht hier NICHT ausschließlich aus Formulareingaben. Der
// inhaltliche Kern ist der freie Endkommentar-Text der Beratungsperson
// (state.voiS.endkommentar, Screen 5) — die objektiven Klick-Daten (Rahmen +
// Ergebnis) liefern nur die strukturierten Rahmendaten drumherum. In diesem
// Klickdummy gibt es keine echte Audioaufnahme/Transkription/KI-Anbindung —
// der Endkommentar wird als Demo-Texteingabe simuliert (siehe app.js Screen 5).
// Aufbewahrung/Löschung von Rohaufnahme/Rohtranskript sind UNGEKLAERT, solange
// nicht im Repo belegt — hier gibt es ohnehin keine Audiodatei, nur Text im
// Browser-sessionStorage.
//
// Voraussetzung (vom Aufrufer sicherzustellen, siehe app.js): VoiS wird erst
// gebaut/angeboten, nachdem state.kundengespraech.beendetAm gesetzt ist.

import { ENTSCHEIDUNGSSTATUS_LABEL, label } from "./labels.js";
import { NEXTSTEP_LABEL } from "./labels.js";

function produktSlotLabel(slot) {
  return slot && slot.marke && slot.modell ? `${slot.marke} · ${slot.modell}` : "";
}

function produktLabel(id, state) {
  if (!id) return "";
  if (id === "produkt-a") return produktSlotLabel(state.ergebnis.produkteGezeigt.a) || id;
  if (id === "produkt-b") return produktSlotLabel(state.ergebnis.produkteGezeigt.b) || id;
  return id;
}

function begrenzungLabels(ids, katalog) {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => {
    const treffer = katalog.find((k) => k.id === id);
    return treffer ? treffer.label : id;
  });
}

function gezeigteProdukteLabels(state) {
  const namen = [];
  const a = produktSlotLabel(state.ergebnis.produkteGezeigt.a);
  const b = produktSlotLabel(state.ergebnis.produkteGezeigt.b);
  if (a) namen.push(a);
  if (b) namen.push(b);
  return namen;
}

export function baueVoiS(state, thema) {
  return {
    metaKennzeichnung: {
      kiEntwurf: true,
      kundengespraechNichtAufgenommen: true,
      nurEndkommentar: true,
      keineLiveDaten: true,
    },
    rahmen: {
      umfeld: state.rahmen.umfeld,
      begrenzungen: state.rahmen.keineBegrenzung
        ? ["Keine relevante Begrenzung"]
        : begrenzungLabels(state.rahmen.begrenzungen, thema.zugangBegrenzungOptionen),
      begrenzungMass: state.rahmen.begrenzungMass,
      transport: state.rahmen.transport,
      kofferraumBegrenzung: state.rahmen.kofferraumBegrenzung,
      ergaenzung: state.rahmen.ergaenzung,
    },
    ergebnis: {
      gezeigteProdukte: state.ergebnis.keineProduktauswahl
        ? ["Noch keine konkrete Produktauswahl"]
        : gezeigteProdukteLabels(state),
      hfkEmpfehlung: state.ergebnis.keineEmpfehlung
        ? "Noch keine Empfehlung"
        : (produktSlotLabel(state.ergebnis.hfkEmpfehlung) || "—"),
      kundenfavoriten: state.ergebnis.kundenfavoriten.map((id) => produktLabel(id, state)).filter(Boolean),
      entscheidungsstatus: label(ENTSCHEIDUNGSSTATUS_LABEL, state.ergebnis.entscheidungsstatus),
      ergaenzung: state.ergebnis.ergaenzung,
    },
    // Der eigentliche narrative Kern — Erwartungen, Zielkonflikte, Kompromiss,
    // Empfehlungsbegründung: kommt AUSSCHLIESSLICH aus dem Endkommentar-Text,
    // nicht aus Kacheln/Formularfeldern.
    endkommentar: state.voiS.endkommentar,
    nextStep: {
      haupt: label(NEXTSTEP_LABEL, state.nextStep.haupt),
      verantwortlich: state.nextStep.verantwortlich,
      faelligkeit: state.nextStep.faelligkeit,
    },
    kundengespraechBeendetAm: state.kundengespraech.beendetAm,
  };
}
