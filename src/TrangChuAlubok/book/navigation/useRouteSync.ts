// ============================================================
// useRouteSync — Syncs React state with browser URL
// Uses window.history.pushState (Next.js 15 compatible)
// Handles: initial URL parse, navigation, browser back/forward
// ============================================================

'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useRouteSync() {
  const [state, setState] = useState<RouteState>(parseUrl);
  const stateRef = useRef(state);

  // Sync ref in effect (not during render)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // On mount: normalize URL (add default tab slug if missing)
  useEffect(() => {
    const { page, tab } = stateRef.current;
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
    const handlePopState = () => setState(parseUrl());
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
    setState({ page, tab });
  }, []);

  const navigateToTab = useCallback((tabKey: string) => {
    const mod = getModuleByPage(stateRef.current.page);
    if (!mod?.tabs) return;

    const tabConfig = getTabByKey(mod, tabKey);
    if (!tabConfig) return;

    window.history.pushState({}, '', buildPath(mod.slug, tabConfig.slug));
    setState(prev => ({ ...prev, tab: tabKey }));
  }, []);

  const navigateToHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    setState({ page: 0, tab: null });
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
