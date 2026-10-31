import type { JournalFacts } from './learning';

/**
 * Ask the local server to have Claude write the learning log. Resolves to null when no
 * credentials are configured, the request fails, or it takes too long — the caller keeps the template.
 */
export async function requestClaudeJournal(facts: JournalFacts, timeoutMs = 60_000): Promise<string[] | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('/api/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(facts), signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json() as { paragraphs?: unknown };
    return Array.isArray(data.paragraphs) && data.paragraphs.every(p => typeof p === 'string') ? data.paragraphs as string[] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
