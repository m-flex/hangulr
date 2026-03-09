// Complete Hangul data for learning

export const VOWELS_BASIC = [
  { char: 'ㅏ', roman: 'a', sound: 'ah', hint: 'Like "a" in "father"', group: 1,
    mnemonic: 'Person with arm reaching RIGHT — open "ah"',
    articulation: 'Mouth opens wide, jaw drops, tongue rests low.' },
  { char: 'ㅓ', roman: 'eo', sound: 'uh', hint: 'Like "u" in "bus"', group: 1,
    mnemonic: 'Person with arm reaching LEFT — say "uh"',
    articulation: 'Mouth opens less than ㅏ, tongue pulls slightly back.' },
  { char: 'ㅗ', roman: 'o', sound: 'oh', hint: 'Like "o" in "go"', group: 2,
    mnemonic: 'Short stroke ABOVE the horizon — lips round up for "oh"',
    articulation: 'Lips round into a small circle, tongue mid-back.' },
  { char: 'ㅜ', roman: 'u', sound: 'oo', hint: 'Like "oo" in "moon"', group: 2,
    mnemonic: 'Short stroke BELOW the horizon — lips push down for "oo"',
    articulation: 'Lips round tightly and push forward, tongue high-back.' },
  { char: 'ㅡ', roman: 'eu', sound: 'eu', hint: 'Like "oo" but with lips spread', group: 3,
    mnemonic: 'Flat horizon line — spread lips flat, say "eu"',
    articulation: 'Lips stretch wide and flat, tongue high-center.' },
  { char: 'ㅣ', roman: 'i', sound: 'ee', hint: 'Like "ee" in "see"', group: 3,
    mnemonic: 'Tall vertical line, a person standing — say "ee"',
    articulation: 'Lips spread into a smile, tongue pushes high-front.' },
  { char: 'ㅑ', roman: 'ya', sound: 'yah', hint: 'Like "ya" in "yard"', group: 4,
    mnemonic: 'Double strokes right — add Y to "ah" for "yah"',
    articulation: 'Tongue glides from high-front Y into open "ah" mouth.' },
  { char: 'ㅕ', roman: 'yeo', sound: 'yuh', hint: 'Like "you" without the "u"', group: 4,
    mnemonic: 'Double strokes left — add Y to "uh" for "yuh"',
    articulation: 'Tongue glides from high-front Y into relaxed "uh" mouth.' },
  { char: 'ㅛ', roman: 'yo', sound: 'yo', hint: 'Like "yo" in "yoga"', group: 5,
    mnemonic: 'Double strokes above — add Y to "oh" for "yo"',
    articulation: 'Tongue glides from Y, then lips round for "oh."' },
  { char: 'ㅠ', roman: 'yu', sound: 'yoo', hint: 'Like "you"', group: 5,
    mnemonic: 'Double strokes below — add Y to "oo" for "yoo"',
    articulation: 'Tongue glides from Y, then lips round tightly for "oo."' },
];

