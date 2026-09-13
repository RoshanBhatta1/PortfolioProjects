/**
 * Validates ANTHROPIC_API_KEY before it reaches the SDK. A key with a
 * non-ASCII character (a smart quote, em-dash, or bullet introduced by an
 * editor's autocorrect or a copy/paste from a rich-text source) makes the
 * underlying fetch() throw a cryptic "Cannot convert argument to a
 * ByteString" error deep inside the HTTP layer, with no indication the key
 * itself is the problem. Catch it here instead, pointing at the exact
 * character and position.
 */
export function getValidatedApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI features.");
  }

  const trimmed = key.trim();
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code > 126) {
      throw new Error(
        `ANTHROPIC_API_KEY contains an invalid character at position ${i} ` +
          `(code ${code}, "${trimmed[i]}"). This usually happens when an editor's ` +
          `autocorrect or a copy/paste from a rich-text source swaps in a smart quote, ` +
          `em-dash, or bullet. Delete the ANTHROPIC_API_KEY line in .env.local and re-add it ` +
          `via the terminal, e.g.: echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local`
      );
    }
  }

  return trimmed;
}
