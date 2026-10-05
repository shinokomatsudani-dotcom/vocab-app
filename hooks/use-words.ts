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

export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function noopSubscribe() {
  return () => {};
}