export const CONSONANTS_BASIC = [
  { char: 'ㄱ', roman: 'g/k', sound: 'g', hint: 'Like "g" in "go" or "k" in "kite"', group: 1,
    mnemonic: 'An angle like a gun — tongue hits the back roof',
    articulation: 'Back of tongue presses against the soft palate (velar stop).' },
  { char: 'ㄴ', roman: 'n', sound: 'n', hint: 'Like "n" in "nose"', group: 1,
    mnemonic: 'An L-shape — tongue tip touches behind front teeth',
    articulation: 'Tongue tip presses the ridge behind upper front teeth (alveolar nasal).' },
  { char: 'ㄷ', roman: 'd/t', sound: 'd', hint: 'Like "d" in "do" or "t" in "top"', group: 2,
    mnemonic: 'A flat box — tongue seals the front of the roof',
    articulation: 'Tongue tip hits the alveolar ridge then releases (alveolar stop).' },
  { char: 'ㄹ', roman: 'r/l', sound: 'r', hint: 'Between "r" and "l"', group: 2,
    mnemonic: 'A wavy shape — tongue flaps, between R and L',
    articulation: 'Tongue tip flaps once against the alveolar ridge (lateral flap).' },
  { char: 'ㅁ', roman: 'm', sound: 'm', hint: 'Like "m" in "mom"', group: 3,
    mnemonic: 'A box like a closed mouth — press both lips together',
    articulation: 'Both lips seal shut while air hums through the nose (bilabial nasal).' },
  { char: 'ㅂ', roman: 'b/p', sound: 'b', hint: 'Like "b" in "boy" or "p" in "pin"', group: 3,
    mnemonic: 'Looks like a bucket — both lips pop apart',
    articulation: 'Both lips press together then burst open (bilabial stop).' },
  { char: 'ㅅ', roman: 's', sound: 's', hint: 'Like "s" in "sun"', group: 4,
    mnemonic: 'A tree or tent — air hisses through the teeth',
    articulation: 'Tongue tip approaches the alveolar ridge, air hisses out (alveolar fricative).' },
  { char: 'ㅇ', roman: 'ng/silent', sound: 'ng', hint: 'Silent at start, "ng" at end', group: 4,
    mnemonic: 'A circle — zero sound at start, "ng" ring at end',
    articulation: 'Silent initially; at syllable end, back of tongue seals the soft palate (velar nasal).' },
  { char: 'ㅈ', roman: 'j', sound: 'j', hint: 'Like "j" in "jam"', group: 5,
    mnemonic: 'Like ㅅ with a hat — tongue touches roof for J',
    articulation: 'Tongue blade presses the palate then releases with friction (alveo-palatal affricate).' },
  { char: 'ㅊ', roman: 'ch', sound: 'ch', hint: 'Like "ch" in "church"', group: 5,
    mnemonic: 'ㅈ with extra line — stronger CH, a puff of air',
    articulation: 'Same position as ㅈ but with an added burst of aspiration.' },
  { char: 'ㅋ', roman: 'k', sound: 'k', hint: 'Like "k" with strong breath', group: 6,
    mnemonic: 'ㄱ with extra line — harder K, a puff of air',
    articulation: 'Same position as ㄱ but with a strong aspirated release.' },
  { char: 'ㅌ', roman: 't', sound: 't', hint: 'Like "t" with strong breath', group: 6,
    mnemonic: 'ㄴ with extra line — harder T, a puff of air',
    articulation: 'Same position as ㄷ but with a strong aspirated release.' },
  { char: 'ㅍ', roman: 'p', sound: 'p', hint: 'Like "p" with strong breath', group: 7,
    mnemonic: 'ㅂ with extra line — harder P, a puff of air',
    articulation: 'Same position as ㅂ but with a strong aspirated release.' },
  { char: 'ㅎ', roman: 'h', sound: 'h', hint: 'Like "h" in "hat"', group: 7,
    mnemonic: 'A person in a hat, breathing out — H sound',
    articulation: 'Air flows freely from the throat through an open mouth (glottal fricative).' },
];

export const CONSONANTS_DOUBLE = [
  { char: 'ㄲ', roman: 'kk', sound: 'kk', hint: 'Tense "k" sound', base: 'ㄱ',
    mnemonic: 'Doubled ㄱ — tense your throat for a sharp K',
    articulation: 'Glottis tightens, back of tongue hits soft palate with no air puff.' },
  { char: 'ㄸ', roman: 'tt', sound: 'tt', hint: 'Tense "t" sound', base: 'ㄷ',
    mnemonic: 'Doubled ㄷ — tense your throat for a sharp T',
    articulation: 'Glottis tightens, tongue tip strikes alveolar ridge with no air puff.' },
  { char: 'ㅃ', roman: 'pp', sound: 'pp', hint: 'Tense "p" sound', base: 'ㅂ',
    mnemonic: 'Doubled ㅂ — tense your throat for a sharp P',
    articulation: 'Glottis tightens, both lips pop with no air puff.' },
  { char: 'ㅆ', roman: 'ss', sound: 'ss', hint: 'Tense "s" sound', base: 'ㅅ',
    mnemonic: 'Doubled ㅅ — tense your throat for a sharp S',
    articulation: 'Glottis tightens, tongue forces a tighter hiss at the alveolar ridge.' },
  { char: 'ㅉ', roman: 'jj', sound: 'jj', hint: 'Tense "j" sound', base: 'ㅈ',
    mnemonic: 'Doubled ㅈ — tense your throat for a sharp J',
    articulation: 'Glottis tightens, tongue strikes palate with no air puff.' },
];

