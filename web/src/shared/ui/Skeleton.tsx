export type SkeletonVariant = "text" | "title" | "card" | "circle";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = ""
}: SkeletonProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={["pf-skeleton", `pf-skeleton--${variant}`, className].filter(Boolean).join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height
      }}
    />
  );
}
