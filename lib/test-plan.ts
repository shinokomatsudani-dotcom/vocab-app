import { CATEGORIES, type Category, type Word } from "@/lib/types";

export type Ratios = Record<Category, number>;

export const EMPTY_COUNTS: Record<Category, number> = {
  mastered: 0,
  almost: 0,
  learning: 0,
};

/** 合計 total 問を ratios（%）の比で各カテゴリーに割り振る（最大剰余法） */
export function allocate(total: number, ratios: Ratios): Record<Category, number> {
  const sum = CATEGORIES.reduce((acc, c) => acc + ratios[c], 0);
  if (sum <= 0 || total <= 0) return { ...EMPTY_COUNTS };

  const exact = CATEGORIES.map((c) => ({ c, value: (total * ratios[c]) / sum }));
  const result = { ...EMPTY_COUNTS };
  for (const { c, value } of exact) result[c] = Math.floor(value);

  let rest = total - CATEGORIES.reduce((acc, c) => acc + result[c], 0);
  const byRemainder = exact
    .filter(({ c }) => ratios[c] > 0)
    .sort((a, b) => (b.value % 1) - (a.value % 1));
  for (const { c } of byRemainder) {
    if (rest <= 0) break;
    result[c] += 1;
    rest -= 1;
  }
  return result;
}

export function countByCategory(words: Word[]): Record<Category, number> {
  const counts = { ...EMPTY_COUNTS };
  for (const word of words) counts[word.category] += 1;
  return counts;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** カテゴリーごとの出題数に従ってランダムに単語を選び、全体をシャッフルして返す */
export function pickQuestions(
  words: Word[],
  perCategory: Record<Category, number>
): Word[] {
  const picked = CATEGORIES.flatMap((c) =>
    shuffle(words.filter((w) => w.category === c)).slice(0, perCategory[c])
  );
  return shuffle(picked);
}
