import { Fragment } from "react";
import { TextLink } from "./TextLink";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({
  items,
  ariaLabel = "Breadcrumb",
}: {
  items: BreadcrumbItem[];
  ariaLabel?: string;
}): JSX.Element {
  return (
    <nav aria-label={ariaLabel} className="pf-breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && (
              <span className="pf-breadcrumb-sep" aria-hidden="true">
                /
              </span>
            )}
            {item.to && !isLast ? (
              <TextLink to={item.to}>{item.label}</TextLink>
            ) : (
              <span aria-current={isLast ? "page" : undefined} style={{ fontWeight: isLast ? 700 : 400 }}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
