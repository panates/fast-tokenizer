import type { TokenCallback, Tokenizer, TokenizerOptions } from './types.js';

export function tokenize(input: string, options?: TokenizerOptions): Tokenizer {
  input = input ? '' + input : '';
  const len = input.length;
  const keepDelimiters: TokenCallback | undefined =
    options?.keepDelimiters == null
      ? undefined
      : typeof options?.keepDelimiters === 'function'
        ? options.keepDelimiters
        : () => !!options?.keepDelimiters;
  const keepQuotes: TokenCallback | undefined =
    options?.keepQuotes == null
      ? undefined
      : typeof options?.keepQuotes === 'function'
        ? options.keepQuotes
        : () => !!options?.keepQuotes;
  const keepBrackets: TokenCallback | undefined =
    options?.keepBrackets == null
      ? undefined
      : typeof options?.keepBrackets === 'function'
        ? options.keepBrackets
        : () => !!options?.keepBrackets;

  let delimiters =
    options?.delimiters != null
      ? options?.delimiters
      : tokenize.DEFAULT_DELIMITERS;
  if (
    delimiters instanceof RegExp &&
    (delimiters.global || delimiters.sticky)
  ) {
    // A global/sticky regexp keeps state in `lastIndex`, which corrupts
    // per-character `.test()` calls below (it would silently skip every
    // other match on consecutive delimiters). Strip those flags once here.
    delimiters = new RegExp(
      delimiters.source,
      delimiters.flags.replace(/[gy]/g, ''),
    );
  }
  const quotes =
    options?.quotes == null || options?.quotes === false
      ? undefined
      : Array.isArray(options.quotes)
        ? options.quotes
        : tokenize.DEFAULT_QUOTES;
  const quotesSingleChar = !!quotes && quotes.every(x => x.length === 1);

  const brackets =
    options?.brackets == null || options?.brackets === false
      ? undefined
      : typeof options?.brackets === 'object'
        ? options.brackets
        : tokenize.DEFAULT_BRACKETS;
  const bracketsL: string[] = [];
  const bracketsR: string[] = [];
  if (brackets) {
    for (const [l, r] of Object.entries(brackets)) {
      bracketsL.push(l);
      bracketsR.push(r);
    }
  }
  const bracketsSingleChar =
    bracketsL.every(x => x.length === 1) &&
    bracketsR.every(x => x.length === 1);

  const emptyTokens = !!options?.emptyTokens;
  let escapeFn: TokenCallback | undefined;
  if (options?.escape == null) {
    escapeFn = c => c === '\\';
  } else {
    const optionsEscape = options.escape;
    if (typeof optionsEscape === 'function') escapeFn = optionsEscape;
    else if (optionsEscape instanceof RegExp) {
      escapeFn = c => optionsEscape.test(c);
    } else if (typeof optionsEscape === 'string' && optionsEscape) {
      escapeFn = c => c === optionsEscape;
    }
  }

  let index = 0;
  let curIndex = 0;
  let startIndex = 0;
  // Start of the run of input characters not yet copied into `token`.
  // Plain (unescaped, non-delimiter, non-bracket/quote) characters are left
  // in place in `input` and only sliced out in one shot in `flush()`,
  // instead of being appended one character at a time.
  let segStart = 0;
  let current = '';
  let token = '';
  let c = '';
  let _next = '';
  let bracketStack: number[] = [];
  let quoteString = '';
  let iterator: IterableIterator<string> | undefined;

  const flush = (end: number) => {
    if (end > segStart) token += input.slice(segStart, end);
  };

  return {
    get input(): string {
      return input;
    },

    get curIndex() {
      return index - 1;
    },

    get startIndex() {
      return startIndex;
    },

    get current(): string {
      return current;
    },

    reset() {
      index = 0;
      curIndex = 0;
      startIndex = 0;
      segStart = 0;
      current = '';
      token = '';
      bracketStack = [];
      quoteString = '';
      _next = '';
    },

    next() {
      startIndex = index;
      while (index < len) {
        curIndex = index;
        c = input.charAt(index++);
        _next = escapeFn ? input.charAt(index) : '';

        // Escaping
        if (escapeFn && escapeFn(c, curIndex, input)) {
          flush(curIndex);
          token += _next;
          index++;
          segStart = index;
          continue;
        }

        // Brackets
        if (brackets && !quoteString) {
          let i = bracketsSingleChar
            ? bracketsL.indexOf(c)
            : bracketsL.findIndex(
                x => x === input.substring(curIndex, curIndex + x.length),
              );
          if (i >= 0) {
            bracketStack.push(i);
            flush(curIndex);
            if (
              bracketStack.length > 1 ||
              keepBrackets == null ||
              keepBrackets(bracketsL[i], curIndex, input)
            ) {
              token += bracketsL[i];
            }
            index = curIndex + bracketsL[i].length;
            segStart = index;
            continue;
          }
          if (bracketStack.length) {
            i = bracketsSingleChar
              ? bracketsR.indexOf(c)
              : bracketsR.findIndex(
                  x => x === input.substring(curIndex, curIndex + x.length),
                );
            if (i >= 0) {
              if (i !== bracketStack[bracketStack.length - 1]) {
                throw new SyntaxError('Closure of brackets was used invalid.');
              }
              bracketStack.pop();
              flush(curIndex);
              if (
                bracketStack.length ||
                keepBrackets == null ||
                keepBrackets(bracketsR[i], curIndex, input)
              ) {
                token += bracketsR[i];
              }
              index = curIndex + bracketsR[i].length;
              segStart = index;
              continue;
            }
          }
        }

        if (bracketStack.length) {
          continue;
        }

        // Quotes
        if (quotes) {
          const i = quotesSingleChar
            ? quotes.indexOf(c)
            : quotes.findIndex(
                x => x === input.substring(curIndex, curIndex + x.length),
              );
          if (i >= 0 && (!quoteString || quotes[i] === quoteString)) {
            const s = quotes[i];
            flush(curIndex);
            if (keepQuotes == null || keepQuotes(s, curIndex, input)) {
              token += s;
            }
            if (quoteString) quoteString = '';
            else quoteString = s;
            index = curIndex + s.length;
            segStart = index;
            continue;
          }
        }

        if (quoteString) {
          continue;
        }

        if (
          delimiters &&
          ((typeof delimiters === 'string' && delimiters.includes(c)) ||
            (delimiters instanceof RegExp && delimiters.test(c)))
        ) {
          flush(curIndex);
          current = token;
          segStart = index;
          token = keepDelimiters && keepDelimiters(c, curIndex, input) ? c : '';
          if (current || emptyTokens) return current;
          continue;
        }
      }

      flush(index);
      segStart = index;
      if (bracketStack.length) {
        throw new SyntaxError(`Bracket (${bracketStack.pop()}) is not closed`);
      }

      current = token;
      token = '';
      return current || null;
    },

    all(): string[] {
      const arr: string[] = [];
      for (const x of this) {
        arr.push(x);
      }
      return arr;
    },

    join(separator?: string): string {
      const arr: string[] = [];
      for (const x of this) {
        arr.push(x);
      }
      return arr.join(separator || '');
    },

    [Symbol.iterator]() {
      const next = () => this.next();
      if (!iterator) {
        iterator = {
          next() {
            const value = next();
            return {
              done: value == null,
              value: value || '',
            };
          },
          [Symbol.iterator]() {
            return this;
          },
        };
      }
      return iterator;
    },
  };
}

export namespace tokenize {
  export const DEFAULT_BRACKETS = { '[': ']', '(': ')' };
  export const DEFAULT_QUOTES = ['"', "'", '`'];
  export const DEFAULT_DELIMITERS = /\W/;
}
