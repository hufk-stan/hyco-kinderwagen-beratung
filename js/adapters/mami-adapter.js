// HyCo Tablet-Prototyp — MaMi-Adapter (MOCK).
//
// Zielbild (KONZEPTVORSCHLAG, nicht gebaut): MaMi wird das systemunabhängige
// Kunden-, Beratungs- und Beziehungsgedächtnis. VoiS (Voice Summary — NUR der
// Endkommentar der Beratungsperson, NIE das Kundengespräch), Beratungsnotizen
// und allgemeine Kundenprioritäten gehören NICHT nach JTL, sondern bleiben hier.
//
// In diesem Prototyp entspricht "MaMi speichert" der sessionStorage-Ablage aus
// state.js — es gibt keine echte Datenbank, keinen Server, keine Cloud-Persistenz.
// Diese Funktion liefert nur eine Vorschau, was ein echtes MaMi-Backend später
// als Beratungs-Datensatz ablegen würde.

export function mamiVorschau(state, voiS) {
  return {
    adapter: "mami",
    status: "MOCK — nur lokale Sitzung (sessionStorage), kein Server, keine Datenbank",
    datensatz: {
      thema: state.thema,
      kunde: { name: state.kunde.name, istVorlaeufig: state.kunde.istVorlaeufig },
      consultation: {
        beratungsperson: state.termin.beratungsperson,
        beratungsweg: state.termin.beratungsweg,
        zeitpunkt: state.termin.zeitpunkt,
        kundengespraechBeendetAm: state.kundengespraech.beendetAm,
      },
      voiS,
    },
  };
}
