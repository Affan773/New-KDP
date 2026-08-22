export interface WordTheme {
  id: string;
  name: string;
  category: string;
  words: string[];
}

export const BUILT_IN_WORD_THEMES: Record<string, WordTheme> = {
  animals: {
    id: 'animals',
    name: 'Animals & Wildlife',
    category: 'Nature',
    words: [
      'ELEPHANT', 'GIRAFFE', 'KANGAROO', 'LEOPARD', 'CHEETAH',
      'DOLPHIN', 'FLAMINGO', 'PENGUIN', 'GORILLA', 'CHAMELEON',
      'OCTOPUS', 'ALLIGATOR', 'HEDGEHOG', 'PLATYPUS', 'MEERKAT',
      'PANTHER', 'BUFFALO', 'GAZELLE', 'RHINOCEROS', 'SQUIRREL',
      'WALRUS', 'ZEBRA', 'ANTELOPE', 'BADGER', 'CHIPMUNK',
      'PORCUPINE', 'SALAMANDER', 'KOALA', 'TORTOISE', 'WOLVERINE'
    ],
  },
  nature: {
    id: 'nature',
    name: 'Nature & Botanical',
    category: 'Nature',
    words: [
      'WATERFALL', 'MOUNTAIN', 'RAINFOREST', 'BLOSSOM', 'VALLEY',
      'GLACIER', 'CANYON', 'MEADOW', 'VOLCANO', 'HORIZON',
      'SUNFLOWER', 'LAVENDER', 'ORCHID', 'EVERGREEN', 'WILDWOOD',
      'RIVERBANK', 'SUNSHINE', 'TWILIGHT', 'BREEZE', 'SEASHORE',
      'FOREST', 'STREAM', 'ISLAND', 'WETLAND', 'SAVANNA',
      'PINECONE', 'FERN', 'REDWOOD', 'TUNDRA', 'PENINSULA'
    ],
  },
  food: {
    id: 'food',
    name: 'Culinary & Baking',
    category: 'Lifestyle',
    words: [
      'CROISSANT', 'CHOCOLATE', 'CINNAMON', 'BLUEBERRY', 'AVOCADO',
      'ROASTED', 'SMOOTHIE', 'PANCAKES', 'CAPPUCCINO', 'PARMESAN',
      'SOURDOUGH', 'PISTACHIO', 'CARAMEL', 'SPAGHETTI', 'ROSEMARY',
      'GINGERBREAD', 'VANILLA', 'BAGUETTE', 'TIRAMISU', 'CHEDDAR',
      'ESPRESSO', 'WAFFLE', 'ALMOND', 'HONEYCOMB', 'MACARON',
      'TARRAGON', 'POACHED', 'GUACAMOLE', 'PINEAPPLE', 'BRIOCHE'
    ],
  },
  space: {
    id: 'space',
    name: 'Astronomy & Cosmos',
    category: 'Science',
    words: [
      'SUPERNOVA', 'ASTEROID', 'CONSTELLATION', 'TELESCOPE', 'ASTRONAUT',
      'METEORITE', 'GRAVITY', 'GALAXY', 'PLANETARIUM', 'SATELLITE',
      'ECLIPSE', 'NEBULA', 'UNIVERSE', 'ORBITAL', 'STARLIGHT',
      'JUPITER', 'MERCURY', 'NEPTUNE', 'ANDROMEDA', 'SOLSTICE',
      'COSMOLOGY', 'CRATER', 'ATMOSPHERE', 'INTERSTELLAR', 'AURORA',
      'EQUINOX', 'PHOTON', 'CELESTIAL', 'MAGNETAR', 'OBSERVATORY'
    ],
  },
  travel: {
    id: 'travel',
    name: 'Travel & Exploration',
    category: 'Geography',
    words: [
      'PASSPORT', 'BACKPACK', 'NAVIGATION', 'COMPASS', 'DEPARTURE',
      'ITINERARY', 'ADVENTURE', 'LANDMARK', 'TERMINAL', 'SOUVENIR',
      'EXPEDITION', 'VOYAGE', 'HIGHWAY', 'LUGGAGE', 'WAYPOINT',
      'HARBOR', 'MONUMENT', 'HORIZON', 'LIGHTHOUSE', 'CABIN',
      'BOARDING', 'AIRPORT', 'CAMPSITE', 'TRAVELLER', 'DISCOVERY'
    ],
  },
  science: {
    id: 'science',
    name: 'Science & Discovery',
    category: 'STEM',
    words: [
      'MICROSCOPE', 'HYPOTHESIS', 'EXPERIMENT', 'MOLECULE', 'ELECTRON',
      'LABORATORY', 'DISCOVERY', 'RESEARCH', 'CHEMISTRY', 'BIOLOGY',
      'GENETICS', 'ORGANISM', 'CATALYST', 'ELEMENT', 'FOSSIL',
      'QUANTUM', 'GRAVITATIONAL', 'ECOSYSTEM', 'CELLULAR', 'SPECIMEN'
    ],
  },
  sports: {
    id: 'sports',
    name: 'Sports & Athletics',
    category: 'Active',
    words: [
      'MARATHON', 'CHAMPION', 'BADMINTON', 'SWIMMING', 'TRIATHLON',
      'GYMNASTICS', 'VOLLEYBALL', 'ATHLETE', 'STADIUM', 'TOURNAMENT',
      'BICYCLE', 'SNOWBOARD', 'ARCHERY', 'SURFING', 'CLIMBING',
      'TEAMWORK', 'GOALKEEPER', 'DECATHLON', 'VICTORY', 'FITNESS'
    ],
  },
  vocabulary: {
    id: 'vocabulary',
    name: 'General Vocabulary',
    category: 'Language',
    words: [
      'BRILLIANT', 'COURAGE', 'SERENITY', 'WONDERFUL', 'HARMONY',
      'CREATIVE', 'KINDNESS', 'WISDOM', 'JOURNEY', 'ELEGANT',
      'GRATITUDE', 'RESILIENCE', 'GENEROUS', 'OPTIMISM', 'STRENGTH',
      'PURPOSE', 'BALANCE', 'VIBRANT', 'DISCOVERY', 'INSPIRE'
    ],
  },
  school: {
    id: 'school',
    name: 'School & Education',
    category: 'Education',
    words: [
      'CLASSROOM', 'HOMEWORK', 'NOTEBOOK', 'BLACKBOARD', 'PENCIL',
      'LIBRARY', 'TEACHER', 'STUDENT', 'GEOMETRY', 'BACKPACK',
      'RECESS', 'ALGEBRA', 'HISTORY', 'DIPLOMA', 'GRADUATION',
      'PROJECT', 'SCIENCE', 'CAFETERIA', 'TEXTBOOK', 'CALCULATOR'
    ],
  },
  hobbies: {
    id: 'hobbies',
    name: 'Hobbies & Crafts',
    category: 'Lifestyle',
    words: [
      'PAINTING', 'KNITTING', 'GARDENING', 'CERAMICS', 'FISHING',
      'PHOTOGRAPHY', 'ORIGAMI', 'WOODWORK', 'COOKING', 'READING',
      'CALLIGRAPHY', 'POTTERY', 'SEWING', 'QUILTING', 'SCULPTURE',
      'CAMPING', 'PUZZLES', 'CHESS', 'SKETCHING', 'BAKING'
    ],
  },
  jobs: {
    id: 'jobs',
    name: 'Careers & Occupations',
    category: 'Work',
    words: [
      'ARCHITECT', 'ENGINEER', 'DOCTOR', 'ASTRONOMER', 'JOURNALIST',
      'MUSICIAN', 'DETECTIVE', 'SCIENTIST', 'PROGRAMMER', 'SURGEON',
      'VETERINARIAN', 'PROFESSOR', 'DESIGNER', 'MECHANIC', 'CARPENTER',
      'FIREFIGHTER', 'PARAMEDIC', 'NAVIGATOR', 'PILOT', 'CHEF'
    ],
  },
  weather: {
    id: 'weather',
    name: 'Weather & Climate',
    category: 'Nature',
    words: [
      'THUNDERSTORM', 'BLIZZARD', 'HURRICANE', 'TORNADO', 'LIGHTNING',
      'DRIZZLE', 'DOWNPOUR', 'RAINBOW', 'SUNSHINE', 'MONSOON',
      'OVERCAST', 'HAILSTORM', 'SNOWFLAKE', 'HUMIDITY', 'BAROMETER',
      'FORECAST', 'CYCLONE', 'BREEZE', 'TEMPEST', 'WHITEOUT'
    ],
  },
  seasons: {
    id: 'seasons',
    name: 'Four Seasons',
    category: 'Nature',
    words: [
      'SPRINGTIME', 'SUMMERTIME', 'AUTUMN', 'WINTER', 'SOLSTICE',
      'EQUINOX', 'HARVEST', 'BLOSSOM', 'SUNSHINE', 'FROSTBITE',
      'FOLIAGE', 'FIREWORKS', 'VACATION', 'HIBERNATE', 'HEATWAVE',
      'MIGRATION', 'DECEMBER', 'PUMPKIN', 'LEAFPEEPING', 'ICICLE'
    ],
  },
};

