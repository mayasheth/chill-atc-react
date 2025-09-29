import { useLocation } from "react-router-dom";
import { InlineLink, RouterLink } from "@/components/ui"

export function AppFooter() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  const version = import.meta.env.VITE_APP_VERSION ?? "0.1.0";
  const sha = (import.meta.env.VITE_GIT_SHA ?? "dev").slice(0, 7);
  const built = import.meta.env.VITE_BUILD_TIME ?? "";
  const source = import.meta.env.VITE_GIT_URL ?? ""

  // Minimal contact via mailto (prefill subject/body)
  const to = import.meta.env.VITE_CONTACT_EMAIL ?? "";
  const subject = encodeURIComponent("chill atc contact");
  const body = encodeURIComponent(
    `
    [Write your message here]

—
v${version} • ${sha}${built ? ` • ${built}` : ""}`
  );
  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

  return (
    <footer className="w-full bg-surface-1 mt-6">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-4 px-4 py-6 text-sm sm:text-base font-base font-semibold text-content-3">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {!onHome && (<RouterLink to="/">main</RouterLink>)}
          <RouterLink to="/colophon">colophon</RouterLink>
          <InlineLink href={mailto}>contact</InlineLink>
          <InlineLink href={source}>source</InlineLink>
        </nav>

        <span className="text-surface-4">{`v${version} • ${sha}${built ? ` • ${built}` : ""}`}</span>
      </div>
    </footer>
  );
}
