export type TokenCallback = ((current: string, index: number, input: string) => boolean);

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

export function splitString(input: string, options?: Omit<TokenizerOptions, 'emptyTokens'>): string[] {
  const out: string[] = [];
  const tokenizer = tokenize(input, {...options, emptyTokens: true});
  for (const x of tokenizer) {
    out.push(x || '');
  }
  return out;
}

export function tokenize(input: string, options?: TokenizerOptions): Tokenizer {
  input = input ? '' + input : '';
  const len = input.length;
  const keepDelimiters: TokenCallback | undefined =
      options?.keepDelimiters == null ? undefined :
          (typeof options?.keepDelimiters === 'function'
                  ? options.keepDelimiters
                  : () => !!options?.keepDelimiters
          )
  const keepQuotes: TokenCallback | undefined = options?.keepQuotes == null ? undefined :
      (typeof options?.keepQuotes === 'function'
              ? options.keepQuotes
              : () => !!options?.keepQuotes
      )
  const keepBrackets: TokenCallback | undefined = options?.keepBrackets == null ? undefined :
      (typeof options?.keepBrackets === 'function'
              ? options.keepBrackets
              : () => !!options?.keepBrackets
      )

  const delimiters = options?.delimiters != null ? options?.delimiters : tokenize.DEFAULT_DELIMITERS;
  const quotes = options?.quotes == null || options?.quotes === false
      ? undefined
      : Array.isArray(options.quotes) ? options.quotes : tokenize.DEFAULT_QUOTES;

  const brackets = options?.brackets == null || options?.brackets === false
      ? undefined
      : typeof options?.brackets === 'object' ? options.brackets : tokenize.DEFAULT_BRACKETS;
  const bracketsL: string[] = [];
  const bracketsR: string[] = [];
  if (brackets) {
    for (const [l, r] of Object.entries(brackets)) {
      bracketsL.push(l);
      bracketsR.push(r);
    }
  }


  const emptyTokens = !!options?.emptyTokens;
  let escapeFn: TokenCallback | undefined
  if (options?.escape == null) {
    escapeFn = (c) => c === '\\';
  } else {
    const optionsEscape = options.escape;
    if (typeof optionsEscape === 'function')
      escapeFn = optionsEscape;
    else if (optionsEscape instanceof RegExp)
      escapeFn = (c) => optionsEscape.test(c)
    else if (typeof optionsEscape === 'string' && optionsEscape)
      escapeFn = (c) => c === optionsEscape;
  }

  let index = 0;
  let curIndex = 0;
  let startIndex = 0;
  let current = '';
  let token = '';
  let c = '';
  let _prev = '';
  let _next = '';
  let bracketStack: number[] = [];
  let quoteString = '';
  let iterator: IterableIterator<string> | undefined;
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
      current = '';
      token = '';
      bracketStack = [];
      quoteString = '';
      _prev = '';
      _next = '';
    },

    next() {
      startIndex = index;
      if (index >= len)
        return null;
      while (index < len) {
        _prev = c;
        curIndex = index;
        c = input.charAt(index++);
        _next = input.charAt(index);

        // Escaping
        if (escapeFn && escapeFn(c, curIndex, input)) {
          token += _next;
          index++;
          continue;
        }

        // Brackets
        if (brackets) {
          let i = bracketsL.findIndex(x => x === input.substring(curIndex, curIndex + x.length));
          if (i >= 0) {
            bracketStack.push(i);
            if (keepBrackets == null || keepBrackets(bracketsL[i], curIndex, input))
              token += bracketsL[i];
            index = curIndex + bracketsL[i].length;
            continue;
          }
          i = bracketsR.findIndex(x => x === input.substring(curIndex, curIndex + x.length));
          if (i >= 0) {
            if (i != bracketStack[bracketStack.length - 1])
              throw new SyntaxError('Closure of brackets was used invalid.');
            bracketStack.pop();
            if (keepBrackets == null || keepBrackets(bracketsR[i], curIndex, input))
              token += bracketsR[i];
            index = curIndex + bracketsR[i].length;
            continue;
          }
        }

        if (bracketStack.length) {
          token += c;
          continue;
        }

        // Quotes
        if (quotes) {
          let i = quotes.findIndex(x => x === input.substring(curIndex, curIndex + x.length));
          if (i >= 0) {
            const s = quotes[i];
            if (keepQuotes == null || keepQuotes(s, curIndex, input))
              token += s;
            if (quoteString)
              quoteString = '';
            else quoteString = s;
            index = curIndex + s.length;
            continue;
          }
        }

        if (quoteString) {
          token += c;
          continue;
        }

        if (delimiters && (
            (typeof delimiters === 'string' && delimiters.includes(c)) ||
            (delimiters instanceof RegExp && delimiters.test(c))
        )) {
          current = token;
          token = keepDelimiters && keepDelimiters(c, curIndex, input) ? c : '';
          if (current || emptyTokens)
            return current;
          continue;
        }

        token += c;
      }

      if (bracketStack.length)
        throw new SyntaxError(`Bracket (${bracketStack.pop()}) is not closed`);

      current = token;
      token = '';
      return current;
    },

    all(): string[] {
      const arr: string[] = [];
      for (const x of this) {
        arr.push(x || '');
      }
      return arr;
    },

    join(separator?: string): string {
      let output = '';
      let i = 0;
      for (const x of this) {
        output += (separator && i++ ? separator : '') + x;
      }
      return output;
    },

    [Symbol.iterator]() {
      const next = this.next;
      if (!iterator) {
        iterator = {
          next() {
            const value = next();
            return {
              done: value == null,
              value: value || ''
            }
          },
          [Symbol.iterator]() {
            return this;
          }
        }
      }
      return iterator;
    }
  };
}

export namespace tokenize {
  export const DEFAULT_BRACKETS = {'[': ']', '(': ')'};
  export const DEFAULT_QUOTES = ['"', '\'', '`'];
  export const DEFAULT_DELIMITERS = /\W/
}
