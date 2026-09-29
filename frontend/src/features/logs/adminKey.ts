// The admin key (API_SEGRETO) for archiving and deleting logs. It is typed in by the user
// when the server first refuses, and kept for this tab only, never in the bundle: a key
// shipped in browser code isn't secret. It's defense in depth; the real protection is
// the loopback binding and the Origin checks. Storage can be unavailable (private mode,
// blocked site data), so every access is guarded and the key simply isn't remembered.
const STORAGE_KEY = 'pc-monitor-admin-key';

export function getAdminKey(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminKey(key: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Not remembered: the next change asks again.
  }
}

export function clearAdminKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Headers for an admin-guarded request, or none when no key was given yet. */
export function adminHeaders(): Record<string, string> | undefined {
  const key = getAdminKey();
  return key ? { 'x-api-key': key } : undefined;
}
