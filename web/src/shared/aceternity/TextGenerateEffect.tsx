import type { CSSProperties } from "react";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  id?: string;
  as?: "h1" | "h2" | "p" | "span";
  style?: CSSProperties;
}

export function TextGenerateEffect({
  words,
  className = "",
  id,
  as: Tag = "h1",
  style
}: TextGenerateEffectProps): JSX.Element {
  const tokens = words.split(" ");
  return (
    <Tag id={id} className={className} style={style}>
      {tokens.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="ac-text-gen-word"
          style={{ "--word-i": idx } as CSSProperties}
        >
          {word}
          {idx < tokens.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
