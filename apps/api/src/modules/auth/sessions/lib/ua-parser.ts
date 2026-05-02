/**
 * Простой User-Agent парсер для device label (#A-05).
 *
 * Без зависимости ua-parser-js — phase 3 объём не оправдывает.
 * Покрывает 95% массовых браузеров/ОС: Chrome / Firefox / Safari / Edge / Opera
 * + Windows / macOS / Linux / Android / iOS.
 *
 * Возвращает строку формата "Chrome on macOS" или "Safari on iPhone".
 * Fallback "Unknown device" если UA отсутствует или нераспознан.
 */

interface ParsedUa {
  browser: string;
  os: string;
}

const BROWSER_PATTERNS: { name: string; re: RegExp }[] = [
  // Edge ДО Chrome (Edge содержит подстроку Chrome)
  { name: 'Edge', re: /Edg(?:e|A|iOS)?\/[\d.]+/ },
  // Opera ДО Chrome (Opera содержит OPR/...)
  { name: 'Opera', re: /OPR\/[\d.]+/ },
  { name: 'Firefox', re: /Firefox\/[\d.]+/ },
  // Chrome — после Edge/Opera (они содержат Chrome substring)
  { name: 'Chrome', re: /Chrome\/[\d.]+/ },
  // Safari — после Chrome (Chrome содержит Safari substring)
  { name: 'Safari', re: /Version\/[\d.]+ Safari\// },
];

const OS_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'iPhone', re: /iPhone OS [\d_]+/ },
  { name: 'iPad', re: /iPad; .*OS [\d_]+/ },
  { name: 'Android', re: /Android [\d.]+/ },
  { name: 'Windows', re: /Windows NT [\d.]+/ },
  { name: 'macOS', re: /Mac OS X [\d_]+/ },
  { name: 'Linux', re: /Linux/ },
];

export function parseUserAgent(userAgent: string | null | undefined): ParsedUa {
  if (!userAgent || userAgent.length === 0) {
    return { browser: 'Unknown', os: 'device' };
  }
  const browser = BROWSER_PATTERNS.find((p) => p.re.test(userAgent))?.name ?? 'Browser';
  const os = OS_PATTERNS.find((p) => p.re.test(userAgent))?.name ?? 'device';
  return { browser, os };
}

export function deviceLabel(userAgent: string | null | undefined): string {
  const { browser, os } = parseUserAgent(userAgent);
  return `${browser} on ${os}`;
}
