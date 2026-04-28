'use client';

import { useEffect, useState } from 'react';

/**
 * Push-notifications platform support detection (#356).
 *
 * iOS Safari требует PWA-режима (display-mode: standalone) для Web Push API.
 * Без него `Notification.requestPermission()` либо вернёт `denied`, либо
 * не покажет prompt вообще. Источник: Apple WebKit blog (iOS 16.4+).
 *
 * Возвращаемые состояния:
 * - 'unsupported' — браузер вообще не поддерживает Service Worker / Push
 *                  (старые Safari iOS < 16.4, IE и т.п.)
 * - 'ios-needs-install' — iOS Safari, но НЕ открыто как PWA. Нужна инструкция
 *                         «Добавить на главный экран».
 * - 'permission-denied' — пользователь отказал в разрешении ранее. Изменить
 *                         можно только в настройках устройства/браузера.
 * - 'permission-granted' — уже подписан, можно сразу слать push'и
 * - 'ready' — можно вызывать `Notification.requestPermission()` (Android,
 *             desktop, iOS-PWA в standalone-режиме).
 *
 * SSR-safe: на сервере (typeof window === 'undefined') возвращает 'loading'
 * до hydrate'а, чтобы избежать hydration mismatch.
 */
export type PushSupportState =
  | 'loading'
  | 'unsupported'
  | 'ios-needs-install'
  | 'permission-denied'
  | 'permission-granted'
  | 'ready';

export interface PushSupport {
  state: PushSupportState;
  /** true для iPhone/iPad (нужно для отображения скриншотов с share-иконкой) */
  isIOS: boolean;
  /** true если страница открыта в standalone (PWA) режиме */
  isStandalone: boolean;
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  // userAgent проверка по 4 платформам — стандартный sniff. iPadOS 13+
  // маскируется под Mac, поэтому проверяем maxTouchPoints отдельно.
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPad на iPadOS 13+ → 'MacIntel' с touch-screen.
  if (
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari исторически использует navigator.standalone (не CSS media).
  // Тип кастуем — стандартного типа в lib.dom нет.
  const navWithStandalone = navigator as Navigator & { standalone?: boolean };
  return navWithStandalone.standalone === true;
}

export function usePushSupport(): PushSupport {
  const [state, setState] = useState<PushSupport>({
    state: 'loading',
    isIOS: false,
    isStandalone: false,
  });

  useEffect(() => {
    const isIOS = detectIOS();
    const isStandalone = detectStandalone();

    const supportsServiceWorker = 'serviceWorker' in navigator;
    const supportsPushManager = 'PushManager' in window;
    const supportsNotification = 'Notification' in window;

    if (!supportsServiceWorker || !supportsPushManager || !supportsNotification) {
      setState({ state: 'unsupported', isIOS, isStandalone });
      return;
    }

    // iOS Safari в обычном режиме — Web Push не работает.
    // Apple требует установки в PWA-режим. Показываем инструкцию.
    if (isIOS && !isStandalone) {
      setState({ state: 'ios-needs-install', isIOS, isStandalone });
      return;
    }

    // Всё поддерживается — определяем текущий permission.
    const permission = Notification.permission;
    if (permission === 'denied') {
      setState({ state: 'permission-denied', isIOS, isStandalone });
      return;
    }
    if (permission === 'granted') {
      setState({ state: 'permission-granted', isIOS, isStandalone });
      return;
    }

    // 'default' — ещё не спрашивали.
    setState({ state: 'ready', isIOS, isStandalone });
  }, []);

  return state;
}
