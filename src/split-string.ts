import { tokenize } from './tokenize.js';
import { TokenizerOptions } from './types.js';

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
