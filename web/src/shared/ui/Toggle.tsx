export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps): JSX.Element {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      className={"pf-toggle" + (checked ? " is-checked" : "")}
      onClick={() => onChange(!checked)}
    >
      <span className="pf-toggle-track" aria-hidden="true">
        <span className="pf-toggle-thumb" />
      </span>
      <span className="pf-toggle-label">{label}</span>
    </button>
  );
}
