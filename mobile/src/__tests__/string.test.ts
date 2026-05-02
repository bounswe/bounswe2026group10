import { searchStartsWith, searchIncludes, searchEquals } from '../utils/string';

describe('searchStartsWith', () => {
  it('matches Turkish İ with plain "i" query', () => {
    expect(searchStartsWith('İstanbul', 'ist')).toBe(true);
  });

  it('matches plain I with plain "i" query', () => {
    expect(searchStartsWith('Istanbul', 'ist')).toBe(true);
  });

  it('is case-insensitive for ASCII', () => {
    expect(searchStartsWith('Community', 'comm')).toBe(true);
  });

  it('matches Turkish ş, ğ, ü, ö, ç', () => {
    expect(searchStartsWith('Şeker', 'şek')).toBe(true);
    expect(searchStartsWith('Güveç', 'güv')).toBe(true);
  });

  it('returns false when no match', () => {
    expect(searchStartsWith('Ankara', 'ist')).toBe(false);
  });
});

describe('searchIncludes', () => {
  it('finds İ-containing substring', () => {
    expect(searchIncludes('Türk Mutfağı', 'mutfağ')).toBe(true);
  });

  it('finds plain-I substring in Turkish name', () => {
    expect(searchIncludes('Istanbul Pidesi', 'istanbul')).toBe(true);
  });

  it('returns false when not found', () => {
    expect(searchIncludes('Çorba', 'xyz')).toBe(false);
  });
});

describe('searchEquals', () => {
  it('treats İ and i as equal', () => {
    expect(searchEquals('İzmir', 'izmir')).toBe(true);
  });

  it('treats plain I and i as equal', () => {
    expect(searchEquals('ISTANBUL', 'istanbul')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(searchEquals('Ankara', 'İzmir')).toBe(false);
  });
});
