// Simplified insult/advice generator
const SCORE_RANGES = { EXCEPTIONAL: 90, ABOVE_AVERAGE: 75, AVERAGE: 60, BELOW_AVERAGE: 0 };

// Archetypes (single punchy noun)
const MALE_ARCHETYPES = {
  EXCEPTIONAL: 'Alpha Overlord',
  ABOVE_AVERAGE: 'Solid Brick',
  AVERAGE: 'Background Noise',
  BELOW_AVERAGE: 'Pathetic NPC'
};

const FEMALE_ARCHETYPES = {
  EXCEPTIONAL: 'Queen Sovereign',
  ABOVE_AVERAGE: 'Chic Contender',
  AVERAGE: 'Basic Background',
  BELOW_AVERAGE: 'Forgotten Extra'
};

// Descriptors (one adjective/phrase)
const CASUAL_DESCRIPTORS = {
  EXCEPTIONAL: ['Peak Rizz', 'Main Character Energy'],
  ABOVE_AVERAGE: ['Solid Presence', 'Worth the Glance'],
  AVERAGE: ['Just Mid', 'Shrug Emoji'],
  BELOW_AVERAGE: ['NPC Energy', '404 Charisma']
};

// Single advice per feature
const FEATURE_ADVICE = {
  'Carnal Tilt': 'Hold that gaze like you own it',
  'Cheekbone Location': 'Sculpt your angles',
  'Chin': 'Keep your chin up',
  'Facial Thirds': 'Balance those thirds',
  'Interocular Distance': 'Give your eyes breathing room',
  'Jawline': 'Stay sharp—no soft edges',
  'Nose': 'Frame your profile boldly'
};

const FACIAL_FEATURES = ['Carnal Tilt','Cheekbone Location','Chin','Facial Thirds','Interocular Distance','Jawline','Nose'];
const getRandom = arr => arr[Math.floor(Math.random()*arr.length)];

function getTier(avg) {
  if (avg >= SCORE_RANGES.EXCEPTIONAL) return 'EXCEPTIONAL';
  if (avg >= SCORE_RANGES.ABOVE_AVERAGE) return 'ABOVE_AVERAGE';
  if (avg >= SCORE_RANGES.AVERAGE) return 'AVERAGE';
  return 'BELOW_AVERAGE';
}

/**
 * allScores: { featureName: score (0–100), ... }
 * gender: 'M' or 'W'
 * returns: "You are [Archetype] — [Descriptor]. [Advice]."
 */
export function generateRatingName(allScores, gender) {
  if (!['M','W'].includes(gender)) throw new Error('Invalid gender');

  // calculate average on facial features only
  const keys = Object.keys(allScores).filter(k => FACIAL_FEATURES.includes(k));
  const avg = keys.reduce((sum,k) => sum + allScores[k],0) / keys.length;
  const tier = getTier(avg);

  // pick archetype & descriptor
  const archetype = gender === 'M' ? MALE_ARCHETYPES[tier] : FEMALE_ARCHETYPES[tier];
  const descriptor = getRandom(CASUAL_DESCRIPTORS[tier]);

  // pick feature furthest from 50 for targeted advice
  const target = keys.reduce((a,b) => Math.abs(allScores[b]-50) > Math.abs(allScores[a]-50) ? b : a, keys[0]);
  const advice = FEATURE_ADVICE[target];

  return `You are ${archetype} — ${descriptor}. ${advice}.`;
}
