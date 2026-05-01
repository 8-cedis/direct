type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export default function QuantitySelector({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));

  return (
    <div className="inline-flex items-center rounded-[var(--radius-pill)] border-[0.5px] border-black/15 bg-white p-1">
      <button type="button" onClick={decrease} className="h-8 w-8 rounded-full text-lg text-[var(--color-dark-green)] hover:bg-[var(--color-light-green)]" aria-label="Decrease quantity">
        -
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-[var(--color-dark-green)]">{value}</span>
      <button type="button" onClick={increase} className="h-8 w-8 rounded-full text-lg text-[var(--color-dark-green)] hover:bg-[var(--color-light-green)]" aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
