import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { ItemDraftSnapshot } from "./photo-draft";
import { photoDraftRepository } from "./photo-draft-storage";
import { readDraftPhotos } from "./photo-draft-runtime";

export function useItemDraft(onRead?: (snapshot: ItemDraftSnapshot) => void) {
  const [snapshot, setSnapshot] = useState<ItemDraftSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const readVersion = useRef(0);
  const reload = useCallback(() => {
    const started = ++readVersion.current;
    setSnapshot(null);
    setFailed(false);
    void readDraftPhotos()
      .then(async () => (await photoDraftRepository()).snapshot())
      .then((value) => {
        if (started === readVersion.current) {
          onRead?.(value);
          setSnapshot(value);
        }
      })
      .catch(() => {
        if (started === readVersion.current) setFailed(true);
      });
  }, [onRead]);
  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        readVersion.current += 1;
      };
    }, [reload]),
  );
  return {
    snapshot,
    setSnapshot,
    failed,
    reload,
  };
}
