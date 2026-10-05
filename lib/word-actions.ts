"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIES, type Word } from "@/lib/types";

async function requireSession() {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get(AUTH_COOKIE)?.value)) {
    throw new Error("Unauthorized");
  }
}

type Row = {
  id: string;
  term: string;
  meanings: Word["meanings"];
  category: Word["category"];
  created_at: Date;
  updated_at: Date;
};

function toWord(row: Row): Word {
  return {
    id: row.id,
    term: row.term,
    meanings: row.meanings,
    category: row.category,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function validate(word: Word) {
  if (typeof word.id !== "string" || !word.id) throw new Error("Invalid id");
  if (typeof word.term !== "string" || !word.term.trim()) throw new Error("Invalid term");
  if (!CATEGORIES.includes(word.category)) throw new Error("Invalid category");
  if (
    !Array.isArray(word.meanings) ||
    !word.meanings.every((m) => typeof m.id === "string" && typeof m.text === "string")
  ) {
    throw new Error("Invalid meanings");
  }
}

export async function listWordsAction(): Promise<Word[]> {
  await requireSession();
  const pool = await db();
  const { rows } = await pool.query<Row>("SELECT * FROM words ORDER BY created_at DESC");
  return rows.map(toWord);
}

/** 単語を追加・更新する（同じ id があれば上書き） */
export async function saveWordsAction(words: Word[]): Promise<void> {
  await requireSession();
  words.forEach(validate);
  const pool = await db();
  for (const word of words) {
    await pool.query(
      `INSERT INTO words (id, term, meanings, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         term = EXCLUDED.term,
         meanings = EXCLUDED.meanings,
         category = EXCLUDED.category,
         updated_at = EXCLUDED.updated_at`,
      [
        word.id,
        word.term.trim(),
        JSON.stringify(word.meanings),
        word.category,
        word.createdAt,
        word.updatedAt,
      ]
    );
  }
}

export async function deleteWordAction(id: string): Promise<void> {
  await requireSession();
  const pool = await db();
  await pool.query("DELETE FROM words WHERE id = $1", [id]);
}
