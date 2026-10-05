import type { Category, Meaning, Word } from "@/lib/types";

const STORAGE_KEY = "vocab-app:words";

type Listener = () => void;

let words: Word[] = [];
let hydrated = false;
const listeners = new Set<Listener>();
const EMPTY: Word[] = [];

function readFromStorage(): Word[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Word[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {
    // ストレージが使えない環境ではメモリ上だけで動かす
  }
}

function commit(next: Word[]) {
  words = next;
  persist();
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  words = readFromStorage();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Word[] {
  ensureHydrated();
  return words;
}

export function getServerSnapshot(): Word[] {
  return EMPTY;
}

export function newMeaning(text: string): Meaning {
  return { id: crypto.randomUUID(), text };
}

export function addWord(term: string, meaningText: string): Word {
  ensureHydrated();
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
  return word;
}

export function updateWord(
  id: string,
  patch: Partial<Pick<Word, "term" | "meanings" | "category">>
) {
  ensureHydrated();
  commit(
    words.map((word) =>
      word.id === id
        ? { ...word, ...patch, updatedAt: new Date().toISOString() }
        : word
    )
  );
}

export function setCategory(id: string, category: Category) {
  updateWord(id, { category });
}

export function deleteWord(id: string) {
  ensureHydrated();
  commit(words.filter((word) => word.id !== id));
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
  ensureHydrated();
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
}
