import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

export interface TextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to?: LinkProps["to"];
  href?: string;
  current?: boolean;
  bold?: boolean;
  children: ReactNode;
}

export function TextLink({
  to,
  href,
  current = false,
  bold = false,
  className = "",
  children,
  ...rest
}: TextLinkProps): JSX.Element {
  const cls = ["pf-text-link", current ? "is-current" : "", bold ? "pf-text-link--bold" : "", className]
    .filter(Boolean)
    .join(" ");

  if (to !== undefined) {
    return (
      <Link to={to} className={cls} aria-current={current ? "page" : undefined} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} aria-current={current ? "page" : undefined} {...rest}>
      {children}
    </a>
  );
}
