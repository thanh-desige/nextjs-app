// ============================================================
// useRouteSync — Syncs React state with browser URL
// Uses window.history.pushState (Next.js 15 compatible)
// Handles: initial URL parse, navigation, browser back/forward
// ============================================================

'use client';
import { useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import {
  getModuleByPage,
  getModuleBySlug,
  getTabBySlug,
  getTabByKey,
  buildPath,
  parsePath,
} from './routeConfig';

interface RouteState {
  page: number;
  tab: string | null;
}

function parseUrl(): RouteState {
  if (typeof window === 'undefined') return { page: 0, tab: null };

  const { moduleSlug, tabSlug } = parsePath(window.location.pathname);
  if (!moduleSlug) return { page: 0, tab: null };

  const mod = getModuleBySlug(moduleSlug);
  if (!mod) return { page: 0, tab: null };

  let tab: string | null = null;
  if (tabSlug && mod.tabs) {
    const tabConfig = getTabBySlug(mod, tabSlug);
    if (tabConfig) tab = tabConfig.key;
  }
  if (!tab && mod.defaultTab) tab = mod.defaultTab;

  return { page: mod.page, tab };
}

let currentSnapshot: RouteState = { page: 0, tab: null };
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): RouteState {
  return currentSnapshot;
}

const SERVER_SNAPSHOT: RouteState = { page: 0, tab: null };

function getServerSnapshot(): RouteState {
  return SERVER_SNAPSHOT;
}

function updateSnapshot() {
  currentSnapshot = parseUrl();
  listeners.forEach((cb) => cb());
}

export function useRouteSync() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const stateRef = useRef(state);

  // Sync ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // On mount: parse URL, normalize, and notify
  useEffect(() => {
    updateSnapshot();

    const { page, tab } = currentSnapshot;
    if (page === 0) return;

    const mod = getModuleByPage(page);
    if (!mod) return;

    if (mod.tabs && tab) {
      const tabConfig = getTabByKey(mod, tab);
      const expectedPath = buildPath(mod.slug, tabConfig?.slug);
      if (window.location.pathname !== expectedPath) {
        window.history.replaceState({}, '', expectedPath);
      }
    } else if (!mod.tabs) {
      const expectedPath = buildPath(mod.slug);
      if (window.location.pathname !== expectedPath) {
        window.history.replaceState({}, '', expectedPath);
      }
    }
  }, []);

  // Browser back/forward
  useEffect(() => {
    const handlePopState = () => updateSnapshot();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPage = useCallback((page: number, initialTab?: string) => {
    const mod = getModuleByPage(page);
    if (!mod) return;

    const tab = initialTab ?? mod.defaultTab ?? null;
    let tabSlug: string | undefined;
    if (tab && mod.tabs) {
      tabSlug = getTabByKey(mod, tab)?.slug;
    }

    window.history.pushState({}, '', buildPath(mod.slug, tabSlug));
    currentSnapshot = { page, tab };
    listeners.forEach((cb) => cb());
  }, []);

  const navigateToTab = useCallback((tabKey: string) => {
    const mod = getModuleByPage(stateRef.current.page);
    if (!mod?.tabs) return;

    const tabConfig = getTabByKey(mod, tabKey);
    if (!tabConfig) return;

    window.history.pushState({}, '', buildPath(mod.slug, tabConfig.slug));
    currentSnapshot = { ...currentSnapshot, tab: tabKey };
    listeners.forEach((cb) => cb());
  }, []);

  const navigateToHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    currentSnapshot = { page: 0, tab: null };
    listeners.forEach((cb) => cb());
  }, []);

  return {
    page: state.page,
    tab: state.tab,
    isInDashboard: state.page > 0,
    navigateToPage,
    navigateToTab,
    navigateToHome,
  };
}
