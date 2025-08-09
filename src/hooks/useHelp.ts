import { useCallback, useEffect, useState } from 'react';

const GLOBAL_KEY = 'help.globalEnabled';
const PAGE_KEY_PREFIX = 'help.page.';

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null || v === undefined) return fallback;
    return v === 'true';
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {}
}

export function useGlobalHelp() {
  const [globalEnabled, setGlobalEnabledState] = useState<boolean>(() => readBool(GLOBAL_KEY, true));

  useEffect(() => {
    writeBool(GLOBAL_KEY, globalEnabled);
  }, [globalEnabled]);

  const setGlobalEnabled = useCallback((v: boolean) => setGlobalEnabledState(v), []);
  const toggleGlobal = useCallback(() => setGlobalEnabledState((v) => !v), []);

  return { globalEnabled, setGlobalEnabled, toggleGlobal } as const;
}

export function useHelp(pageKey: string) {
  const { globalEnabled, setGlobalEnabled } = useGlobalHelp();
  const storageKey = `${PAGE_KEY_PREFIX}${pageKey}`;

  const [pageEnabled, setPageEnabledState] = useState<boolean>(() => readBool(storageKey, true));

  useEffect(() => {
    writeBool(storageKey, pageEnabled);
  }, [storageKey, pageEnabled]);

  const setPageEnabled = useCallback((v: boolean) => setPageEnabledState(v), []);
  const hideForPage = useCallback(() => setPageEnabledState(false), []);
  const showForPage = useCallback(() => setPageEnabledState(true), []);

  const showHelp = globalEnabled && pageEnabled;

  return {
    showHelp,
    pageEnabled,
    setPageEnabled,
    hideForPage,
    showForPage,
    globalEnabled,
    setGlobalEnabled,
  } as const;
}
