"use client";

import { CategoryDot } from "@/components/category-badge";
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_SHORT_LABEL, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 3カテゴリーから1つを選ぶセグメントボタン */
export function CategoryPicker({
  value,
  onChange,
  size = "default",
}: {
  value: Category;
  onChange: (category: Category) => void;
  size?: "default" | "sm";
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-lg border bg-muted/50 p-0.5">
      {CATEGORIES.map((category) => {
        const selected = category === value;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            title={CATEGORY_LABEL[category]}
            onClick={() => onChange(category)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CategoryDot category={category} />
            {CATEGORY_SHORT_LABEL[category]}
          </button>
        );
      })}
    </div>
  );
}
