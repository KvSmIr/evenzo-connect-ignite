import type { Category } from "@/lib/mock-data";
import { categoryColor } from "@/lib/mock-data";

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground"
      style={{
        backgroundColor: `color-mix(in oklab, ${categoryColor(category)} 22%, transparent)`,
        color: categoryColor(category),
        border: `1px solid color-mix(in oklab, ${categoryColor(category)} 35%, transparent)`,
      }}
    >
      {category}
    </span>
  );
}
