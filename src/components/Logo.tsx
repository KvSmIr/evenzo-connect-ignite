import { Flame } from "lucide-react";

type Props = { size?: "sm" | "md" | "lg" };

export function Logo({ size = "md" }: Props) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  const icon = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div className="flex items-center gap-1.5">
      <Flame className={`${icon} text-primary animate-flame-flicker`} fill="currentColor" />
      <span className={`${text} font-black tracking-tight text-gradient-flame`}>
        EVENZO
      </span>
    </div>
  );
}
