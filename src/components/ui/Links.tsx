import * as React from "react";
import { Link } from "react-router-dom";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: React.ReactNode;
};

/**
 * External-style link.
 * Always opens in a new tab with noopener/noreferrer
 */
export function InlineLink({ href, children, className, ...rest }: Props) {
  const base =
    "font-base font-semibold text-base text-content-4 hover:text-content-2 focus-outline-rounded soft-transition";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? `${base} ${className}` : base}
      {...rest}
    >
      {children}
    </a>
  );
}

export function RouterLink({ to, children, className = "" }: { to: string; children: React.ReactNode; className?: string }) {
  const base = "font-base font-semibold text-base text-content-4 hover:text-content-2 focus-outline-rounded soft-transition";
  return <Link to={to} className={`${base} ${className}`}>{children}</Link>;
}
