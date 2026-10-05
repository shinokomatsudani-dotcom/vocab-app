"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { CategoryBadge, CategoryDot } from "@/components/category-badge";
import { WordEditorDialog } from "@/components/word-editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated, useWords } from "@/hooks/use-words";
import { countByCategory } from "@/lib/test-plan";
import { CATEGORIES, CATEGORY_SHORT_LABEL, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as wordStore from "@/lib/word-store";

type Filter = Category | "all";
type Sort = "newest" | "asc" | "desc";

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "newest", label: "追加順" },
  { key: "asc", label: "A→Z" },
  { key: "desc", label: "Z→A" },
];

const collator = new Intl.Collator("ja", {
  sensitivity: "base",
  numeric: true,
});

export default function WordListPage() {
  const words = useWords();
  const hydrated = useHydrated();
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [editingId, setEditingId] = useState<string | null>(null);

  const counts = useMemo(() => countByCategory(words), [words]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = words.filter(
      (w) =>
        (filter === "all" || w.category === filter) &&
        (!q ||
          w.term.toLowerCase().includes(q) ||
          w.meanings.some((m) => m.text.toLowerCase().includes(q))),
    );
    if (sort === "newest") return filtered;
    const direction = sort === "asc" ? 1 : -1;
    return [...filtered].sort(
      (a, b) => direction * collator.compare(a.term, b.term),
    );
  }, [words, filter, query, sort]);
  const editing = words.find((w) => w.id === editingId) ?? null;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    const duplicate = words.some(
      (w) => w.term.toLowerCase() === term.trim().toLowerCase(),
    );
    wordStore.addWord(term, meaning);
    toast.success(
      duplicate
        ? `「${term.trim()}」を追加しました（同じ単語がすでにあります）`
        : `「${term.trim()}」を追加しました`,
    );
    setTerm("");
    setMeaning("");
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "すべて", count: words.length },
    ...CATEGORIES.map((c) => ({
      key: c,
      label: CATEGORY_SHORT_LABEL[c],
      count: counts[c],
    })),
  ];

  return (
    <div className="grid gap-6">
      <form
        onSubmit={handleAdd}
        className="grid gap-2 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1.4fr_auto]"
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="単語"
          aria-label="単語"
          className="h-9 text-base"
          onKeyDown={(e) =>
            e.key === "Enter" && e.nativeEvent.isComposing && e.preventDefault()
          }
        />
        <Input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="意味（あとからでもOK）"
          aria-label="意味"
          className="h-9 text-base"
          onKeyDown={(e) =>
            e.key === "Enter" && e.nativeEvent.isComposing && e.preventDefault()
          }
        />
        <Button type="submit" className="h-9" disabled={!term.trim()}>
          <Plus />
          追加
        </Button>
      </form>

      {hydrated && words.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="font-medium">まだ単語がありません</p>
          <p className="text-sm text-muted-foreground">
            上のフォームから追加するか、サンプルで試してみましょう。
          </p>
          <Button variant="outline" onClick={() => wordStore.addSampleWords()}>
            サンプル単語を追加
          </Button>
        </div>
      ) : (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                    filter === tab.key
                      ? "border-foreground bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.key !== "all" && <CategoryDot category={tab.key} />}
                  {tab.label}
                  <span className="tabular-nums opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div
                role="radiogroup"
                aria-label="並べ替え"
                className="inline-flex shrink-0 rounded-lg border bg-muted/50 p-0.5"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    role="radio"
                    aria-checked={sort === option.key}
                    onClick={() => setSort(option.key)}
                    className={cn(
                      "h-7 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                      sort === option.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
                <MagnifyingGlass className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="単語・意味で検索"
                  aria-label="検索"
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              該当する単語がありません
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {visible.map((word) => (
                <li key={word.id}>
                  <button
                    onClick={() => setEditingId(word.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">{word.term}</p>
                      {word.meanings.length > 0 ? (
                        <p className="mt-0.5 text-sm text-muted-foreground break-words">
                          {word.meanings.map((m) => m.text).join(" ／ ")}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-muted-foreground/60 italic">
                          意味が未登録です（タップして追加）
                        </p>
                      )}
                    </div>
                    <CategoryBadge category={word.category} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <WordEditorDialog word={editing} onClose={() => setEditingId(null)} />
    </div>
  );
}
