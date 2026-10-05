import { toast } from "sonner";
import { deleteWordAction, listWordsAction, saveWordsAction } from "@/lib/word-actions";
import type { Category, Meaning, Word } from "@/lib/types";

// 画面は手元の状態を即座に書き換え（楽観的更新）、裏で DB に保存する。
// 保存に失敗したら DB から読み直して手元の状態を正に戻す。

type Listener = () => void;

let words: Word[] = [];
let status: "idle" | "loading" | "ready" | "error" = "idle";
const listeners = new Set<Listener>();
const EMPTY: Word[] = [];

function notify() {
  listeners.forEach((listener) => listener());
}

function commit(next: Word[]) {
  words = next;
  notify();
}

async function load() {
  status = "loading";
  try {
    words = await listWordsAction();
    status = "ready";
  } catch {
    status = "error";
    toast.error("単語を読み込めませんでした");
  }
  notify();
}

function sync(task: Promise<unknown>) {
  task.catch(() => {
    toast.error("保存に失敗しました。最新の状態を読み込み直します");
    void load();
  });
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  if (status === "idle" && typeof window !== "undefined") void load();
  return () => listeners.delete(listener);
}

export function getSnapshot(): Word[] {
  return words;
}

export function getServerSnapshot(): Word[] {
  return EMPTY;
}

export function getLoaded(): boolean {
  return status === "ready";
}

export function getServerLoaded(): boolean {
  return false;
}

export function newMeaning(text: string): Meaning {
  return { id: crypto.randomUUID(), text };
}

export function addWord(term: string, meaningText: string): Word {
  const now = new Date().toISOString();
  const word: Word = {
    id: crypto.randomUUID(),
    term: term.trim(),
    meanings: meaningText.trim() ? [newMeaning(meaningText.trim())] : [],
    category: "learning",
    createdAt: now,
    updatedAt: now,
  };
  commit([word, ...words]);
  sync(saveWordsAction([word]));
  return word;
}

export function updateWord(
  id: string,
  patch: Partial<Pick<Word, "term" | "meanings" | "category">>
) {
  const current = words.find((word) => word.id === id);
  if (!current) return;
  const updated: Word = { ...current, ...patch, updatedAt: new Date().toISOString() };
  commit(words.map((word) => (word.id === id ? updated : word)));
  sync(saveWordsAction([updated]));
}

export function setCategory(id: string, category: Category) {
  updateWord(id, { category });
}

export function deleteWord(id: string) {
  commit(words.filter((word) => word.id !== id));
  sync(deleteWordAction(id));
}

const SAMPLE: [string, string[], Category][] = [
  ["abandon", ["見捨てる", "（計画などを）断念する"], "mastered"],
  ["benefit", ["利益", "恩恵を受ける"], "mastered"],
  ["consider", ["よく考える", "〜とみなす"], "mastered"],
  ["deliberate", ["故意の", "慎重な"], "almost"],
  ["eventually", ["結局は", "最終的に"], "almost"],
  ["inevitable", ["避けられない"], "almost"],
  ["subsequent", ["その後の"], "almost"],
  ["ubiquitous", ["どこにでもある"], "learning"],
  ["meticulous", ["細心の注意を払った"], "learning"],
  ["ambiguous", ["曖昧な", "多義的な"], "learning"],
  ["scrutinize", ["精査する"], "learning"],
  ["reluctant", ["気が進まない"], "learning"],
  ["alleviate", [], "learning"],
];

export function addSampleWords() {
  const now = Date.now();
  const samples: Word[] = SAMPLE.map(([term, meanings, category], i) => {
    const at = new Date(now - i * 1000).toISOString();
    return {
      id: crypto.randomUUID(),
      term,
      meanings: meanings.map(newMeaning),
      category,
      createdAt: at,
      updatedAt: at,
    };
  });
  commit([...samples, ...words]);
  sync(saveWordsAction(samples));
}
