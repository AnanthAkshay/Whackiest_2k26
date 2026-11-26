import type { FormEvent, KeyboardEvent } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "../ui";

interface AiInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder: string;
  disabled?: boolean;
  sendLabel: string;
  hint?: string;
}

export function AiInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  sendLabel,
  hint = "Enter to send · Shift+Enter for new line"
}: AiInputProps): JSX.Element {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  }

  return (
    <form className="sk-ai-input-wrap" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="sk-ai-composer">
        {placeholder}
      </label>
      <textarea
        id="sk-ai-composer"
        className="sk-ai-textarea"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="sk-ai-input-bar">
        <span className="fineprint">{hint}</span>
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || !value.trim()}
          aria-label={sendLabel}
        >
          <span>{sendLabel}</span>
          <PaperPlaneRight size={16} weight="regular" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
