import { CheckCircle, CircleNotch, Circle } from "@phosphor-icons/react";

export interface LoaderStep {
  label: string;
}

interface MultiStepLoaderProps {
  steps: readonly LoaderStep[];
  currentStep: number;
  title?: string;
}

export function MultiStepLoader({
  steps,
  currentStep,
  title
}: MultiStepLoaderProps): JSX.Element {
  return (
    <div className="ac-multi-loader" role="status" aria-live="polite">
      {title && <span className="pf-label">{title}</span>}
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div
            key={step.label}
            className={`ac-multi-step${isDone ? " is-done" : ""}${isActive ? " is-active" : ""}`}
          >
            {isDone ? (
              <CheckCircle size={18} weight="fill" aria-hidden="true" />
            ) : isActive ? (
              <CircleNotch size={18} className="pf-spin" aria-hidden="true" />
            ) : (
              <Circle size={18} aria-hidden="true" />
            )}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
