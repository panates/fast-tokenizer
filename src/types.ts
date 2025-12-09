export type TokenCallback = (
  current: string,
  index: number,
  input: string,
) => boolean;

export interface TokenizerOptions {
  delimiters?: string | RegExp;
  brackets?: boolean | Record<string, string>;
  quotes?: boolean | string[];
  escape?: string | RegExp | TokenCallback | false;
  keepDelimiters?: boolean | TokenCallback;
  keepQuotes?: boolean | TokenCallback;
  keepBrackets?: boolean | TokenCallback;
  emptyTokens?: boolean;
}

export interface Tokenizer {
  readonly input: string;
  readonly startIndex: number;
  readonly curIndex: number;
  readonly current: string;

  reset(): void;

  next(): string | null;

  all(): string[];

  join(separator?: string): string;

  [Symbol.iterator](): IterableIterator<string>;
}