export const VOWELS_COMPOUND = [
  { char: 'ㅐ', roman: 'ae', sound: 'ae', hint: 'Like "a" in "apple"', base: 'ㅏ+ㅣ',
    mnemonic: 'ㅏ meets ㅣ — "ah" slides toward "ee" to make "ae"',
    articulation: 'Mouth opens mid-wide, tongue front-mid, like English "bet."' },
  { char: 'ㅒ', roman: 'yae', sound: 'yae', hint: 'Like "ya" + "e"', base: 'ㅑ+ㅣ',
    mnemonic: 'ㅑ meets ㅣ — add Y before "ae" for "yae"',
    articulation: 'Tongue glides from Y into the "ae" position.' },
  { char: 'ㅔ', roman: 'e', sound: 'eh', hint: 'Like "e" in "bed"', base: 'ㅓ+ㅣ',
    mnemonic: 'ㅓ meets ㅣ — "uh" slides toward "ee" to make "eh"',
    articulation: 'Mouth opens slightly, tongue front-mid, like English "set."' },
  { char: 'ㅖ', roman: 'ye', sound: 'yeh', hint: 'Like "ye" in "yes"', base: 'ㅕ+ㅣ',
    mnemonic: 'ㅕ meets ㅣ — add Y before "eh" for "yeh"',
    articulation: 'Tongue glides from Y into the "eh" position.' },
  { char: 'ㅘ', roman: 'wa', sound: 'wah', hint: 'Like "wa" in "wand"', base: 'ㅗ+ㅏ',
    mnemonic: 'ㅗ meets ㅏ — round lips glide open into "wah"',
    articulation: 'Lips start rounded for "oh," then open wide into "ah."' },
  { char: 'ㅙ', roman: 'wae', sound: 'wae', hint: 'Like "we" in "wet"', base: 'ㅗ+ㅐ',
    mnemonic: 'ㅗ meets ㅐ — round lips slide into "wae"',
    articulation: 'Lips start rounded, then spread into a front "ae" sound.' },
  { char: 'ㅚ', roman: 'oe', sound: 'weh', hint: 'Like "we" in "web"', base: 'ㅗ+ㅣ',
    mnemonic: 'ㅗ meets ㅣ — round lips slide into "weh"',
    articulation: 'Lips start rounded, tongue pushes forward for a front vowel.' },
  { char: 'ㅝ', roman: 'wo', sound: 'wuh', hint: 'Like "wo" in "won"', base: 'ㅜ+ㅓ',
    mnemonic: 'ㅜ meets ㅓ — tight round lips relax into "wuh"',
    articulation: 'Lips start tightly rounded, then relax open for "uh."' },
  { char: 'ㅞ', roman: 'we', sound: 'weh', hint: 'Like "we"', base: 'ㅜ+ㅔ',
    mnemonic: 'ㅜ meets ㅔ — round lips glide into "weh"',
    articulation: 'Lips start rounded for "oo," then spread into "eh."' },
  { char: 'ㅟ', roman: 'wi', sound: 'wee', hint: 'Like "wee"', base: 'ㅜ+ㅣ',
    mnemonic: 'ㅜ meets ㅣ — round lips glide into "wee"',
    articulation: 'Lips start rounded, then spread into a high-front "ee."' },
  { char: 'ㅢ', roman: 'ui', sound: 'eui', hint: 'Like "oo-ee" quickly', base: 'ㅡ+ㅣ',
    mnemonic: 'ㅡ meets ㅣ — flat lips slide into "ee" quickly',
    articulation: 'Lips start flat for "eu," then shift into a spread "ee."' },
];

