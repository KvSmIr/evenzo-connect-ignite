import { useRef, useState } from "react";
import { Flame, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useFlames } from "@/lib/flame-store";

type Props = {
  eventId: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export function FlameButton({ eventId, size = "md", fullWidth }: Props) {
  const { flames, cycleFlame } = useFlames();
  const status = flames[eventId] ?? "none";
  const [pulse, setPulse] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = cycleFlame(eventId);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);

    if (next === "chaud" && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 35,
        origin: { x, y },
        colors: ["#E8593C", "#F97316", "#FBBF24", "#FFFFFF"],
        scalar: 0.8,
        ticks: 120,
      });
    }
  };

  const sizeClasses =
    size === "lg" ? "h-14 px-6 text-base"
    : size === "sm" ? "h-9 px-3 text-xs"
    : "h-11 px-4 text-sm";

  const iconSize = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-[0.97] select-none";

  if (status === "going") {
    return (
      <button
        ref={btnRef}
        onClick={handleClick}
        className={cn(
          base,
          sizeClasses,
          fullWidth && "w-full",
          "bg-success/15 text-success border border-success/40",
          pulse && "animate-flame-pulse"
        )}
      >
        <Check className={iconSize} strokeWidth={3} />
        J'y vais
      </button>
    );
  }

  if (status === "chaud") {
    return (
      <button
        ref={btnRef}
        onClick={handleClick}
        className={cn(
          base,
          sizeClasses,
          fullWidth && "w-full",
          "bg-gradient-flame text-primary-foreground shadow-flame",
          pulse && "animate-flame-pulse"
        )}
      >
        <Flame className={cn(iconSize, "animate-flame-flicker")} fill="currentColor" />
        Je suis chaud !
      </button>
    );
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={cn(
        base,
        sizeClasses,
        fullWidth && "w-full",
        "bg-primary text-primary-foreground hover:brightness-110",
        pulse && "animate-flame-pulse"
      )}
    >
      <Flame className={iconSize} />
      Je suis chaud !
    </button>
  );
}
