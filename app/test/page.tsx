"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, X } from "@phosphor-icons/react";
import { CategoryDot } from "@/components/category-badge";
import { CategoryPicker } from "@/components/category-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated, useWords } from "@/hooks/use-words";
import {
  allocate,
  countByCategory,
  EMPTY_COUNTS,
  pickQuestions,
  type Ratios,
} from "@/lib/test-plan";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_SHORT_LABEL,
  type Category,
  type Word,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import * as wordStore from "@/lib/word-store";

type Mode = "single" | "mix";

type Settings = {
  count: number;
  mode: Mode;
  category: Category;
  ratios: Ratios;
};

type Phase =
  | { kind: "setup" }
  | { kind: "run"; questions: Word[]; index: number; revealed: boolean; results: boolean[] }
  | { kind: "result"; questions: Word[]; results: boolean[] };

const RATIO_PRESETS: { label: string; ratios: Ratios }[] = [
  { label: "均等", ratios: { mastered: 33, almost: 33, learning: 34 } },
  { label: "苦手重視", ratios: { mastered: 10, almost: 30, learning: 60 } },
  { label: "仕上げ", ratios: { mastered: 0, almost: 70, learning: 30 } },
];

export default function TestPage() {
  const words = useWords();
  const hydrated = useHydrated();
  const [settings, setSettings] = useState<Settings>({
    count: 10,
    mode: "single",
    category: "learning",
    ratios: RATIO_PRESETS[1].ratios,
  });
  const [phase, setPhase] = useState<Phase>({ kind: "setup" });

  function start() {
    const perCategory =
      settings.mode === "single"
        ? { ...EMPTY_COUNTS, [settings.category]: settings.count }
        : allocate(settings.count, settings.ratios);
    const questions = pickQuestions(words, perCategory);
    if (questions.length === 0) {
      setPhase({ kind: "setup" });
      return;
    }
    setPhase({ kind: "run", questions, index: 0, revealed: false, results: [] });
  }

  if (!hydrated) return null;

  if (words.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
        <p className="font-medium">テストする単語がありません</p>
        <p className="text-sm text-muted-foreground">まずは単語帳に単語を追加しましょう。</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          単語帳へ
        </Button>
      </div>
    );
  }

  if (phase.kind === "run") {
    return (
      <TestRunner
        phase={phase}
        onChange={setPhase}
        onQuit={() => setPhase({ kind: "setup" })}
      />
    );
  }

  if (phase.kind === "result") {
    return (
      <TestResult
        questions={phase.questions}
        results={phase.results}
        words={words}
        onRetry={start}
        onBack={() => setPhase({ kind: "setup" })}
      />
    );
  }

  return <TestSetup words={words} settings={settings} onChange={setSettings} onStart={start} />;
}

/* ───────── 設定 ───────── */

