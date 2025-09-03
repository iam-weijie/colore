export interface EmojiData {
  id: string;
  emoji: string;
  categories: string[];
}

export const EMOJI_LIBRARY: EmojiData[] = [
  // Faces & Emotions (15 emojis)
  { id: 'face_happy', emoji: '😊', categories: ['faces', 'emotions', 'positive'] },
  { id: 'face_love', emoji: '😍', categories: ['faces', 'emotions', 'love'] },
  { id: 'face_laugh', emoji: '😂', categories: ['faces', 'emotions', 'funny'] },
  { id: 'face_wink', emoji: '😉', categories: ['faces', 'emotions', 'flirty'] },
  { id: 'face_cool', emoji: '😎', categories: ['faces', 'emotions', 'cool'] },
  { id: 'face_thinking', emoji: '🤔', categories: ['faces', 'emotions', 'thinking'] },
  { id: 'face_surprised', emoji: '😮', categories: ['faces', 'emotions', 'surprised'] },
  { id: 'face_sad', emoji: '😢', categories: ['faces', 'emotions', 'sad'] },
  { id: 'face_angry', emoji: '😠', categories: ['faces', 'emotions', 'angry'] },
  { id: 'face_sleepy', emoji: '😴', categories: ['faces', 'emotions', 'tired'] },
  { id: 'face_party', emoji: '🥳', categories: ['faces', 'emotions', 'celebration'] },
  { id: 'face_mind_blown', emoji: '🤯', categories: ['faces', 'emotions', 'shocked'] },
  { id: 'face_kiss', emoji: '😘', categories: ['faces', 'emotions', 'love'] },
  { id: 'face_sparkles', emoji: '✨', categories: ['faces', 'emotions', 'magical'] },
  { id: 'face_100', emoji: '💯', categories: ['faces', 'emotions', 'perfect'] },

  // Activities & Sports (15 emojis)
  { id: 'activity_soccer', emoji: '⚽', categories: ['activities', 'sports', 'ball'] },
  { id: 'activity_basketball', emoji: '🏀', categories: ['activities', 'sports', 'ball'] },
  { id: 'activity_music', emoji: '🎵', categories: ['activities', 'music', 'entertainment'] },
  { id: 'activity_dance', emoji: '💃', categories: ['activities', 'dance', 'entertainment'] },
  { id: 'activity_gaming', emoji: '🎮', categories: ['activities', 'gaming', 'entertainment'] },
  { id: 'activity_reading', emoji: '📚', categories: ['activities', 'education', 'books'] },
  { id: 'activity_cooking', emoji: '👨‍🍳', categories: ['activities', 'cooking', 'food'] },
  { id: 'activity_running', emoji: '🏃', categories: ['activities', 'sports', 'fitness'] },
  { id: 'activity_swimming', emoji: '🏊', categories: ['activities', 'sports', 'water'] },
  { id: 'activity_cycling', emoji: '🚴', categories: ['activities', 'sports', 'bike'] },
  { id: 'activity_hiking', emoji: '🥾', categories: ['activities', 'outdoor', 'nature'] },
  { id: 'activity_photography', emoji: '📸', categories: ['activities', 'art', 'creative'] },
  { id: 'activity_painting', emoji: '🎨', categories: ['activities', 'art', 'creative'] },
  { id: 'activity_meditation', emoji: '🧘', categories: ['activities', 'wellness', 'peace'] },
  { id: 'activity_yoga', emoji: '🧘‍♀️', categories: ['activities', 'wellness', 'fitness'] },

  // Food & Drinks (15 emojis)
  { id: 'food_pizza', emoji: '🍕', categories: ['food', 'italian', 'popular'] },
  { id: 'food_burger', emoji: '🍔', categories: ['food', 'american', 'popular'] },
  { id: 'food_coffee', emoji: '☕', categories: ['drinks', 'caffeine', 'morning'] },
  { id: 'food_beer', emoji: '🍺', categories: ['drinks', 'alcohol', 'social'] },
  { id: 'food_wine', emoji: '🍷', categories: ['drinks', 'alcohol', 'elegant'] },
  { id: 'food_cake', emoji: '🎂', categories: ['food', 'dessert', 'celebration'] },
  { id: 'food_ice_cream', emoji: '🍦', categories: ['food', 'dessert', 'cold'] },
  { id: 'food_sushi', emoji: '🍣', categories: ['food', 'japanese', 'healthy'] },
  { id: 'food_taco', emoji: '🌮', categories: ['food', 'mexican', 'spicy'] },
  { id: 'food_donut', emoji: '🍩', categories: ['food', 'dessert', 'sweet'] },
  { id: 'food_apple', emoji: '🍎', categories: ['food', 'fruit', 'healthy'] },
  { id: 'food_avocado', emoji: '🥑', categories: ['food', 'fruit', 'healthy'] },
  { id: 'food_banana', emoji: '🍌', categories: ['food', 'fruit', 'yellow'] },
  { id: 'food_strawberry', emoji: '🍓', categories: ['food', 'fruit', 'sweet'] },
  { id: 'food_popcorn', emoji: '🍿', categories: ['food', 'snack', 'movies'] },

  // Nature & Weather (15 emojis)
  { id: 'nature_sun', emoji: '☀️', categories: ['nature', 'weather', 'bright'] },
  { id: 'nature_moon', emoji: '🌙', categories: ['nature', 'weather', 'night'] },
  { id: 'nature_star', emoji: '⭐', categories: ['nature', 'space', 'bright'] },
  { id: 'nature_rainbow', emoji: '🌈', categories: ['nature', 'weather', 'colorful'] },
  { id: 'nature_flower', emoji: '🌸', categories: ['nature', 'plants', 'beautiful'] },
  { id: 'nature_tree', emoji: '🌳', categories: ['nature', 'plants', 'green'] },
  { id: 'nature_ocean', emoji: '🌊', categories: ['nature', 'water', 'blue'] },
  { id: 'nature_mountain', emoji: '⛰️', categories: ['nature', 'landscape', 'adventure'] },
  { id: 'nature_fire', emoji: '🔥', categories: ['nature', 'elements', 'hot'] },
  { id: 'nature_lightning', emoji: '⚡', categories: ['nature', 'weather', 'power'] },
  { id: 'nature_snowflake', emoji: '❄️', categories: ['nature', 'weather', 'cold'] },
  { id: 'nature_leaf', emoji: '🍃', categories: ['nature', 'plants', 'green'] },
  { id: 'nature_cactus', emoji: '🌵', categories: ['nature', 'plants', 'desert'] },
  { id: 'nature_butterfly', emoji: '🦋', categories: ['nature', 'animals', 'beautiful'] },
  { id: 'nature_bee', emoji: '🐝', categories: ['nature', 'animals', 'busy'] },

  // Objects & Symbols (15 emojis)
  { id: 'object_heart', emoji: '❤️', categories: ['symbols', 'love', 'emotions'] },
  { id: 'object_thumbs_up', emoji: '👌', categories: ['symbols', 'approval', 'positive'] },
  { id: 'object_clap', emoji: '👏', categories: ['symbols', 'celebration', 'approval'] },
  { id: 'object_peace', emoji: '✌️', categories: ['symbols', 'peace', 'positive'] },
  { id: 'object_ok_hand', emoji: '👌', categories: ['symbols', 'approval', 'perfect'] },
  { id: 'object_muscle', emoji: '💪', categories: ['symbols', 'strength', 'fitness'] },
  { id: 'object_brain', emoji: '🧠', categories: ['symbols', 'intelligence', 'thinking'] },
  { id: 'object_lightbulb', emoji: '💡', categories: ['symbols', 'ideas', 'creativity'] },
  { id: 'object_rocket', emoji: '🚀', categories: ['symbols', 'space', 'fast'] },
  { id: 'object_trophy', emoji: '🏆', categories: ['symbols', 'achievement', 'winner'] },
  { id: 'object_gift', emoji: '🎁', categories: ['symbols', 'celebration', 'surprise'] },
  { id: 'object_crown', emoji: '👑', categories: ['symbols', 'royalty', 'special'] },
  { id: 'object_diamond', emoji: '💎', categories: ['symbols', 'valuable', 'luxury'] },
  { id: 'object_key', emoji: '🔑', categories: ['symbols', 'access', 'important'] },
  { id: 'object_lock', emoji: '🔒', categories: ['symbols', 'security', 'private'] }
];

// Default shorthand emojis (6 most commonly used)
export const DEFAULT_SHORTHAND_EMOJIS: string[] = [
  '😊',
  '❤️', 
  '👌', 
  '😂', 
  '🔥', 
  '🥳'  
];

// Categories for filtering
export const EMOJI_CATEGORIES = [
  'faces',
  'emotions',
  'activities',
  'food',
  'nature',
  'symbols',
  'sports',
  'entertainment'
];
