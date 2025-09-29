// src/lib/colorUtils.ts
export type ColorToken = { name: string; varName: string };

export function getVarRaw(varName: string): string {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(varName).trim();
}

export function getVarComputed(varName: string): string {
  const expr = getVarRaw(varName) || (varName.startsWith("--") ? `var(${varName})` : varName);
  const probe = document.createElement("span");
  probe.style.color = expr;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color; // rgb(...) or rgb(r g b / a)
  document.body.removeChild(probe);
  return computed;
}

export function getOklchLiteral(varName: string): string | null {
  // If your custom property literally contains 'oklch(...)', show that as-is for documentation.
  const raw = getVarRaw(varName);
  const m = raw.match(/oklch\([^)]*\)/i);
  return m ? m[0] : null;
}

export function copy(text: string) {
  if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
}
