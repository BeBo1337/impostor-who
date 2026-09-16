/**
 * All user-facing Hebrew copy lives here. Components must not embed strings.
 */

const plural = (n: number, one: string, two: string, many: (n: number) => string): string => {
  if (n === 1) return one;
  if (n === 2) return two;
  return many(n);
};

const countCategories = (n: number) => plural(n, 'קטגוריה אחת', 'שתי קטגוריות', (k) => `${k} קטגוריות`);

export const he = {
  appName: 'מי המתחזה?',
  tagline: 'כולם יודעים. משהו מעמיד פנים.',
  secretSticker: 'סודי',
  topSecretSticker: 'סודי ביותר',

  counts: {
    players: (n: number) => plural(n, 'שחקן אחד', 'שני שחקנים', (k) => `${k} שחקנים`),
    impostors: (n: number) => plural(n, 'מתחזה אחד', 'שני מתחזים', (k) => `${k} מתחזים`),
    categories: countCategories,
    words: (n: number) => plural(n, 'מילה אחת', 'שתי מילים', (k) => `${k} מילים`),
  },

  setup: {
    playersTitle: 'שחקנים',
    playersEdit: 'עריכה',
    playersAdd: 'הוספת שחקנים',
    playersEmpty: 'עדיין אין שחקנים כאן.',
    playersEmptyHint: 'הוסיפו את כל מי שמשחק. צריך לפחות 3.',
    playersMore: (n: number) => `ועוד ${n}`,

    categoriesTitle: 'קטגוריות',
    categoriesChoose: 'בחירה',
    categoriesEmpty: 'לא נבחרו קטגוריות.',
    categoriesSelected: (n: number, total: number) => `${n} מתוך ${total}`,

    customTitle: 'מילים משלכם',
    customAdd: 'הוספת מילים',
    customEdit: 'עריכה',
    customEmpty: 'הוסיפו מילים וביטויים משלכם, והם יופיעו כקטגוריה נוספת בבחירת הקטגוריות.',
    customIncluded: 'נבחרו לסבב הבא',
    customNotIncluded: 'לא נבחרו לסבב. אפשר לבחור אותן יחד עם הקטגוריות.',

    impostorsTitle: 'מתחזים',
    impostorsLabel: 'כמה מתחזים בסבב?',
    impostorsMax: (max: number) => `המקסימום לחבורה הזו: ${max}`,
    impostorsRule: 'מתחזה אחד לכל 5 שחקנים.',
    impostorsDecrease: 'הפחתת מספר המתחזים',
    impostorsIncrease: 'הגדלת מספר המתחזים',
    impostorsClamped: (n: number) => `החבורה קטנה יותר, אז מספר המתחזים ירד ל־${n}.`,

    howToTitle: 'איך משחקים?',
    howToHint: 'שלושה שלבים, חצי דקה',

    start: 'מתחילים משחק',
    startBlockedPlayers: 'צריך לפחות 3 שחקנים כדי להתחיל',
    startBlockedCategories: 'בחרו לפחות קטגוריה אחת',
    startBlockedImpostors: 'מספר המתחזים גבוה מדי לחבורה הזו',
    storageUnavailable: 'ההגדרות לא נשמרות בדפדפן הזה, אבל אפשר לשחק כרגיל.',
  },

  howTo: {
    title: 'איך משחקים?',
    steps: [
      {
        title: 'מעבירים את הטלפון',
        body: 'כל אחד מציץ בתפקיד שלו, בלי שאחרים רואים.',
      },
      {
        title: 'מילה אחת. סוד אחד.',
        body: 'כולם מקבלים את אותה מילה. כל מתחזה מקבל רק רמז.',
      },
      {
        title: 'נותנים אסוציאציות ומתחילים לחשוד',
        body: 'המשחק בוחר מי מתחיל. נותנים אסוציאציות בתור, בלי לומר את המילה, ומנסים לגלות מי המתחזה.',
      },
    ],
    done: 'הבנו, מתחילים לחשוד',
  },

  players: {
    title: 'שחקנים',
    inputLabel: 'שם השחקן החדש',
    inputPlaceholder: 'הוספת שחקן',
    add: 'הוספה',
    done: 'סיום',
    close: 'סגירה',
    rename: 'שינוי שם',
    renameOf: (name: string) => `שינוי השם של ${name}`,
    remove: 'הסרה',
    removeOf: (name: string) => `הסרת ${name}`,
    save: 'שמירה',
    cancel: 'ביטול',
    editLabel: 'שם חדש',
    listEmpty: 'הרשימה ריקה. הוסיפו את כל מי שמשחק.',
    minHint: 'צריך לפחות 3 שחקנים כדי להתחיל.',
    added: (name: string) => `נוסף לרשימה: ${name}`,
    removed: (name: string) => `הוסר מהרשימה: ${name}`,
    renamed: (name: string) => `השם עודכן ל־${name}`,
    errors: {
      empty: 'כתבו שם לפני ההוספה.',
      tooLong: (max: number) => `השם ארוך מדי. עד ${max} תווים.`,
      duplicate: 'כבר יש שחקן בשם הזה.',
    },
  },

  custom: {
    title: 'מילים משלכם',
    intro: 'המילים שלכם מצטרפות כקטגוריה ״המילים שלנו״. לכל מילה צריך לפחות רמז אחד למתחזה.',
    wordLabel: 'מילה',
    wordPlaceholder: 'מילה או ביטוי',
    hintsLabel: 'רמזים למתחזה',
    hintsPlaceholder: 'רמז אחד או יותר, מופרדים בפסיק',
    hintsHelp: 'רמז טוב הוא אסוציאציה רחבה, לא הגדרה של המילה.',
    add: 'הוספה',
    done: 'סיום',
    editOf: (word: string) => `עריכת ${word}`,
    removeOf: (word: string) => `הסרת ${word}`,
    save: 'שמירה',
    cancel: 'ביטול',
    listEmpty: 'עדיין אין מילים. המילה הראשונה שתוסיפו תפעיל את הקטגוריה.',
    tileEmpty: 'עדיין אין מילים',
    added: (word: string) => `נוספה המילה ${word}`,
    removed: (word: string) => `הוסרה המילה ${word}`,
    updated: (word: string) => `המילה ${word} עודכנה`,
    errors: {
      emptyWord: 'כתבו מילה לפני ההוספה.',
      wordTooLong: (max: number) => `המילה ארוכה מדי. עד ${max} תווים.`,
      duplicate: 'המילה הזאת כבר ברשימה.',
      noHints: 'הוסיפו לפחות רמז אחד למתחזה.',
      hintTooLong: (max: number) => `אחד הרמזים ארוך מדי. עד ${max} תווים.`,
      hintIsWord: 'הרמז לא יכול להיות המילה עצמה או חלק ממנה.',
      tooMany: (max: number) => `אפשר לשמור עד ${max} מילים.`,
    },
  },

  categories: {
    title: 'קטגוריות',
    selectedOf: (n: number, total: number) => `נבחרו ${n} מתוך ${total}`,
    countSelected: (n: number) =>
      plural(n, 'קטגוריה אחת נבחרה', 'שתי קטגוריות נבחרו', (k) => `${k} קטגוריות נבחרו`),
    selectAll: 'בחירת הכול',
    clear: 'ניקוי בחירה',
    confirm: 'אישור',
    cancel: 'ביטול',
    close: 'סגירה',
    needOne: 'בחרו לפחות קטגוריה אחת',
    selected: 'נבחרה',
  },

  deal: {
    passTo: 'העבירו את הטלפון ל…',
    progress: (index: number, total: number) => `שחקן ${index} מתוך ${total}`,
    forYourEyes: 'רק לעיניך',
    cardCaption: 'אף אחד אחר לא מסתכל? מצוין.',
    reveal: 'הצגת התפקיד שלי',
    hideAndContinue: 'הסתרה והמשך',
    yourWord: 'המילה שלך',
    keepSecret: 'שמרו על המילה בסוד',
    impostorTitle: 'את/ה המתחזה!',
    yourHint: 'הרמז שלך',
    blendIn: 'נסו להשתלב בלי לחשוף את עצמכם',
    exit: 'יציאה מהסבב',
    exitTitle: 'לצאת מהסבב?',
    exitBody: 'התפקידים שחולקו יימחקו, ותחזרו למסך ההגדרות.',
    exitConfirm: 'יציאה',
    exitCancel: 'להישאר',
  },

  complete: {
    title: 'כל התפקידים חולקו!',
    body: 'עכשיו מניחים את הטלפון ומתחילים לדבר. מי המתחזה?',
    newRound: 'סבב חדש',
    backToSetup: 'חזרה להגדרות',
    sticker: 'בהצלחה',
    starterLabel: 'מתחילים עם',
    starterCaption: 'נבחר בהגרלה מבין כל השחקנים',
  },

  errors: {
    title: 'משהו השתבש',
    body: 'רעננו את הדף כדי להמשיך. השחקנים וההגדרות נשמרו.',
    reload: 'רענון',
  },
} as const;

export type Copy = typeof he;
