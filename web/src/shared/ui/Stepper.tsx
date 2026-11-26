import { Link } from "react-router-dom";

export interface StepperItem {
  key: string;
  label: string;
  to?: string;
  description?: string;
  active?: boolean;
  completed?: boolean;
}

export interface StepperProps {
  items: StepperItem[];
  variant?: "pills" | "cards";
  ariaLabel?: string;
  className?: string;
}

export function Stepper({
  items,
  variant = "pills",
  ariaLabel = "Progress steps",
  className = ""
}: StepperProps): JSX.Element {
  if (variant === "cards") {
    return (
      <div className={["pf-stepper-cards", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
        {items.map((item) => (
          <article
            key={item.key}
            className={[
              "pf-card",
              "pf-stepper-card",
              item.active ? "is-active" : "",
              item.completed ? "is-completed" : ""
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="pf-chip pf-chip--lavender">{item.label}</span>
            {item.description && <p className="pf-stepper-desc">{item.description}</p>}
          </article>
        ))}
      </div>
    );
  }

  return (
    <nav className={["pf-stepper-pills", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      {items.map((item) => {
        const pillClass = [
          "pf-stepper-pill",
          item.active ? "is-active" : "",
          item.completed ? "is-completed" : ""
        ]
          .filter(Boolean)
          .join(" ");

        if (item.to) {
          return (
            <Link
              key={item.key}
              to={item.to}
              className={pillClass}
              aria-current={item.active ? "step" : undefined}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <span
            key={item.key}
            className={pillClass}
            aria-current={item.active ? "step" : undefined}
          >
            {item.label}
          </span>
        );
      })}
    </nav>
  );
}