// ── Hangul composition utilities ──────────────────────

export const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('')
export const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('')
export const FINALS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
  'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

const _CONSONANTS = new Set(INITIALS)
const _VOWELS = new Set(MEDIALS)

export function isConsonant(ch) { return _CONSONANTS.has(ch) }
export function isVowel(ch) { return _VOWELS.has(ch) }

/**
 * Compose a Hangul syllable from jamo components.
 * @param {string} initial - Initial consonant (초성)
 * @param {string} medial  - Medial vowel (중성)
 * @param {string} [final] - Optional final consonant (종성/받침)
 * @returns {string|null} The composed syllable character, or null if invalid
 */
export function composeSyllable(initial, medial, final) {
  const i = INITIALS.indexOf(initial)
  const m = MEDIALS.indexOf(medial)
  if (i === -1 || m === -1) return null
  const f = final ? FINALS.indexOf(final) : 0
  if (f === -1) return null
  return String.fromCharCode(0xAC00 + (i * 21 + m) * 28 + f)
}

// Simple syllables for Stage 3
export const SYLLABLES_BASIC = [
  { char: '가', roman: 'ga', components: ['ㄱ', 'ㅏ'] },
  { char: '나', roman: 'na', components: ['ㄴ', 'ㅏ'] },
  { char: '다', roman: 'da', components: ['ㄷ', 'ㅏ'] },
  { char: '라', roman: 'ra', components: ['ㄹ', 'ㅏ'] },
  { char: '마', roman: 'ma', components: ['ㅁ', 'ㅏ'] },
  { char: '바', roman: 'ba', components: ['ㅂ', 'ㅏ'] },
  { char: '사', roman: 'sa', components: ['ㅅ', 'ㅏ'] },
  { char: '아', roman: 'a', components: ['ㅇ', 'ㅏ'] },
  { char: '자', roman: 'ja', components: ['ㅈ', 'ㅏ'] },
  { char: '하', roman: 'ha', components: ['ㅎ', 'ㅏ'] },
  { char: '고', roman: 'go', components: ['ㄱ', 'ㅗ'] },
  { char: '노', roman: 'no', components: ['ㄴ', 'ㅗ'] },
  { char: '도', roman: 'do', components: ['ㄷ', 'ㅗ'] },
  { char: '로', roman: 'ro', components: ['ㄹ', 'ㅗ'] },
  { char: '모', roman: 'mo', components: ['ㅁ', 'ㅗ'] },
  { char: '보', roman: 'bo', components: ['ㅂ', 'ㅗ'] },
  { char: '소', roman: 'so', components: ['ㅅ', 'ㅗ'] },
  { char: '오', roman: 'o', components: ['ㅇ', 'ㅗ'] },
  { char: '구', roman: 'gu', components: ['ㄱ', 'ㅜ'] },
  { char: '누', roman: 'nu', components: ['ㄴ', 'ㅜ'] },
  { char: '두', roman: 'du', components: ['ㄷ', 'ㅜ'] },
  { char: '무', roman: 'mu', components: ['ㅁ', 'ㅜ'] },
  { char: '수', roman: 'su', components: ['ㅅ', 'ㅜ'] },
  { char: '우', roman: 'u', components: ['ㅇ', 'ㅜ'] },
  { char: '기', roman: 'gi', components: ['ㄱ', 'ㅣ'] },
  { char: '니', roman: 'ni', components: ['ㄴ', 'ㅣ'] },
  { char: '미', roman: 'mi', components: ['ㅁ', 'ㅣ'] },
  { char: '시', roman: 'si', components: ['ㅅ', 'ㅣ'] },
  { char: '이', roman: 'i', components: ['ㅇ', 'ㅣ'] },
];

