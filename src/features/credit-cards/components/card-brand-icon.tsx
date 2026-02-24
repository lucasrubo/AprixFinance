import type { CardBandeira } from "../types";

const BRAND_COLORS: Record<CardBandeira, string> = {
  visa: "#1A1F71",
  mastercard: "#EB001B",
  elo: "#FFCB00",
  amex: "#007BC1",
  hipercard: "#CC0000",
  outro: "#6366f1",
};

const BRAND_LABELS: Record<CardBandeira, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  hipercard: "Hipercard",
  outro: "Outro",
};

interface CardBrandIconProps {
  bandeira: CardBandeira;
  size?: number;
  showLabel?: boolean;
}

export function CardBrandIcon({
  bandeira,
  size = 24,
  showLabel = false,
}: CardBrandIconProps) {
  const color = BRAND_COLORS[bandeira];
  const label = BRAND_LABELS[bandeira];

  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        width={size}
        height={size * 0.65}
        viewBox="0 0 36 24"
        fill="none"
        aria-label={label}
        role="img"
      >
        <rect width="36" height="24" rx="4" fill={color} opacity="0.15" />
        <rect
          x="1"
          y="1"
          width="34"
          height="22"
          rx="3"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <text
          x="18"
          y="15"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill={color}
          fontFamily="sans-serif"
        >
          {label.slice(0, 4).toUpperCase()}
        </text>
      </svg>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </span>
  );
}

export { BRAND_LABELS };
