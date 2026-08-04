"use client";
export function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      {label && (
        <span className="text-[10px] text-faint font-mono w-3">{label}</span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-elev rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-accent
          [&::-webkit-slider-thumb]:cursor-grab"
      />
      <span className="text-[10px] text-dim font-mono w-12 text-right tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