// CVC syllables with final consonants (받침) for Stage 6
export const SYLLABLES_BATCHIM = [
  // ㄱ batchim
  { char: '국', roman: 'guk', components: ['ㄱ', 'ㅜ', 'ㄱ'], hint: 'As in 한국 (Korea)' },
  { char: '학', roman: 'hak', components: ['ㅎ', 'ㅏ', 'ㄱ'], hint: 'As in 학교 (school)' },
  { char: '독', roman: 'dok', components: ['ㄷ', 'ㅗ', 'ㄱ'], hint: 'Poison / reading' },
  // ㄴ batchim
  { char: '산', roman: 'san', components: ['ㅅ', 'ㅏ', 'ㄴ'], hint: 'Mountain' },
  { char: '한', roman: 'han', components: ['ㅎ', 'ㅏ', 'ㄴ'], hint: 'As in 한글 (Hangul)' },
  { char: '문', roman: 'mun', components: ['ㅁ', 'ㅜ', 'ㄴ'], hint: 'Door / gate' },
  // ㄹ batchim
  { char: '달', roman: 'dal', components: ['ㄷ', 'ㅏ', 'ㄹ'], hint: 'Moon' },
  { char: '불', roman: 'bul', components: ['ㅂ', 'ㅜ', 'ㄹ'], hint: 'Fire' },
  { char: '말', roman: 'mal', components: ['ㅁ', 'ㅏ', 'ㄹ'], hint: 'Horse / words' },
  // ㅁ batchim
  { char: '곰', roman: 'gom', components: ['ㄱ', 'ㅗ', 'ㅁ'], hint: 'Bear' },
  { char: '남', roman: 'nam', components: ['ㄴ', 'ㅏ', 'ㅁ'], hint: 'South / man' },
  { char: '삼', roman: 'sam', components: ['ㅅ', 'ㅏ', 'ㅁ'], hint: 'Three' },
  // ㅂ batchim
  { char: '밥', roman: 'bap', components: ['ㅂ', 'ㅏ', 'ㅂ'], hint: 'Rice / meal' },
  { char: '집', roman: 'jip', components: ['ㅈ', 'ㅣ', 'ㅂ'], hint: 'House' },
  { char: '입', roman: 'ip', components: ['ㅇ', 'ㅣ', 'ㅂ'], hint: 'Mouth' },
  // ㅅ batchim
  { char: '옷', roman: 'ot', components: ['ㅇ', 'ㅗ', 'ㅅ'], hint: 'Clothes' },
  { char: '빛', roman: 'bit', components: ['ㅂ', 'ㅣ', 'ㅅ'], hint: 'Light' },
  { char: '낫', roman: 'nat', components: ['ㄴ', 'ㅏ', 'ㅅ'], hint: 'Sickle / better' },
  // ㅇ batchim
  { char: '강', roman: 'gang', components: ['ㄱ', 'ㅏ', 'ㅇ'], hint: 'River' },
  { char: '공', roman: 'gong', components: ['ㄱ', 'ㅗ', 'ㅇ'], hint: 'Ball' },
  { char: '방', roman: 'bang', components: ['ㅂ', 'ㅏ', 'ㅇ'], hint: 'Room' },
  // Mixed practice
  { char: '손', roman: 'son', components: ['ㅅ', 'ㅗ', 'ㄴ'], hint: 'Hand' },
  { char: '눈', roman: 'nun', components: ['ㄴ', 'ㅜ', 'ㄴ'], hint: 'Eye / snow' },
  { char: '발', roman: 'bal', components: ['ㅂ', 'ㅏ', 'ㄹ'], hint: 'Foot' },
];

