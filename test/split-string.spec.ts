import { splitString } from '../src/index.js';

describe('splitString', () => {
  it('Should split string into parts', () => {
    const v = splitString(' /Hello world. This is mars', { delimiters: ' ' });
    expect(v).toStrictEqual(['', '/Hello', 'world.', 'This', 'is', 'mars']);
  });

  it('Should split token parts as string array', () => {
    const tokens = splitString('Hello/world/This/is/mars', { delimiters: '/' });
    expect(tokens).toStrictEqual(['Hello', 'world', 'This', 'is', 'mars']);
  });

  it('Should array starts with empty items if string starts with a delimiter', () => {
    const tokens = splitString('/Hello/world/This/is/mars', {
      delimiters: '/',
    });
    expect(tokens).toStrictEqual(['', 'Hello', 'world', 'This', 'is', 'mars']);
  });

  it('Should keep text in quotes', () => {
    const v = splitString("a,'a,b'", { quotes: true, keepQuotes: false });
    expect(v).toStrictEqual(['a', 'a,b']);
  });

  it('Should keep text in brackets', () => {
    const v = splitString('a,(b,c,(d,e))', {
      brackets: true,
      keepBrackets: false,
    });
    expect(v).toStrictEqual(['a', 'b,c,(d,e)']);
  });
});
