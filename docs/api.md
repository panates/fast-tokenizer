<!-- docs-baseline
git-commit: b0214ed93afdef45af2373b7e7ce51bb9b1c306d
package-version: 1.9.0
date: 2026-09-10
Verify with: git diff b0214ed93afdef45af2373b7e7ce51bb9b1c306d..HEAD -- src/
-->

# fast-tokenizer API Documentation

A fast, dependency-free tokenizer/lexer for JavaScript and TypeScript. It splits a string into
tokens using configurable delimiters, with optional support for quoted strings, bracket
nesting, and character escaping.

- [Installation](#installation)
- [`tokenize(input, options)`](#tokenizeinput-options)
  - [Options](#options)
  - [Processing order](#processing-order)
  - [`Tokenizer` interface](#tokenizer-interface)
  - [Static defaults](#static-defaults)
  - [Errors](#errors)
- [`splitString(input, options)`](#splitstringinput-options)
- [Types](#types)
- [Recipes](#recipes)

## Installation

```bash
npm install fast-tokenizer --save
```

The package is ESM-only (`"type": "module"`) and requires Node.js >= 20.

```ts
import { tokenize, splitString } from 'fast-tokenizer';
```

## `tokenize(input, options)`

```ts
function tokenize(input: string, options?: TokenizerOptions): Tokenizer;
```

Creates a lazy, stateful `Tokenizer` cursor over `input`. No work is done until you call
`.next()`, iterate the tokenizer (`for...of`), or call `.all()` / `.join()`. `input` is coerced
to a string (`'' + input`); a falsy `input` (e.g. `undefined`, `null`, `''`) is treated as `''`.

### Options

All options are optional. Defaults are shown below.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `delimiters` | `string \| RegExp` | `/\W/` (any non-word character) | Characters that split tokens. A `string` is treated as a set of individual delimiter characters (`delimiters.includes(c)`); a `RegExp` is tested one character at a time (`delimiters.test(c)`). |
| `brackets` | `boolean \| Record<string, string>` | `undefined` (disabled) | Enables bracket-aware tokenization. `true` uses the built-in pairs `{ '[': ']', '(': ')' }`; pass an object to define custom (and multi-character) open/close pairs, e.g. `{ '$(': ')$' }`. Content between a matched pair — including nested pairs and delimiter characters — becomes part of a single token. |
| `quotes` | `boolean \| string[]` | `undefined` (disabled) | Enables quote-aware tokenization. `true` uses the built-in quote characters `['"', "'", '`']`; pass an array to use custom quote strings. Content between a matching pair of quote characters is kept together as one token, including delimiter, bracket, and (by default) escape characters. |
| `escape` | `string \| RegExp \| TokenCallback \| false` | `'\\'` (backslash) | Controls escaping. A `string` or single-char match makes the *next* character literal. A `RegExp` is tested per character. A `TokenCallback` receives `(char, index, input)` and returns whether `char` starts an escape sequence. Pass `false` or `''` to disable escaping entirely. |
| `keepDelimiters` | `boolean \| TokenCallback` | `undefined` (discarded) | Whether the delimiter character is kept (prepended to the *next* token) instead of discarded. Pass a callback to decide per-delimiter. |
| `keepQuotes` | `boolean \| TokenCallback` | `undefined` (kept) | Whether the surrounding quote characters are included in the token. Pass a callback to decide per-quote-character. Note: unlike `keepDelimiters`/`keepBrackets`, omitting this option keeps the quotes. |
| `keepBrackets` | `boolean \| TokenCallback` | `undefined` (kept) | Whether the outermost bracket characters are included in the token. Nested (non-outermost) bracket characters are always kept regardless of this setting. Pass a callback to decide per-bracket-character. Note: omitting this option keeps the brackets. |
| `emptyTokens` | `boolean` | `false` | When `true`, `.next()` returns `''` for consecutive delimiters or a leading/trailing delimiter instead of skipping over them. |

> **`keepQuotes` / `keepBrackets` default to "kept", not "discarded".** This differs from
> `keepDelimiters`, which defaults to discarding the delimiter. Pass `false` explicitly to strip
> quote or bracket characters from the output.

### Processing order

For each input character, `next()` evaluates in this order:

1. **Escape** — if the escape rule matches, the *next* character is copied into the token
   verbatim and both characters are consumed. This applies even inside quotes (so a quote
   character can be escaped) and even inside brackets.
2. **Quotes, if currently inside a quoted string** — only the quote character that matches the
   one currently open can close it; any other character (including bracket and delimiter
   characters) is treated as literal content of the token. This means brackets are *not*
   structurally interpreted inside a quoted string, and mismatched quote characters (e.g. an
   apostrophe inside a double-quoted string) do not close the string early.
3. **Brackets, if not inside a quote** — open/close bracket characters push/pop an internal
   stack; while the stack is non-empty, every character (including delimiters and quote
   characters) is treated as literal content of the token.
4. **Quotes, if not already inside a quote and not inside brackets** — a matching quote
   character opens a new quoted string.
5. **Delimiters** — if not consumed by any of the above, a delimiter character ends the current
   token.
6. Otherwise the character is appended to the current token.

In short: **escape > quotes > brackets** in terms of who "wins" precedence when nested, and
plain delimiters only apply at the top level (outside both quotes and brackets).

### `Tokenizer` interface

```ts
interface Tokenizer {
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
```

| Member | Description |
| --- | --- |
| `input` | The original (stringified) input passed to `tokenize()`. |
| `startIndex` | Index in `input` where the current token started. |
| `curIndex` | Index in `input` of the last character consumed while producing the current token. |
| `current` | The last token returned by `next()` (`''` before the first call). |
| `reset()` | Rewinds the cursor to the beginning of `input`, discarding all internal state (bracket stack, open quote, pending token). |
| `next()` | Advances to and returns the next token, or `null` once `input` is exhausted. With `emptyTokens: true`, this can return `''` for empty tokens instead of `null` — `null` is only returned once there are no more characters left to consume. |
| `all()` | Drains the remaining tokens (via the iterator) into a `string[]`. Combine with `reset()` first if you want every token from the start. |
| `join(separator?)` | Drains the remaining tokens and joins them into a single string, using `separator` (default `''`) between tokens. |
| `[Symbol.iterator]()` | Makes the tokenizer usable in `for...of` and spread syntax. **The returned iterator is a thin wrapper around the tokenizer's own cursor, not an independent, restartable iterator** — the `Tokenizer` is a single-pass cursor; iterating it twice without calling `reset()` in between will only see the remaining tokens the second time. |

Calling `next()` after the input is exhausted keeps returning `null` (or `''` for a trailing
empty token when `emptyTokens: true`, exactly once).

An unclosed bracket at the end of input throws a `SyntaxError` from `next()` (see
[Errors](#errors)) — the string being tokenized is otherwise fully consumed up to that point,
and the tokenizer should not be reused afterward.

### Static defaults

`tokenize` exposes its built-in defaults as static properties, useful for extending rather than
fully replacing them:

```ts
namespace tokenize {
  const DEFAULT_BRACKETS: Record<string, string>; // { '[': ']', '(': ')' }
  const DEFAULT_QUOTES: string[];                 // ['"', "'", '`']
  const DEFAULT_DELIMITERS: RegExp;               // /\W/
}
```

### Errors

`next()` throws a `SyntaxError` in two cases:

- **Mismatched closing bracket** — a closing bracket character is found that doesn't match the
  most recently opened bracket (e.g. `(a]` with default brackets):
  `SyntaxError: Closure of brackets was used invalid.`
- **Unclosed bracket at end of input** — the input ends while one or more brackets are still
  open (e.g. `(a`):
  `` SyntaxError: Bracket (<index>) is not closed ``

Unbalanced or mismatched quote characters do **not** throw; an unterminated quoted string
simply consumes the rest of the input as its content.

## `splitString(input, options)`

```ts
function splitString(
  input: string,
  options?: Omit<TokenizerOptions, 'emptyTokens'>,
): string[];
```

A convenience wrapper around `tokenize()` for the common case of splitting a whole string into
an array in one call.

- Defaults `delimiters` to `','` (overridable via `options.delimiters`).
- Always tokenizes with `emptyTokens: true` internally, so leading/trailing/consecutive
  delimiters produce `''` entries rather than being skipped — this is why `emptyTokens` is
  omitted from its options type.
- All other `TokenizerOptions` (`brackets`, `quotes`, `escape`, `keepDelimiters`, `keepQuotes`,
  `keepBrackets`) are forwarded as-is.

```ts
splitString('a,b,,c');
// → ['a', 'b', '', 'c']

splitString('a,(b,c)', { brackets: true, keepBrackets: false });
// → ['a', 'b,c']

splitString("a,'a,b'", { quotes: true, keepQuotes: false });
// → ['a', 'a,b']
```

## Types

```ts
type TokenCallback = (current: string, index: number, input: string) => boolean;
```

Used for `escape`, `keepDelimiters`, `keepQuotes`, and `keepBrackets` when a per-character
decision is needed. `current` is the matched character (or bracket/quote string), `index` is
its position in `input`.

```ts
interface TokenizerOptions {
  delimiters?: string | RegExp;
  brackets?: boolean | Record<string, string>;
  quotes?: boolean | string[];
  escape?: string | RegExp | TokenCallback | false;
  keepDelimiters?: boolean | TokenCallback;
  keepQuotes?: boolean | TokenCallback;
  keepBrackets?: boolean | TokenCallback;
  emptyTokens?: boolean;
}
```

## Recipes

**Iterate tokens lazily:**

```ts
for (const token of tokenize('Hello world. This is mars')) {
  console.log(token); // Hello, world, This, is, mars
}
```

**Keep delimiters attached to the following token:**

```ts
tokenize('/Hello world.', { keepDelimiters: true }).all();
// → ['/Hello', ' world', '.']
```

**Parse a CSV-like line with quoted fields:**

```ts
splitString('a,"b,c",d', { quotes: ['"'], keepQuotes: false });
// → ['a', 'b,c', 'd']
```

**Tokenize a bracketed/quoted expression as one opaque token (e.g. a JSON-ish blob):**

```ts
tokenize('{ a:1, b: { c: "{a:1}" } }', {
  brackets: { '{': '}' },
  quotes: ['"'],
}).next();
// → '{ a:1, b: { c: "{a:1}" } }'
```

**Custom, multi-character brackets:**

```ts
tokenize('Hello $(world)$', { brackets: { '$(': ')$' } }).all();
// → ['Hello', '$(world)$']
```

**Disable escaping:**

```ts
tokenize('Hello\\ world', { escape: false }).all();
// → ['Hello', 'world']
```
