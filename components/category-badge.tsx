import { CATEGORY_DOT_CLASS, CATEGORY_SHORT_LABEL, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", CATEGORY_DOT_CLASS[category], className)}
    />
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <CategoryDot category={category} />
      {CATEGORY_SHORT_LABEL[category]}
    </span>
  );
}