/**
 * Sanitizes and cleanses word lists for puzzle generation.
 * Strips whitespace, removes non-alphabetic characters, and removes duplicates.
 */
export function sanitizeWordList(
  rawWords: string[] | string,
  minLen: number = 3,
  maxLen: number = 18
): { words: string[]; errors: string[]; removedDuplicates: number } {
  const errors: string[] = [];
  let list: string[] = [];

  if (typeof rawWords === 'string') {
    list = rawWords
      .split(/[,\n\r\t]+/)
      .map(w => w.trim())
      .filter(Boolean);
  } else if (Array.isArray(rawWords)) {
    list = rawWords.map(w => String(w).trim()).filter(Boolean);
  }

  const seen = new Set<string>();
  const sanitized: string[] = [];
  let duplicates = 0;

  for (const raw of list) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleaned) continue;

    if (cleaned.length < minLen) {
      errors.push(`"${raw}" is too short (min ${minLen} characters)`);
      continue;
    }
    if (cleaned.length > maxLen) {
      errors.push(`"${raw}" is too long (max ${maxLen} characters)`);
      continue;
    }

    if (seen.has(cleaned)) {
      duplicates++;
    } else {
      seen.add(cleaned);
      sanitized.push(cleaned);
    }
  }

  return {
    words: sanitized,
    errors,
    removedDuplicates: duplicates,
  };
}