// Words for Stage 5
export const WORDS = [
  // Greetings
  { word: '안녕', roman: 'annyeong', meaning: 'Hello (informal)', category: 'greetings' },
  { word: '감사', roman: 'gamsa', meaning: 'Thanks', category: 'greetings' },
  { word: '네', roman: 'ne', meaning: 'Yes', category: 'greetings' },
  { word: '아니요', roman: 'aniyo', meaning: 'No', category: 'greetings' },
  // Numbers
  { word: '하나', roman: 'hana', meaning: 'One', category: 'numbers' },
  { word: '둘', roman: 'dul', meaning: 'Two', category: 'numbers' },
  { word: '셋', roman: 'set', meaning: 'Three', category: 'numbers' },
  { word: '넷', roman: 'net', meaning: 'Four', category: 'numbers' },
  { word: '다섯', roman: 'daseot', meaning: 'Five', category: 'numbers' },
  // Food
  { word: '밥', roman: 'bap', meaning: 'Rice/Meal', category: 'food' },
  { word: '물', roman: 'mul', meaning: 'Water', category: 'food' },
  { word: '고기', roman: 'gogi', meaning: 'Meat', category: 'food' },
  { word: '김치', roman: 'gimchi', meaning: 'Kimchi', category: 'food' },
  { word: '차', roman: 'cha', meaning: 'Tea', category: 'food' },
  // Family
  { word: '엄마', roman: 'eomma', meaning: 'Mom', category: 'family' },
  { word: '아빠', roman: 'appa', meaning: 'Dad', category: 'family' },
  { word: '누나', roman: 'nuna', meaning: 'Older sister (m.)', category: 'family' },
  { word: '오빠', roman: 'oppa', meaning: 'Older brother (f.)', category: 'family' },
  // Common
  { word: '사람', roman: 'saram', meaning: 'Person', category: 'common' },
  { word: '나라', roman: 'nara', meaning: 'Country', category: 'common' },
  { word: '학교', roman: 'hakgyo', meaning: 'School', category: 'common' },
  { word: '한국', roman: 'hanguk', meaning: 'Korea', category: 'common' },
  { word: '서울', roman: 'seoul', meaning: 'Seoul', category: 'common' },
  { word: '사랑', roman: 'sarang', meaning: 'Love', category: 'common' },
  // Colors
  { word: '빨강', roman: 'ppalgang', meaning: 'Red', category: 'colors' },
  { word: '파랑', roman: 'parang', meaning: 'Blue', category: 'colors' },
  { word: '노랑', roman: 'norang', meaning: 'Yellow', category: 'colors' },
  { word: '초록', roman: 'chorok', meaning: 'Green', category: 'colors' },
  { word: '하양', roman: 'hayang', meaning: 'White', category: 'colors' },
  { word: '검정', roman: 'geomjeong', meaning: 'Black', category: 'colors' },
  // Animals
  { word: '고양이', roman: 'goyangi', meaning: 'Cat', category: 'animals' },
  { word: '강아지', roman: 'gangaji', meaning: 'Puppy', category: 'animals' },
  { word: '새', roman: 'sae', meaning: 'Bird', category: 'animals' },
  { word: '물고기', roman: 'mulgogi', meaning: 'Fish', category: 'animals' },
  { word: '토끼', roman: 'tokki', meaning: 'Rabbit', category: 'animals' },
  { word: '곰', roman: 'gom', meaning: 'Bear', category: 'animals' },
  // Body parts
  { word: '머리', roman: 'meori', meaning: 'Head', category: 'body' },
  { word: '눈', roman: 'nun', meaning: 'Eye', category: 'body' },
  { word: '코', roman: 'ko', meaning: 'Nose', category: 'body' },
  { word: '입', roman: 'ip', meaning: 'Mouth', category: 'body' },
  { word: '귀', roman: 'gwi', meaning: 'Ear', category: 'body' },
  { word: '손', roman: 'son', meaning: 'Hand', category: 'body' },
  { word: '발', roman: 'bal', meaning: 'Foot', category: 'body' },
  // Days of the week
  { word: '월요일', roman: 'woryoil', meaning: 'Monday', category: 'days' },
  { word: '화요일', roman: 'hwayoil', meaning: 'Tuesday', category: 'days' },
  { word: '수요일', roman: 'suyoil', meaning: 'Wednesday', category: 'days' },
  { word: '목요일', roman: 'mogyoil', meaning: 'Thursday', category: 'days' },
  { word: '금요일', roman: 'geumyoil', meaning: 'Friday', category: 'days' },
  { word: '토요일', roman: 'toyoil', meaning: 'Saturday', category: 'days' },
  { word: '일요일', roman: 'iryoil', meaning: 'Sunday', category: 'days' },
];

