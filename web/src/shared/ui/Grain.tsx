export function Grain({ fixed = false }: { fixed?: boolean }): JSX.Element {
  return (
    <div
      className={"pf-grain" + (fixed ? " pf-grain--fixed" : "")}
      aria-hidden="true"
    />
  );
}
