export type Category = "learning" | "almost" | "mastered";

export type Meaning = {
  id: string;
  text: string;
};

export type Word = {
  id: string;
  term: string;
  meanings: Meaning[];
  category: Category;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORIES: Category[] = ["mastered", "almost", "learning"];

export const CATEGORY_LABEL: Record<Category, string> = {
  mastered: "マスターした",
  almost: "あと一息で覚えられそう",
  learning: "まだまだ覚えるまでにかかりそう",
};

export const CATEGORY_SHORT_LABEL: Record<Category, string> = {
  mastered: "マスター",
  almost: "あと一息",
  learning: "まだまだ",
};

export const CATEGORY_DOT_CLASS: Record<Category, string> = {
  mastered: "bg-tag-green",
  almost: "bg-tag-amber",
  learning: "bg-tag-rose",
};
