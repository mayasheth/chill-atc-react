import { useEffect, useRef, useState } from "react";

type SliderProps = {
  id?: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export function Slider({
  id,
  label = "",
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  onCommit,
  className = "",
  disabled = false,
  icon,
}: SliderProps) {
  const [internalValue, setInternalValue] = useState<number>(value ?? min);
  const inputRef = useRef<HTMLInputElement>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const effectiveValue = value ?? internalValue;

  // Keep internal state in sync if parent controls `value`
  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    setInternalValue(newVal);
    onChange(newVal);
  };

  const handleCommit = () => {
    if (!onCommit) return;
    const raw = inputRef.current ? Number(inputRef.current.value) : effectiveValue;
    onCommit(clamp(raw));
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Treat Enter/Space/Escape as “commit” moments
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
      handleCommit();
    }
  };

  const percent = ((effectiveValue - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-2 ${className} `}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-center text-content-0"
        >
          {label} ({effectiveValue})
        </label>
      )}

      <div className="flex items-center gap-2 w-full">
        {icon && <span>{icon}</span>}

        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={effectiveValue}
          onChange={handleChange}
          onPointerUp={handleCommit}     // mouse/touch pointers
          onTouchEnd={handleCommit}      // iOS/Safari safety
          onKeyUp={handleKeyUp}          // keyboard commit
          onBlur={handleCommit}          // tabbing away also commits
          disabled={disabled}
          className="custom-slider disabled:opacity-50 disabled:cursor-not-allowed focus-outline"
          style={{ ["--value" as any]: `${percent}%` }}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={effectiveValue}
        />
      </div>
    </div>
  );
}
