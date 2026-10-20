/** 2X8: componenten zijn CSS-klassen uit bundle.css. X8 tekent de symbolen. */
declare namespace X8 {
  type Symbool = "cirkel" | "pijl" | "ster" | "schakel" | "kruis" | "acht" | "punt" | "pijl-rechts" | "golf";
  /** Geeft het symbool terug als SVG-tekst in currentColor. dikte = lijndikte op een raster van 120 (standaard 14). */
  function symbool(naam: Symbool, opts?: { dikte?: number }): string;
  /** Vult elk element met data-symbool="naam" (en optioneel data-dikte) binnen root. */
  function mount(root?: ParentNode): void;
  /** Het officiële 2X8-logo als SVG-tekst in currentColor. */
  function logo(): string;
  /** De X uit het logo als SVG-tekst in currentColor. */
  function beeldmerk(): string;
  const namen: Symbool[];
}
