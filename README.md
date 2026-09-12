## fast-tokenizer
  
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![CircleCI][circleci-image]][circleci-url]
[![Test Coverage][coveralls-image]][coveralls-url]


A fast, dependency-free tokenizer/lexer for JavaScript and TypeScript. Splits a string into
tokens using configurable delimiters, with optional support for quoted strings, nested
brackets, and character escaping.

## 📖 [Full API documentation](docs/api.md)

## Features

- Custom delimiters as a string of characters or a `RegExp`
- Quote-aware tokenization (`"`, `'`, `` ` ``, or custom quote strings) — delimiters and
  brackets inside a quoted string are treated as literal text
- Bracket-aware tokenization with nesting support, including custom multi-character brackets
- Configurable character escaping (default: `\`)
- Fine-grained control over whether delimiters, quotes, and brackets are kept in the output
- Lazy, iterable `Tokenizer` cursor — implements `Symbol.iterator`, plus `.all()` and `.join()`
  convenience methods
- Zero runtime dependencies, ESM-only

## Installation

```bash
npm install fast-tokenizer --save
```

Requires Node.js >= 20.

## Quick start

```ts
import { tokenize, splitString } from 'fast-tokenizer';

// Iterate tokens lazily
for (const token of tokenize('Hello world. This is mars')) {
  console.log(token); // Hello, world, This, is, mars
}

// Split a whole string into an array in one call
splitString('a,b,,c');
// → ['a', 'b', '', 'c']

// Quoted fields are kept together, even if they contain the delimiter
splitString('a,"b,c",d', { quotes: ['"'], keepQuotes: false });
// → ['a', 'b,c', 'd']

// Bracketed content is kept together, including nested brackets
splitString('a,(b,c,(d,e))', { brackets: true, keepBrackets: false });
// → ['a', 'b,c,(d,e)']
```

## Support
You can report bugs and discuss features on the [GitHub issues](https://github.com/panates/fast-tokenizer/issues) page.
When you open an issue please provide the version of Node.js and of fast-tokenizer you are using.

## Node Compatibility
- node >= 20.0
 
  
### License
fast-tokenizer is available under [MIT](LICENSE) license.

[npm-image]: https://img.shields.io/npm/v/fast-tokenizer.svg
[npm-url]: https://npmjs.org/package/fast-tokenizer
[circleci-image]: https://circleci.com/gh/panates/fast-tokenizer/tree/master.svg?style=shield
[circleci-url]: https://circleci.com/gh/panates/fast-tokenizer/tree/master
[coveralls-image]: https://img.shields.io/coveralls/panates/fast-tokenizer/dev.svg
[coveralls-url]: https://coveralls.io/r/panates/fast-tokenizer
[downloads-image]: https://img.shields.io/npm/dm/fast-tokenizer.svg
[downloads-url]: https://npmjs.org/package/fast-tokenizer
[gitter-image]: https://badges.gitter.im/panates/fast-tokenizer.svg
[gitter-url]: https://gitter.im/panates/fast-tokenizer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[dependencies-image]: https://david-dm.org/panates/fast-tokenizer/status.svg
[dependencies-url]:https://david-dm.org/panates/fast-tokenizer
[devdependencies-image]: https://david-dm.org/panates/fast-tokenizer/dev-status.svg
[devdependencies-url]:https://david-dm.org/panates/fast-tokenizer?type=dev
[quality-image]: http://npm.packagequality.com/shield/fast-tokenizer.png
[quality-url]: http://packagequality.com/#?package=fast-tokenizer
