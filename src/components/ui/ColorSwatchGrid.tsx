// src/components/ui/ColorSwatchesGrid.tsx
import { useMemo, useState } from "react";
import {
  copy,
  type ColorToken,
  getOklchLiteral,
  getVarComputed,
} from "@/lib/colorUtils";

const normOKLCH = (s?: string | null) =>
  s ? s.toLowerCase().replace(/\s+/g, "") : null;

function Swatch({
  token,
  isBgMatch,
  onCopied,
}: {
  token: ColorToken;
  isBgMatch: boolean;
  onCopied: () => void;
}) {
  const oklch = getOklchLiteral(token.varName); // expected to exist in your tokens
  const disabled = !oklch;

  return (
    <button
      type="button"
      onClick={() => {
        if (oklch) copy(oklch);
        onCopied();
      }}
      disabled={disabled}
      className={[
        "group relative h-8 w-8 sm:h-10 sm:w-10 rounded-md ring-1 ring-transparent hover:scale-110 focus-outline soft-transition",
        isBgMatch ? "border-1 border-dotted border-content-0" : "",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
      style={{ background: `var(${token.varName})` }}
      aria-label={`copy ${token.varName} OKLCH to clipboard`}
      title={disabled ? "no OKLCH available" : "click to copy OKLCH"}
    >
      {/* tiny toast */}
      <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-surface-2 px-1.5 py-0.5 text-sm font-base text-content-2 opacity-0 group-[.copied]:opacity-100 transition">
        copied
      </span>
    </button>
  );
}
/**
 * Renders two rows of 5 and a centered row of 3; only the swatch matching bgVar gets a default outline.
 * Copies OKLCH on click; never uses hex.
 */
export function ColorSwatchesGrid({
  colors,
  bgVar = "--color-surface-1",
}: {
  colors: ColorToken[];
  bgVar?: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Background matching (prefer OKLCH literal; fallback to computed RGB string equality if needed)
  const bgOKLCH = useMemo(() => normOKLCH(getOklchLiteral(bgVar)), [bgVar]);
  const bgRGB = useMemo(() => getVarComputed(bgVar), [bgVar]);

  const isBgMatch = (token: ColorToken) => {
    const tokOKLCH = normOKLCH(getOklchLiteral(token.varName));
    if (bgOKLCH && tokOKLCH) return tokOKLCH === bgOKLCH;
    // no hex here; only fallback to rgb string compare if ok
    return getVarComputed(token.varName) === bgRGB;
  };

  // Pattern: 5, 5, 3 (center the remainder)
  const row1 = colors.slice(0, 5);
  const row2 = colors.slice(5, 10);
  const row3 = colors.slice(10, 13);

  const onCopied = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 900);
  };

  const Row = ({ row }: { row: ColorToken[] }) => (
    <div className="grid grid-cols-5 gap-2">
      {row.map((c) => (
        <div key={c.varName} className={copiedKey === c.varName ? "group copied" : "group"}>
          <Swatch token={c} isBgMatch={isBgMatch(c)} onCopied={() => onCopied(c.varName)} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      {row1.length > 0 && <Row row={row1} />}
      {row2.length > 0 && <Row row={row2} />}
      {row3.length > 0 && (
        <div className="flex justify-center">
          <div
            className={`grid gap-2 ${
              row3.length === 1
                ? "grid-cols-1"
                : row3.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {row3.map((c) => (
              <div key={c.varName} className={copiedKey === c.varName ? "group copied" : "group"}>
                <Swatch token={c} isBgMatch={isBgMatch(c)} onCopied={() => onCopied(c.varName)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}