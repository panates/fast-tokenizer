/**
 * A per-character decision callback used by several {@link TokenizerOptions}
 * (`escape`, `keepDelimiters`, `keepQuotes`, `keepBrackets`) to control tokenizer
 * behavior on a case-by-case basis instead of with a single fixed setting.
 *
 * @param current - The matched character, or the matched quote/bracket string.
 * @param index - The index of `current` within `input`.
 * @param input - The full input string being tokenized.
 * @returns Whether the rule applies to `current` at `index`.
 */
export type TokenCallback = (
  current: string,
  index: number,
  input: string,
) => boolean;

/**
 * Options controlling how {@link tokenize} splits its input.
 */
export interface TokenizerOptions {
  /**
   * Characters that split tokens.
   *
   * A `string` is treated as a set of individual delimiter characters
   * (`delimiters.includes(char)`); a `RegExp` is tested one character at a time
   * (`delimiters.test(char)`). Global/sticky flags on a `RegExp` are stripped
   * internally so `RegExp.lastIndex` state can't corrupt consecutive matches.
   *
   * @default tokenize.DEFAULT_DELIMITERS (`/\W/`, any non-word character)
   */
  delimiters?: string | RegExp;

  /**
   * Enables bracket-aware tokenization. Content between a matched bracket
   * pair — including nested pairs and delimiter characters — becomes part of a
   * single token. Brackets are not interpreted while inside a quoted string.
   *
   * `true` uses the built-in pairs ({@link tokenize.DEFAULT_BRACKETS},
   * `{ '[': ']', '(': ')' }`). Pass an object to define custom (and
   * multi-character) open/close pairs, e.g. `{ '$(': ')$' }`.
   *
   * @default undefined (disabled)
   */
  brackets?: boolean | Record<string, string>;

  /**
   * Enables quote-aware tokenization. Content between a matching pair of quote
   * characters is kept together as one token, including delimiter, bracket,
   * and (by default) escape characters. Only the quote character that matches
   * the one currently open can close it — a different quote character
   * encountered inside an open quote is treated as literal content.
   *
   * `true` uses the built-in quote characters ({@link tokenize.DEFAULT_QUOTES},
   * `['"', "'", '`']`). Pass an array to use custom quote strings.
   *
   * @default undefined (disabled)
   */
  quotes?: boolean | string[];

  /**
   * Controls character escaping. When the rule matches a character, the
   * *next* character is copied into the token verbatim and both are
   * consumed. Escaping takes precedence over quote and bracket handling, so
   * it can be used to escape a quote character from within a quoted string.
   *
   * - A `string` (single character) or `RegExp` matches the escape character
   *   itself.
   * - A {@link TokenCallback} receives `(char, index, input)` and returns
   *   whether `char` starts an escape sequence.
   * - `false` or `''` disables escaping entirely.
   *
   * @default '\\' (backslash)
   */
  escape?: string | RegExp | TokenCallback | false;

  /**
   * Whether the delimiter character is kept, prepended to the *next* token,
   * instead of being discarded. Pass a {@link TokenCallback} to decide
   * per-delimiter.
   *
   * @default undefined (discarded)
   */
  keepDelimiters?: boolean | TokenCallback;

  /**
   * Whether the surrounding quote characters are included in the token. Pass
   * a {@link TokenCallback} to decide per-quote-character.
   *
   * Unlike {@link TokenizerOptions.keepDelimiters}, omitting this option
   * keeps the quotes rather than discarding them.
   *
   * @default undefined (kept)
   */
  keepQuotes?: boolean | TokenCallback;

  /**
   * Whether the outermost bracket characters are included in the token.
   * Nested (non-outermost) bracket characters are always kept regardless of
   * this setting. Pass a {@link TokenCallback} to decide per-bracket-character.
   *
   * Unlike {@link TokenizerOptions.keepDelimiters}, omitting this option
   * keeps the brackets rather than discarding them.
   *
   * @default undefined (kept)
   */
  keepBrackets?: boolean | TokenCallback;

  /**
   * When `true`, {@link Tokenizer.next} returns `''` for consecutive
   * delimiters or a leading/trailing delimiter instead of skipping over them.
   *
   * @default false
   */
  emptyTokens?: boolean;
}

/**
 * A lazy, stateful cursor over a string, produced by {@link tokenize}. Tokens
 * are produced on demand by {@link Tokenizer.next} (directly, via iteration,
 * or via {@link Tokenizer.all} / {@link Tokenizer.join}) — nothing is scanned
 * until then.
 *
 * A `Tokenizer` is single-pass: it holds one cursor position, so iterating it
 * more than once without calling {@link Tokenizer.reset} in between only
 * yields the tokens remaining from where the previous pass left off.
 */
export interface Tokenizer {
  /** The original input string being tokenized (coerced to a string). */
  readonly input: string;

  /** Index in {@link Tokenizer.input} where the current token started. */
  readonly startIndex: number;

  /**
   * Index in {@link Tokenizer.input} of the last character consumed while
   * producing the current token.
   */
  readonly curIndex: number;

  /** The last token returned by {@link Tokenizer.next} (`''` before the first call). */
  readonly current: string;

  /**
   * Rewinds the cursor to the beginning of the input, discarding all internal
   * state (bracket stack, open quote, pending token).
   */
  reset(): void;

  /**
   * Advances to and returns the next token.
   *
   * @returns The next token, or `null` once the input is exhausted. With
   *   `emptyTokens: true`, `''` can be returned for an empty token — `null`
   *   is only returned once there are no more characters left to consume.
   * @throws {SyntaxError} If a closing bracket doesn't match the most
   *   recently opened one, or the input ends with an unclosed bracket.
   */
  next(): string | null;

  /** Drains the remaining tokens into an array. */
  all(): string[];

  /**
   * Drains the remaining tokens and joins them into a single string.
   *
   * @param separator - Placed between tokens. Defaults to `''`.
   */
  join(separator?: string): string;

  /**
   * Makes the tokenizer usable with `for...of` and spread syntax. The
   * returned iterator is a thin wrapper around this tokenizer's own cursor,
   * not an independent, restartable one.
   */
  [Symbol.iterator](): IterableIterator<string>;
}
