export type CategoryId =
  | 'everyday'
  | 'celebrities'
  | 'food'
  | 'animals'
  | 'brands'
  | 'colors'
  | 'places'
  | 'emotions'
  | 'hobbies'
  | 'internet'
  | 'kitchen'
  | 'screen'
  | 'music'
  | 'professions'
  | 'school'
  | 'science'
  | 'sports'
  | 'superheroes'
  | 'transport'
  | 'videogames'
  | 'nature';

/** Pastel tone of a category tile. Maps to `--tone-*` tokens in CSS. */
export type Tone = 'lavender' | 'mint' | 'peach' | 'sky' | 'sand' | 'pink';

export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly tone: Tone;
}

export interface WordEntry {
  /** Stable unique id derived from the category and the word itself. */
  readonly id: string;
  readonly categoryId: CategoryId;
  /** The secret word or short phrase shown to ordinary players. */
  readonly word: string;
  /**
   * Three or more short associations. Each round picks one of them for the
   * impostors. None of them may be the word, part of it, or a give-away.
   */
  readonly hints: readonly string[];
}

/** Compact authoring format: [word, hint, hint, hint, ...moreHints]. */
export type WordSeed = readonly [word: string, hint1: string, hint2: string, hint3: string, ...moreHints: string[]];
