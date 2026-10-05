"use client";

import { useState } from "react";
import { Plus, Trash, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { CategoryPicker } from "@/components/category-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABEL, type Word } from "@/lib/types";
import * as wordStore from "@/lib/word-store";

export function WordEditorDialog({
  word,
  onClose,
}: {
  word: Word | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={word !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {word && <WordEditorForm key={word.id} word={word} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function WordEditorForm({ word, onClose }: { word: Word; onClose: () => void }) {
  const [term, setTerm] = useState(word.term);
  const [meanings, setMeanings] = useState(word.meanings);
  const [newMeaning, setNewMeaning] = useState("");
  const [category, setCategory] = useState(word.category);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function addMeaning() {
    const text = newMeaning.trim();
    if (!text) return;
    setMeanings((prev) => [...prev, wordStore.newMeaning(text)]);
    setNewMeaning("");
  }

  function save() {
    if (!term.trim()) {
      toast.error("単語を入力してください");
      return;
    }
    // 入力途中の意味も取りこぼさない
    const pending = newMeaning.trim() ? [wordStore.newMeaning(newMeaning.trim())] : [];
    wordStore.updateWord(word.id, {
      term: term.trim(),
      meanings: [...meanings, ...pending]
        .map((m) => ({ ...m, text: m.text.trim() }))
        .filter((m) => m.text),
      category,
    });
    toast.success("保存しました");
    onClose();
  }

  function remove() {
    wordStore.deleteWord(word.id);
    toast.success(`「${word.term}」を削除しました`);
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>単語を編集</DialogTitle>
      </DialogHeader>

      <div className="grid gap-5">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">単語</span>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} className="text-base" />
        </label>

        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            意味 <span className="font-normal">（あとからいくつでも追加できます）</span>
          </span>
          {meanings.length === 0 && (
            <p className="text-sm text-muted-foreground">まだ意味が登録されていません</p>
          )}
          <ol className="grid gap-1.5">
            {meanings.map((meaning, index) => (
              <li key={meaning.id} className="flex items-center gap-2">
                <span className="w-5 text-right text-xs text-muted-foreground tabular-nums">
                  {index + 1}.
                </span>
                <Input
                  value={meaning.text}
                  aria-label={`意味 ${index + 1}`}
                  onChange={(e) =>
                    setMeanings((prev) =>
                      prev.map((m) => (m.id === meaning.id ? { ...m, text: e.target.value } : m))
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`意味 ${index + 1} を削除`}
                  onClick={() => setMeanings((prev) => prev.filter((m) => m.id !== meaning.id))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2">
            <span className="w-5" />
            <Input
              value={newMeaning}
              placeholder="意味を追加"
              onChange={(e) => setNewMeaning(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addMeaning();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="意味を追加"
              disabled={!newMeaning.trim()}
              onClick={addMeaning}
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">覚え具合</span>
          <div>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>
          <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[category]}</p>
        </div>
      </div>

      <DialogFooter className="sm:justify-between">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">本当に削除しますか？</span>
            <Button variant="destructive" size="sm" onClick={remove}>
              削除する
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              やめる
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash />
            削除
          </Button>
        )}
        <div className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={save}>保存</Button>
        </div>
      </DialogFooter>
    </>
  );
}
