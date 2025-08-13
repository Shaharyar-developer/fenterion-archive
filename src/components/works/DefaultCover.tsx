import { BookText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DefaultCoverProps {
  title: string;
  initials: string;
  className?: string;
}

function pickAccentIndex(seed: string, modulo: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

const ACCENT_GRADIENTS = [
  "from-primary/20 via-primary/10 to-background",
  "from-emerald-500/25 via-emerald-500/10 to-background",
  "from-amber-500/25 via-amber-500/10 to-background",
  "from-sky-500/25 via-sky-500/10 to-background",
  "from-fuchsia-500/25 via-fuchsia-500/10 to-background",
  "from-rose-500/25 via-rose-500/10 to-background",
];

export function DefaultCover({
  title,
  initials,
  className,
}: DefaultCoverProps) {
  const accent =
    ACCENT_GRADIENTS[pickAccentIndex(title, ACCENT_GRADIENTS.length)];

  return (
    <div className="relative group">
      {/* Outer glow wrapper - radial bleed from accent */}
      <div
        className={cn(
          "absolute -inset-4 rounded-lg pointer-events-none -z-10",
          "bg-radial",
          accent, // pulls same gradient as card
          "opacity-25 blur-[48px]",
          "transition-opacity duration-300 group-hover:opacity-90 scale-110"
        )}
      />

      {/* Inner clipped card */}
      <div
        aria-label={`Placeholder cover for ${title}`}
        role="img"
        tabIndex={0}
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-lg",
          "bg-background/90 backdrop-blur-[100px] bg-gradient-to-br",
          accent,
          "transition-all duration-300 hover:shadow-lg/50 hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          className
        )}
      >
        {/* Dot grid texture */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-overlay",
            "[background:radial-gradient(circle_at_1px_1px,oklch(var(--foreground)_/_0.5)_1px,transparent_0)]",
            "[background-size:14px_14px]"
          )}
        />

        {/* Radial glow */}
        <div
          className={cn(
            "pointer-events-none absolute -inset-px",
            "bg-[radial-gradient(ellipse_at_35%_25%,oklch(var(--primary)_/_0.4),transparent_55%)]",
            "mix-blend-plus-lighter"
          )}
        />

        {/* Diagonal sheen */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            "bg-[linear-gradient(120deg,oklch(var(--foreground)_/_0.1),transparent_45%)]"
          )}
        />

        {/* Icon background */}
        <BookText
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "h-44 w-44 text-muted opacity-30 blur-[1px]",
            "mix-blend-overlay transition-opacity duration-300 group-hover:opacity-75"
          )}
          aria-hidden
        />

        {/* Initials */}
        <span
          className={cn(
            "absolute inset-0 flex items-start justify-center select-none p-5",
            "font-semibold tracking-tight",
            "text-[clamp(2.75rem,6.5vw,4.25rem)] leading-none",
            "text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] text-4xl"
          )}
        >
          {title.length > 25 ? initials : title}
        </span>

        {/* Bottom fade vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/65 to-transparent" />
      </div>
    </div>
  );
}
