const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function buildCode39Modules(value: string) {
  const normalized = value.toUpperCase();
  for (const ch of normalized) {
    if (!CODE39[ch]) {
      throw new Error(`Unsupported CODE39 char: "${ch}"`);
    }
  }

  const encoded = `*${normalized}*`;
  return encoded.split("").map((ch) => CODE39[ch]);
}

export function Code39Barcode({
  value,
  height = 56,
  narrow = 2,
  wide = 6,
  quiet = 10,
  className,
  title,
}: {
  value: string;
  height?: number;
  narrow?: number;
  wide?: number;
  quiet?: number;
  className?: string;
  title?: string;
}) {
  const modules = buildCode39Modules(value);

  // Pattern is 9 elements: bar/space alternating, starting with bar. Add 1 narrow inter-char gap.
  const interGap = narrow;
  const quietPx = quiet * narrow;

  let widthPx = quietPx * 2;
  for (const pattern of modules) {
    for (let i = 0; i < pattern.length; i++) {
      widthPx += pattern[i] === "w" ? wide : narrow;
    }
    widthPx += interGap;
  }

  let x = quietPx;
  const bars: Array<{ x: number; w: number }> = [];
  for (const pattern of modules) {
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === "w" ? wide : narrow;
      const isBar = i % 2 === 0;
      if (isBar) bars.push({ x, w });
      x += w;
    }
    x += interGap;
  }

  return (
    <svg
      className={className}
      width={widthPx}
      height={height}
      viewBox={`0 0 ${widthPx} ${height}`}
      role="img"
      aria-label={title ?? `Barcode ${value}`}
      shapeRendering="crispEdges"
    >
      <rect x={0} y={0} width={widthPx} height={height} fill="white" />
      {title ? <title>{title}</title> : null}
      {bars.map((b, idx) => (
        <rect key={idx} x={b.x} y={0} width={b.w} height={height} fill="black" />
      ))}
    </svg>
  );
}