// Simple Korean sentences for sentence building practice
export const SENTENCES = [
  {
    korean: ['안녕', '하', '세요'],
    english: 'Hello (formal)',
    hint: 'A polite greeting',
  },
  {
    korean: ['감사', '합', '니다'],
    english: 'Thank you',
    hint: 'Formal thanks',
  },
  {
    korean: ['저', '는', '학생', '입니다'],
    english: 'I am a student',
    hint: 'Subject + topic marker + noun + "am"',
  },
  {
    korean: ['이것', '은', '물', '입니다'],
    english: 'This is water',
    hint: 'This + topic marker + noun + "is"',
  },
  {
    korean: ['한국', '은', '나라', '입니다'],
    english: 'Korea is a country',
    hint: 'Subject + topic marker + noun + "is"',
  },
  {
    korean: ['고양이', '가', '귀엽다'],
    english: 'The cat is cute',
    hint: 'Subject + subject marker + adjective',
  },
  {
    korean: ['밥', '을', '먹다'],
    english: 'To eat rice',
    hint: 'Object + object marker + verb',
  },
  {
    korean: ['물', '을', '마시다'],
    english: 'To drink water',
    hint: 'Object + object marker + verb',
  },
  {
    korean: ['학교', '에', '가다'],
    english: 'To go to school',
    hint: 'Place + location marker + verb',
  },
  {
    korean: ['엄마', '를', '사랑', '하다'],
    english: 'To love mom',
    hint: 'Object + object marker + noun + verb',
  },
  {
    korean: ['오늘', '은', '월요일', '입니다'],
    english: 'Today is Monday',
    hint: 'Today + topic marker + day + "is"',
  },
  {
    korean: ['서울', '에', '살다'],
    english: 'To live in Seoul',
    hint: 'Place + location marker + verb',
  },
];

// Stage definitions
export const STAGES = [
  {
    id: 1,
    title: 'Basic Vowels',
    subtitle: 'The foundation of Hangul',
    description: 'Learn the 10 basic vowel sounds',
    icon: '🔤',
    letters: VOWELS_BASIC,
    type: 'vowel',
    color: 'blue',
  },
  {
    id: 2,
    title: 'Basic Consonants',
    subtitle: 'Building blocks of speech',
    description: 'Learn the 14 basic consonant sounds',
    icon: '🗣️',
    letters: CONSONANTS_BASIC,
    type: 'consonant',
    color: 'purple',
  },
  {
    id: 3,
    title: 'Syllable Building',
    subtitle: 'Combining letters',
    description: 'Build syllables from consonants and vowels',
    icon: '🧩',
    letters: SYLLABLES_BASIC,
    type: 'syllable',
    color: 'green',
  },
  {
    id: 4,
    title: 'Advanced Letters',
    subtitle: 'Double consonants & compound vowels',
    description: 'Master the remaining Hangul characters',
    icon: '⚡',
    letters: [...CONSONANTS_DOUBLE, ...VOWELS_COMPOUND],
    type: 'advanced',
    color: 'orange',
  },
  {
    id: 5,
    title: 'Words & Reading',
    subtitle: 'Real Korean words',
    description: 'Learn common Korean vocabulary',
    icon: '📖',
    letters: WORDS,
    type: 'words',
    color: 'pink',
  },
  {
    id: 6,
    title: 'Batchim (받침)',
    subtitle: 'Final consonants',
    description: 'Master CVC syllables with final consonants',
    icon: '🧱',
    letters: SYLLABLES_BATCHIM,
    type: 'batchim',
    color: 'teal',
  },
];

