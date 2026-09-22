// HyCo Tablet-Prototyp — synthetischer Testfall.
// KEINE LIVE-DATEN. Alle Werte sind erfunden. Wird nur genutzt, um den Prototyp
// per Klick vorzubefüllen ("Testfall laden") — deutlich vom echten Ablauf
// getrennt: die App startet sonst mit einem leeren Formular, und der Button
// ist im UI als "(synthetisch)" / Demo gekennzeichnet.

export const TESTFALL = Object.freeze({
  synthetisch: true,
  kunde: {
    name: "Testkunde",
    istVorlaeufig: true,
  },
  termin: {
    beratungsweg: "store",
    thema: "kinderwagen",
    beratungsperson: "VIC",
    vorbereitungNotiz: "",
  },
  rahmen: {
    umfeld: "stadt",
    begrenzungen: ["stiegen"],
    keineBegrenzung: false,
    begrenzungMass: "",
    transport: "auto",
    kofferraumBegrenzung: "Kombi-Kofferraum, mittelgroß",
    ergaenzung: "",
  },
  ergebnis: {
    produkteGezeigt: {
      a: { marke: "Bugaboo", modell: "Fox 5 Renew" },
      b: { marke: "Joolz", modell: "Day5" },
    },
    keineProduktauswahl: false,
    hfkEmpfehlung: { marke: "Bugaboo", modell: "Fox 5 Renew" },
    keineEmpfehlung: false,
    kundenfavoriten: ["produkt-a", "produkt-b"],
    entscheidungsstatus: "engere-auswahl",
    ergaenzung: "",
  },
  nextStep: {
    haupt: "verfuegbarkeit-klaeren",
    weitere: [],
    verantwortlich: "VIC",
    faelligkeit: null, // wird beim Laden auf "nächster Werktag" gesetzt
    kanal: null,
    empfaenger: null,
  },
});

// Demo-Text für den simulierten Endkommentar — zeigt, welche Art von Inhalt
// gemeint ist (Erwartungen, Zielkonflikte, Kompromiss, Begründung). Wird nur
// beim Testfall-Laden vorbefüllt, ersetzt kein echtes Sprechen der Beratungsperson.
export const TESTFALL_ENDKOMMENTAR =
  "Testkunde kam mit dem Wunsch nach einem geländetauglichen, aber gleichzeitig " +
  "sehr leichten und kompakten Wagen — das haben wir gemeinsam durchgesprochen, " +
  "weil sich das in der Praxis oft ausschließt. Nach dem Falttest und Tragetest " +
  "war klar: kleines Faltmaß und leichtes Falten waren am Ende wichtiger als " +
  "Geländetauglichkeit, die im Alltag (Stadt, Auto, Stiegenhaus ohne Lift) kaum " +
  "gebraucht wird. Der Bugaboo Fox 5 Renew hat im Vergleich besser abgeschnitten und " +
  "wurde klar favorisiert. Offen bleibt die aktuelle Verfügbarkeit — das prüfen wir " +
  "und melden uns.";
