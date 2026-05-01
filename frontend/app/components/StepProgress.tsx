type StepProgressProps = {
  steps: string[];
  currentStep: number;
};

export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="relative mb-3 mt-2 h-[2px] w-full bg-gray-200">
        <div
          className="absolute left-0 top-0 h-[2px] bg-[var(--color-primary-green)] transition-all duration-200"
          style={{ width: `${(Math.max(currentStep, 0) / Math.max(steps.length - 1, 1)) * 100}%` }}
        />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={step} className="flex flex-col items-center gap-2 text-center">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-[0.5px] text-xs font-bold ${
                  isCompleted
                    ? "border-[var(--color-primary-green)] bg-[var(--color-primary-green)] text-white"
                    : isActive
                      ? "border-white bg-[var(--color-primary-green)] text-white ring-2 ring-[var(--color-primary-green)]"
                      : "border-gray-400 bg-white text-gray-500"
                }`}
              >
                {isCompleted ? "✓" : ""}
              </span>
              <span className="text-xs text-[var(--color-muted)] md:text-sm">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
