export interface TabItem<T extends string = string> {
  id: T;
  label: string;
}

export function Tabs<T extends string>({
  items,
  activeId,
  onSelect,
  ariaLabel,
  className = "",
}: {
  items: TabItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  ariaLabel: string;
  className?: string;
}): JSX.Element {
  return (
    <div role="tablist" aria-label={ariaLabel} className={`pf-tabs ${className}`.trim()}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`pf-tab ${active ? "is-active" : ""}`.trim()}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
