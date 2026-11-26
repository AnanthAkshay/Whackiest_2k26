import type { CSSProperties } from "react";

interface TypewriterEffectProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
}

export function TypewriterEffect({
  text,
  className = "",
  as: Tag = "h1"
}: TypewriterEffectProps): JSX.Element {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="ac-text-gen-word"
          style={{ "--word-i": Math.min(idx, 18) } as CSSProperties}
        >
          {word}
          {idx < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
