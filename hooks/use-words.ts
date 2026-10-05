"use client";

import { useSyncExternalStore } from "react";
import * as wordStore from "@/lib/word-store";

export function useWords() {
  return useSyncExternalStore(
    wordStore.subscribe,
    wordStore.getSnapshot,
    wordStore.getServerSnapshot
  );
}

/** DB からの初回読み込みが終わったか */
export function useWordsLoaded() {
  return useSyncExternalStore(
    wordStore.subscribe,
    wordStore.getLoaded,
    wordStore.getServerLoaded
  );
}
