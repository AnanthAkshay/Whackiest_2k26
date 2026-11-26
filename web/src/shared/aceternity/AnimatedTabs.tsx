import type { ReactNode } from "react";

export interface AnimatedTabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface AnimatedTabsProps<T extends string> {
  tabs: readonly AnimatedTabOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  className?: string;
}

export function AnimatedTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className = ""
}: AnimatedTabsProps<T>): JSX.Element {
  return (
    <div className={`ac-tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ac-tab-btn${active ? " is-active" : ""}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span className="tabular-nums" style={{ opacity: active ? 0.9 : 0.7, fontSize: "12px" }}>
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
