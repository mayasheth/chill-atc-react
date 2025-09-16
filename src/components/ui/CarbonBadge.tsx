// src/components/ui/CarbonBadge.tsx
import { useEffect } from "react";

export function CarbonBadge({
  dark = true,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  useEffect(() => {
    // Load the official embed script once per app
    const id = "wcb-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://unpkg.com/website-carbon-badges@1.1.3/b.min.js";
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div
      className={[
        "cb-wrapper", // our wrapper root (styles below)
        className,
      ].join(" ")}
    >
      

      {/* The official badge target element (must be id="wcb") */}
      <div id="wcb" className={`carbonbadge ${dark ? "wcb-d" : ""}`} />
    </div>
  );
}