function TestSetup({
  words,
  settings,
  onChange,
  onStart,
}: {
  words: Word[];
  settings: Settings;
  onChange: (settings: Settings) => void;
  onStart: () => void;
}) {
  const available = useMemo(() => countByCategory(words), [words]);
  const ratioTotal = CATEGORIES.reduce((sum, c) => sum + settings.ratios[c], 0);
  const allocation = allocate(settings.count, settings.ratios);

  const maxCount = settings.mode === "single" ? available[settings.category] : words.length;

  const errors: string[] = [];
  if (!Number.isInteger(settings.count) || settings.count < 1) {
    errors.push("問題数は1以上で入力してください");
  } else if (settings.mode === "single") {
    if (available[settings.category] === 0) {
      errors.push(`「${CATEGORY_SHORT_LABEL[settings.category]}」にはまだ単語がありません`);
    } else if (settings.count > available[settings.category]) {
      errors.push(
        `「${CATEGORY_SHORT_LABEL[settings.category]}」には ${available[settings.category]} 語しかありません`
      );
    }
  } else {
    if (ratioTotal !== 100) errors.push(`割合の合計を100%にしてください（現在 ${ratioTotal}%）`);
    else
      for (const c of CATEGORIES) {
        if (allocation[c] > available[c]) {
          errors.push(
            `「${CATEGORY_SHORT_LABEL[c]}」から ${allocation[c]} 問必要ですが、${available[c]} 語しかありません`
          );
        }
      }
  }

  function setRatio(category: Category, value: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(value) || 0));
    onChange({ ...settings, ratios: { ...settings.ratios, [category]: clamped } });
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold">テスト</h1>

      <Section title="問題数">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={1}
            max={maxCount || undefined}
            value={Number.isNaN(settings.count) ? "" : settings.count}
            onChange={(e) => onChange({ ...settings, count: e.target.valueAsNumber })}
            className="h-9 w-24 text-base tabular-nums"
            aria-label="問題数"
          />
          <span className="text-sm text-muted-foreground">問</span>
          <div className="ml-2 flex gap-1">
            {[5, 10, 20].map((n) => (
              <Button
                key={n}
                variant={settings.count === n ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onChange({ ...settings, count: n })}
              >
                {n}問
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled={maxCount === 0}
              onClick={() => onChange({ ...settings, count: maxCount })}
            >
              全部（{maxCount}）
            </Button>
          </div>
        </div>
      </Section>

      <Section title="出題範囲">
        <div className="grid gap-2 sm:grid-cols-2">
          <ModeCard
            selected={settings.mode === "single"}
            title="カテゴリー"
            description="1つのカテゴリーから出題"
            onSelect={() => onChange({ ...settings, mode: "single" })}
          />
          <ModeCard
            selected={settings.mode === "mix"}
            title="カテゴリーミックス"
            description="3つのカテゴリーを好きな割合で混ぜる"
            onSelect={() => onChange({ ...settings, mode: "mix" })}
          />
        </div>

        {settings.mode === "single" ? (
          <div role="radiogroup" className="mt-3 grid gap-2">
            {CATEGORIES.map((c) => {
              const selected = settings.category === c;
              return (
                <button
                  key={c}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ ...settings, category: c })}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    selected ? "border-primary bg-accent" : "hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full border",
                      selected && "border-primary"
                    )}
                  >
                    {selected && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  <CategoryDot category={c} />
                  <span className="flex-1 text-sm font-medium">{CATEGORY_LABEL[c]}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {available[c]} 語
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 grid gap-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">どのカテゴリーをどの割合で混ぜるか</p>
              <div className="flex gap-1">
                {RATIO_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="xs"
                    onClick={() => onChange({ ...settings, ratios: preset.ratios })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {CATEGORIES.map((c) => {
              const short = allocation[c] > available[c] && ratioTotal === 100;
              return (
                <div key={c} className="grid gap-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <CategoryDot category={c} />
                    <span className="flex-1 font-medium">{CATEGORY_LABEL[c]}</span>
                    <span className={cn("tabular-nums", short ? "text-destructive" : "text-muted-foreground")}>
                      {ratioTotal === 100 ? `${allocation[c]} 問` : "– 問"}
                      <span className="text-xs"> ／ {available[c]} 語</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={settings.ratios[c]}
                      onChange={(e) => setRatio(c, e.target.valueAsNumber)}
                      aria-label={`${CATEGORY_SHORT_LABEL[c]}の割合`}
                      className="flex-1 accent-primary"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={settings.ratios[c]}
                        onChange={(e) => setRatio(c, e.target.valueAsNumber)}
                        aria-label={`${CATEGORY_SHORT_LABEL[c]}の割合（%）`}
                        className="h-8 w-16 text-right tabular-nums"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <RatioBar ratios={settings.ratios} total={ratioTotal} />
          </div>
        )}
      </Section>

      {errors.length > 0 && (
        <ul className="grid gap-1 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <Button size="lg" className="h-11 text-base" disabled={errors.length > 0} onClick={onStart}>
        テストを始める
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-bold text-muted-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function ModeCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "grid gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors",
        selected ? "border-primary bg-accent" : "hover:bg-muted/50"
      )}
    >
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function RatioBar({ ratios, total }: { ratios: Ratios; total: number }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {CATEGORIES.map((c) => (
          <div
            key={c}
            className={cn(
              "h-full transition-[width]",
              c === "mastered" ? "bg-tag-green" : c === "almost" ? "bg-tag-amber" : "bg-tag-rose"
            )}
            style={{ width: `${Math.min(ratios[c], 100)}%` }}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-right text-xs tabular-nums",
          total === 100 ? "text-muted-foreground" : "font-medium text-destructive"
        )}
      >
        合計 {total}%
      </p>
    </div>
  );
}

/* ───────── 出題 ───────── */

function TestRunner({
  phase,
  onChange,
  onQuit,
}: {
  phase: Extract<Phase, { kind: "run" }>;
  onChange: (phase: Phase) => void;
  onQuit: () => void;
}) {
  const { questions, index, revealed, results } = phase;
  const word = questions[index];

  function answer(remembered: boolean) {
    const nextResults = [...results, remembered];
    if (index + 1 >= questions.length) {
      onChange({ kind: "result", questions, results: nextResults });
    } else {
      onChange({ ...phase, index: index + 1, revealed: false, results: nextResults });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="tabular-nums">
          {index + 1} / {questions.length}
        </span>
        <Button variant="ghost" size="sm" onClick={onQuit}>
          中断する
        </Button>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width]"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <div className="grid min-h-72 content-center justify-items-center gap-6 rounded-2xl border bg-card px-6 py-10 text-center">
        <p className="text-3xl font-bold break-all sm:text-4xl">{word.term}</p>
        {revealed ? (
          word.meanings.length > 0 ? (
            <ol className="grid gap-1 text-lg">
              {word.meanings.map((m, i) => (
                <li key={m.id}>
                  {word.meanings.length > 1 && (
                    <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                  )}
                  {m.text}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground">意味が未登録です</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">意味を思い出してみましょう</p>
        )}
      </div>

      {revealed ? (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" className="h-12 text-base" onClick={() => answer(false)}>
            <X />
            覚えてなかった
          </Button>
          <Button size="lg" className="h-12 text-base" onClick={() => answer(true)}>
            <Check />
            覚えてた
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          variant="secondary"
          className="h-12 text-base"
          onClick={() => onChange({ ...phase, revealed: true })}
        >
          意味を見る
        </Button>
      )}
    </div>
  );
}

/* ───────── 結果 ───────── */

function TestResult({
  questions,
  results,
  words,
  onRetry,
  onBack,
}: {
  questions: Word[];
  results: boolean[];
  words: Word[];
  onRetry: () => void;
  onBack: () => void;
}) {
  const correct = results.filter(Boolean).length;
  const rate = Math.round((correct / questions.length) * 100);

  return (
    <div className="grid gap-6">
      <div className="grid justify-items-center gap-1 rounded-2xl border bg-card px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">結果</p>
        <p className="text-4xl font-bold tabular-nums">
          {correct}
          <span className="text-xl text-muted-foreground"> / {questions.length}</span>
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">正答率 {rate}%</p>
      </div>

      <section className="grid gap-2">
        <h2 className="text-sm font-bold text-muted-foreground">カテゴリーを見直す</h2>
        <p className="text-xs text-muted-foreground">
          テストの手ごたえに合わせて、ここでそのまま覚え具合を変更できます。
        </p>
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {questions.map((q, i) => {
            const live = words.find((w) => w.id === q.id);
            return (
              <li
                key={q.id}
                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[auto_1fr_auto]"
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full",
                    results[i] ? "bg-tag-green/20 text-tag-green" : "bg-tag-rose/20 text-tag-rose"
                  )}
                  aria-label={results[i] ? "覚えてた" : "覚えてなかった"}
                >
                  {results[i] ? <Check weight="bold" className="size-3.5" /> : <X weight="bold" className="size-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium break-words">{q.term}</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {q.meanings.map((m) => m.text).join(" ／ ") || "意味が未登録です"}
                  </p>
                </div>
                <div className="col-start-2 sm:col-start-auto">
                {live ? (
                  <CategoryPicker
                    size="sm"
                    value={live.category}
                    onChange={(c) => wordStore.setCategory(q.id, c)}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">削除済み</span>
                )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" size="lg" className="h-11" onClick={onBack}>
          設定に戻る
        </Button>
        <Button size="lg" className="h-11" onClick={onRetry}>
          同じ条件でもう一度
        </Button>
      </div>
    </div>
  );
}
