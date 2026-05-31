import { WordOption, WordCategory, Difficulty } from '../../shared/types';

// In-memory word bank, loaded on server start
let wordBank: WordOption[] = [];

// Map from hero slug name (lowercase) to its real name alias
const heroRealNames = new Map<string, string>();

// Hardcoded fallback words if the API is unreachable
const FALLBACK_WORDS: WordOption[] = [
  // Heroes - Easy
  { word: 'Spider-Man', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Iron Man', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Hulk', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Thor', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Wolverine', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Captain America', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Black Widow', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Venom', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Groot', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Loki', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Storm', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Magneto', category: WordCategory.HEROES, difficulty: Difficulty.EASY },
  { word: 'Hawkeye', category: WordCategory.HEROES, difficulty: Difficulty.EASY },

  // Heroes - Medium
  { word: 'Scarlet Witch', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Black Panther', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Doctor Strange', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Moon Knight', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Star-Lord', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Hela', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Peni Parker', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Luna Snow', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Jeff the Land Shark', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Winter Soldier', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Rocket Raccoon', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'The Punisher', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Squirrel Girl', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Iron Fist', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Psylocke', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },

  // Heroes - Hard
  { word: 'Cloak & Dagger', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Adam Warlock', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Mantis', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Magik', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Namor', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Emma Frost', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'The Thing', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Human Torch', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Mister Fantastic', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Invisible Woman', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Blade', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Daredevil', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Phoenix', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Angela', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Elsa Bloodstone', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Gambit', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Deadpool', category: WordCategory.HEROES, difficulty: Difficulty.MEDIUM },
  { word: 'Rogue', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Black Cat', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Ultron', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'White Fox', category: WordCategory.HEROES, difficulty: Difficulty.HARD },
  { word: 'Devil Dinosaur', category: WordCategory.HEROES, difficulty: Difficulty.HARD },

  // Abilities - Easy
  { word: 'Web Swing', category: WordCategory.ABILITIES, difficulty: Difficulty.EASY },
  { word: 'Hulk Smash', category: WordCategory.ABILITIES, difficulty: Difficulty.EASY },
  { word: 'Repulsor Blast', category: WordCategory.ABILITIES, difficulty: Difficulty.EASY },
  { word: 'God of Thunder', category: WordCategory.ABILITIES, difficulty: Difficulty.EASY },

  // Abilities - Medium
  { word: 'Chaos Magic', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },
  { word: 'Adamantium Claws', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },
  { word: 'Symbiote Swing', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },
  { word: 'Phoenix Force', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },
  { word: 'Berserker Rage', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },
  { word: 'Ice Arts', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },
  { word: 'Shield Throw', category: WordCategory.ABILITIES, difficulty: Difficulty.MEDIUM },

  // Abilities - Hard
  { word: 'Eye of Agamotto', category: WordCategory.ABILITIES, difficulty: Difficulty.HARD },
  { word: 'Darkforce Dimension', category: WordCategory.ABILITIES, difficulty: Difficulty.HARD },
  { word: 'Lightforce Daggers', category: WordCategory.ABILITIES, difficulty: Difficulty.HARD },
  { word: 'Karmic Revival', category: WordCategory.ABILITIES, difficulty: Difficulty.HARD },
  { word: 'Regenerative Cocoon', category: WordCategory.ABILITIES, difficulty: Difficulty.HARD },
  { word: 'Absolute Zero', category: WordCategory.ABILITIES, difficulty: Difficulty.HARD },

  // Weapons & Items
  { word: 'Mjolnir', category: WordCategory.WEAPONS, difficulty: Difficulty.EASY },
  { word: "Captain America's Shield", category: WordCategory.WEAPONS, difficulty: Difficulty.EASY },
  { word: "Hawkeye's Bow", category: WordCategory.WEAPONS, difficulty: Difficulty.EASY },
  { word: 'Arc Reactor', category: WordCategory.WEAPONS, difficulty: Difficulty.MEDIUM },
  { word: 'Soulsword', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },
  { word: 'Psychic Blade', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },
  { word: 'Crescent Darts', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },
  { word: 'Daywalker Sword', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },
  { word: 'Billy Clubs', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },
  { word: 'Playing Cards', category: WordCategory.WEAPONS, difficulty: Difficulty.MEDIUM },
  { word: 'Metal Arm', category: WordCategory.WEAPONS, difficulty: Difficulty.MEDIUM },
  { word: "Widow's Bite", category: WordCategory.WEAPONS, difficulty: Difficulty.MEDIUM },
  { word: 'Element Guns', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },
  { word: 'SP//dr Mech', category: WordCategory.WEAPONS, difficulty: Difficulty.HARD },

  // Maps - Medium/Hard
  { word: 'Tokyo 2099', category: WordCategory.MAPS, difficulty: Difficulty.MEDIUM },
  { word: 'Sanctum Sanctorum', category: WordCategory.MAPS, difficulty: Difficulty.MEDIUM },
  { word: 'Yggdrasil', category: WordCategory.MAPS, difficulty: Difficulty.HARD },
  { word: 'Symbiote Planet', category: WordCategory.MAPS, difficulty: Difficulty.HARD },
  { word: 'Wakanda', category: WordCategory.MAPS, difficulty: Difficulty.MEDIUM },
  { word: 'Spider-Islands', category: WordCategory.MAPS, difficulty: Difficulty.MEDIUM },
  { word: 'Krakoa', category: WordCategory.MAPS, difficulty: Difficulty.HARD },
  { word: "K'un-Lun", category: WordCategory.MAPS, difficulty: Difficulty.HARD },
  { word: 'Central Park', category: WordCategory.MAPS, difficulty: Difficulty.EASY },
  { word: 'Grand Garden', category: WordCategory.MAPS, difficulty: Difficulty.HARD },

  // Team-Ups
  { word: 'Fastball Special', category: WordCategory.TEAM_UPS, difficulty: Difficulty.HARD },
];

export async function loadWordBank(): Promise<void> {
  try {
    const apiKey = process.env.MARVEL_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.log('[WordBank] No API key configured, using fallback words');
      wordBank = [...FALLBACK_WORDS];
      return;
    }

    const response = await fetch('https://marvelrivalsapi.com/api/v2/heroes', {
      headers: { 'x-api-key': apiKey },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const heroes: any[] = (await response.json()) as any[];
    const apiWords: WordOption[] = [];
    const IMG_BASE = 'https://marvelrivalsapi.com/rivals';
    const seenWords = new Set<string>();

    function titleCase(s: string): string {
      return s
        .split(/[-_ ]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    function addWord(word: string, category: WordCategory, diff: Difficulty, imageUrl?: string, aliases?: string[]) {
      const key = word.toLowerCase();
      if (seenWords.has(key) || word.length < 3) return;
      seenWords.add(key);
      apiWords.push({ word, category, difficulty: diff, imageUrl, aliases });
    }

    /**
     * Strip quoted nicknames from real names.
     * e.g. 'Steven "steve" Rogers' → 'Steven Rogers'
     * Also handles single quotes and various quote styles.
     */
    function cleanRealName(name: string): string {
      return name
        .replace(/\s*[""\u201C\u201D][^""\u201C\u201D]*[""\u201C\u201D]\s*/g, ' ')
        .replace(/\s*['''\u2018\u2019][^'''\u2018\u2019]*['''\u2018\u2019]\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    for (const hero of heroes) {
      const imageUrl = hero.imageUrl
        ? `${IMG_BASE}${hero.imageUrl}`
        : undefined;

      // Primary: title-cased hero slug name (e.g., "Hulk", "Spider Man")
      const heroName = titleCase(hero.name || hero.id);
      const wordLen = heroName.length;
      const difficulty = wordLen <= 5 ? Difficulty.EASY : wordLen <= 12 ? Difficulty.MEDIUM : Difficulty.HARD;

      // Process real name — store as alias, not a separate word
      const rawRealName = hero.real_name || '';
      const cleanedName = cleanRealName(rawRealName);
      let aliases: string[] | undefined;

      if (cleanedName && cleanedName.toLowerCase() !== heroName.toLowerCase()) {
        aliases = [cleanedName];
        heroRealNames.set(heroName.toLowerCase(), cleanedName);
      }

      addWord(heroName, WordCategory.HEROES, difficulty, imageUrl, aliases);

      // Add abilities (skip collab abilities to avoid duplication)
      if (hero.abilities && Array.isArray(hero.abilities)) {
        for (const ability of hero.abilities) {
          const abilityName = ability.name || ability;
          if (typeof abilityName === 'string' && abilityName.length > 2 && !ability.isCollab) {
            const icon = ability.icon ? `${IMG_BASE}${ability.icon}` : undefined;
            addWord(
              abilityName,
              WordCategory.ABILITIES,
              abilityName.length <= 10 ? Difficulty.MEDIUM : Difficulty.HARD,
              icon
            );
          }
        }
      }

      // Add costumes/skins (skip default skin that matches hero name)
      if (hero.costumes && Array.isArray(hero.costumes)) {
        for (const costume of hero.costumes) {
          const costumeName = costume.name || costume;
          if (
            typeof costumeName === 'string' &&
            costumeName.length > 2 &&
            costumeName.toLowerCase() !== heroName.toLowerCase() &&
            costumeName.toLowerCase() !== (hero.name || '').toLowerCase() &&
            costume.quality !== 'NO_QUALITY'
          ) {
            const icon = costume.icon ? `${IMG_BASE}${costume.icon}` : undefined;
            addWord(costumeName, WordCategory.SKINS, Difficulty.HARD, icon);
          }
        }
      }
    }

    // Try to load maps
    try {
      const mapsRes = await fetch('https://marvelrivalsapi.com/api/v2/maps', {
        headers: { 'x-api-key': apiKey },
      });
      if (mapsRes.ok) {
        const maps: any[] = (await mapsRes.json()) as any[];
        for (const m of maps) {
          const mapName = m.name || m.id;
          if (typeof mapName === 'string' && mapName.length > 2) {
            apiWords.push({
              word: mapName,
              category: WordCategory.MAPS,
              difficulty: Difficulty.MEDIUM,
            });
          }
        }
      }
    } catch {
      // Maps are optional
    }

    if (apiWords.length > 10) {
      // Add extra aliases for heroes with common short/alternate names
      const extraAliases: Record<string, string[]> = {
        'jeff the land shark': ['Jeff', 'Jeff The Shark'],
        'rocket raccoon': ['Rocket'],
        'devil dinosaur': ['Devil Dino'],
        'scarlet witch': ['Scarlet Witch', 'Wanda'],  // Wanda alone is common
        'human torch': ['Johnny Storm'],
        'captain america': ['Steve Rogers'],
      };

      for (const word of apiWords) {
        const key = word.word.toLowerCase();
        const extra = extraAliases[key];
        if (extra) {
          word.aliases = [...(word.aliases || []), ...extra];
        }
      }

      wordBank = apiWords;
      console.log(`[WordBank] Loaded ${apiWords.length} words from API`);
    } else {
      console.log('[WordBank] API returned too few words, using fallback');
      wordBank = [...FALLBACK_WORDS];
    }
  } catch (err) {
    console.error('[WordBank] Failed to load from API, using fallback:', err);
    wordBank = [...FALLBACK_WORDS];
  }
}

export function getRandomWords(
  count: number,
  categories: WordCategory[],
  usedWords: Set<string> = new Set(),
  useRealNames: boolean = false
): WordOption[] {
  let pool = wordBank.filter(
    (w) =>
      categories.includes(w.category) &&
      !usedWords.has(w.word)
  );

  // If pool is too small, allow repeats
  if (pool.length < count) {
    pool = wordBank.filter(
      (w) => categories.includes(w.category)
    );
  }

  // Shuffle and pick
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  // If useRealNames is enabled, include aliases on hero words
  // If disabled, strip aliases so only the hero name is accepted
  return picked.map((w) => ({
    ...w,
    aliases: useRealNames ? w.aliases : undefined,
  }));
}

export function getWordBank(): WordOption[] {
  return wordBank;
}
