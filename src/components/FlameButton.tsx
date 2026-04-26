import { useRef, useState } from "react";
import { Flame, Check, Navigation } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useFlames } from "@/lib/flame-store";
import { useAuth } from "@/lib/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

type Props = {
  eventId: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  pill?: boolean;
  variant?: "chaud" | "going";
};

export function FlameButton({ eventId, size = "md", fullWidth, pill, variant = "chaud" }: Props) {
  const { flagsFor, toggleChaud, toggleGoing } = useFlames();
  const { user } = useAuth();
  const navigate = useNavigate();
  const flags = flagsFor(eventId);
  const isActive = variant === "going" ? flags.going : flags.chaud;
  const [pulse, setPulse] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Connecte-toi pour réagir");
      navigate({ to: "/auth" });
      return;
    }
    setPulse(true);
    setTimeout(() => setPulse(false), 600);

    if (variant === "going") {
      await toggleGoing(eventId);
    } else {
      const next = await toggleChaud(eventId);
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
    }
  };

  const sizeClasses = pill
    ? "h-10 px-4 text-[13px]"
    : size === "lg" ? "h-14 px-6 text-base"
    : size === "sm" ? "h-9 px-3 text-xs"
    : "h-11 px-4 text-sm";

  const iconSize = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const radius = pill ? "rounded-[20px]" : "rounded-lg";
  const base = `inline-flex items-center justify-center gap-2 ${radius} font-bold transition-all active:scale-[0.97] select-none`;

  // GOING variant — independent of chaud
  if (variant === "going") {
    if (isActive) {
      return (
        <button
          ref={btnRef}
          onClick={handleClick}
          className={cn(base, sizeClasses, fullWidth && "w-full", "text-primary-foreground", pulse && "animate-flame-pulse")}
          style={{ background: "#1D9E75" }}
        >
          <Check className={iconSize} strokeWidth={3} />
          J'y vais ✅
        </button>
      );
    }
    return (
      <button
        ref={btnRef}
        onClick={handleClick}
        className={cn(base, sizeClasses, fullWidth && "w-full", "border border-border bg-secondary text-foreground hover:bg-surface-elevated")}
      >
        <Navigation className={iconSize} />
        Y aller
      </button>
    );
  }

  // CHAUD variant — independent of going
  if (isActive) {
    return (
      <button
        ref={btnRef}
        onClick={handleClick}
        className={cn(base, sizeClasses, fullWidth && "w-full", "text-primary-foreground shadow-flame", pulse && "animate-flame-pulse")}
        style={{ background: "#E8593C" }}
      >
        <Flame className={cn(iconSize, "animate-flame-flicker")} fill="currentColor" />
        Chaud ! 🔥
      </button>
    );
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={cn(base, sizeClasses, fullWidth && "w-full", "border bg-transparent text-foreground hover:bg-secondary", pulse && "animate-flame-pulse")}
      style={{ borderColor: "#333" }}
    >
      <Flame className={iconSize} />
      Je suis chaud 🔥
    </button>
  );
}
