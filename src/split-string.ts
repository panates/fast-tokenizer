import { tokenize } from './tokenize.js';
import type { TokenizerOptions } from './types.js';

/**
 * Convenience wrapper around {@link tokenize} for splitting a whole string
 * into an array of tokens in one call.
 *
 * Defaults `delimiters` to `','` (overridable via `options.delimiters`) and
 * always tokenizes with `emptyTokens: true` internally, so leading, trailing,
 * or consecutive delimiters produce `''` entries instead of being skipped —
 * this is why `emptyTokens` is omitted from its options type. All other
 * {@link TokenizerOptions} are forwarded as-is.
 *
 * @param input - The string to split.
 * @param options - Same as {@link TokenizerOptions}, minus `emptyTokens`.
 * @returns All tokens as a string array.
 *
 * @example
 * ```ts
 * splitString('a,b,,c');
 * // → ['a', 'b', '', 'c']
 *
 * splitString('a,"b,c",d', { quotes: ['"'], keepQuotes: false });
 * // → ['a', 'b,c', 'd']
 * ```
 */
export function splitString(
  input: string,
  options?: Omit<TokenizerOptions, 'emptyTokens'>,
): string[] {
  const out: string[] = [];
  const tokenizer = tokenize(input, {
    delimiters: ',',
    ...options,
    emptyTokens: true,
  });
  for (const x of tokenizer) {
    out.push(x || '');
  }
  return out;
}