// Lesson size: 3 new items per lesson (research: 3-5 optimal)
export const LESSON_SIZE = 3;

/**
 * Split a stage's letters into lessons of LESSON_SIZE.
 * Returns array of { index, letters, title }.
 */
export function getLessons(stage) {
  const letters = stage.letters;
  const lessons = [];
  for (let i = 0; i < letters.length; i += LESSON_SIZE) {
    const chunk = letters.slice(i, i + LESSON_SIZE);
    const chars = chunk.map(l => l.char || l.word).join(', ');
    lessons.push({
      index: lessons.length,
      letters: chunk,
      title: `Lesson ${lessons.length + 1}`,
      preview: chars,
    });
  }
  return lessons;
}

/**
 * Get all letters from previous lessons in the same stage (for interleaved review).
 */
export function getPreviousLetters(stage, lessonIdx) {
  const lessons = getLessons(stage);
  return lessons.slice(0, lessonIdx).flatMap(l => l.letters);
}

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: 'first_letter', title: 'First Steps', desc: 'Learn your first letter', icon: '👶', xp: 10 },
  { id: 'all_vowels', title: 'Vowel Master', desc: 'Learn all basic vowels', icon: '🎯', xp: 50 },
  { id: 'all_consonants', title: 'Consonant King', desc: 'Learn all basic consonants', icon: '👑', xp: 50 },
  { id: 'first_syllable', title: 'Block Builder', desc: 'Build your first syllable', icon: '🧱', xp: 20 },
  { id: 'first_word', title: 'Word Smith', desc: 'Learn your first word', icon: '📝', xp: 30 },
  { id: 'perfect_quiz', title: 'Perfect Score', desc: 'Get 100% on a quiz', icon: '💯', xp: 40 },
  { id: 'streak_3', title: 'On Fire', desc: '3 correct answers in a row', icon: '🔥', xp: 15 },
  { id: 'streak_10', title: 'Unstoppable', desc: '10 correct answers in a row', icon: '⚡', xp: 50 },
  { id: 'draw_10', title: 'Artist', desc: 'Practice writing 10 letters', icon: '🎨', xp: 30 },
  { id: 'daily_3', title: 'Consistent', desc: 'Study 3 days in a row', icon: '📅', xp: 25 },
  { id: 'daily_7', title: 'Dedicated', desc: 'Study 7 days in a row', icon: '🗓️', xp: 75 },
  { id: 'blitz_20', title: 'Speed Demon', desc: 'Score 20+ in Timed Challenge', icon: '⚡', xp: 40 },
  { id: 'all_stages', title: 'Hangul Hero', desc: 'Complete all 5 stages', icon: '🏆', xp: 200 },
];

// Level thresholds
export const LEVELS = [
  { level: 1, title: 'Beginner', minXp: 0, color: '#94a3b8' },
  { level: 2, title: 'Student', minXp: 200, color: '#60a5fa' },
  { level: 3, title: 'Learner', minXp: 500, color: '#34d399' },
  { level: 4, title: 'Reader', minXp: 1000, color: '#a78bfa' },
  { level: 5, title: 'Writer', minXp: 1800, color: '#f472b6' },
  { level: 6, title: 'Scholar', minXp: 3000, color: '#fb923c' },
  { level: 7, title: 'Master', minXp: 5000, color: '#facc15' },
  { level: 8, title: 'Hangul Hero', minXp: 8000, color: '#ef4444' },
];
