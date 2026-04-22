import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type Props = {
  children: ReactNode;
  /** Hide the bottom navigation (e.g. inside modals). */
  hideNav?: boolean;
};

/**
 * Mobile-first frame, max 430px, centered on desktop.
 * Adds bottom padding so content doesn't hide behind the nav.
 */
export function MobileFrame({ children, hideNav = false }: Props) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-background text-foreground">
      <div className={hideNav ? "" : "pb-24"}>{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
