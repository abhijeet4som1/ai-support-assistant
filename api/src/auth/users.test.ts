import { parseSeedUsers } from './users.js';

describe('parseSeedUsers', () => {
  it('parses pairs and trims whitespace', () => {
    expect(parseSeedUsers(' a:1 , b:pa:ss ')).toEqual([
      { username: 'a', password: '1' },
      { username: 'b', password: 'pa:ss' },
    ]);
  });
  it('rejects malformed entries', () => {
    expect(() => parseSeedUsers('nocolon')).toThrow(/username:password/);
    expect(() => parseSeedUsers('a:')).toThrow(/username:password/);
  });
});
