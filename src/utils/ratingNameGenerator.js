// Score ranges for different tiers
const SCORE_RANGES = {
  EXCEPTIONAL: 90,
  ABOVE_AVERAGE: 75,
  AVERAGE: 60,
  BELOW_AVERAGE: 0
};

// Archetype mappings
const MALE_ARCHETYPES = {
  EXCEPTIONAL: 'The Trend Guy',
  ABOVE_AVERAGE: 'The Gym Bro',
  AVERAGE: 'The Loner',
  BELOW_AVERAGE: 'The Sadboy'
};

const FEMALE_ARCHETYPES = {
  EXCEPTIONAL: 'The Influencer',
  ABOVE_AVERAGE: 'The Smart Girl',
  AVERAGE: 'The Basic Bitch',
  BELOW_AVERAGE: 'The Alt Girl'
};

// Gender-specific overall descriptors
const CASUAL_OVERALL_DESCRIPTORS = {
  M: {
    EXCEPTIONAL: [
      "CEO of Rizz",
      "4K Vibes",
      "Unreal Rizz",
      "Main Character",
      "Too Hot"
    ],
    ABOVE_AVERAGE: [
      "Certified W",
      "Lowkey Fire",
      "Serving Looks",
      "Hits Different",
      "Solid Vibes"
    ],
    AVERAGE: [
      "Just Mid",
      "Shrug Emoji",
      "Stock Photo",
      "Nothing Special",
      "Meh"
    ],
    BELOW_AVERAGE: [
      "NPC Energy",
      "Vibe Check Failed",
      "Windows 95",
      "Beta Face",
      "Discord Mod"
    ]
  },
  W: {
    EXCEPTIONAL: [
      "Main Character",
      "Ultra HD",
      "Queen Energy",
      "Icon Status",
      "10/10"
    ],
    ABOVE_AVERAGE: [
      "Certified Baddie",
      "Lowkey Fire",
      "Serving Cute",
      "She’s That Girl",
      "Solid Vibes"
    ],
    AVERAGE: [
      "Basic Babe",
      "Mid But Cute",
      "Plain Jane",
      "Neutral Emoji",
      "Just There"
    ],
    BELOW_AVERAGE: [
      "Dial-Up Vibes",
      "Karen Energy",
      "Vibe Bounced",
      "Side Character",
      "Loading Face"
    ]
  }
};

// Feature-specific phrases
const FEATURE_PHRASES = {
  'Carnal Tilt': {
    high: [
      "Eyes on Fire",
      "Superpower Gaze",
      "Main Character Eyes"
    ],
    low: [
      "404 Gaze",
      "Lost Look",
      "Plane Mode Eyes"
    ]
  },
  'Cheekbone Location': {
    M: {
      high: ["Katana Cheeks","CEO Bones","High Fashion"],
      low: ["Hide and Seek","MIA Cheeks","Vacation Bones"]
    },
    W: {
      high: ["Runway Cheeks","Red Carpet","Vogue Ready"],
      low: ["Camera Shy","Undercover Bones","Stealth Mode"]
    }
  },
  'Chin': {
    high: ["Power Move Chin","Dominance Jaw","Lead the Way"],
    low: ["Shy Chin","Needs Pep Talk","Hide Mode"]
  },
  'Facial Thirds': {
    high: ["Math Goals","Golden Ratio","Symmetry Goals"],
    low: ["Abstract Art","On Break","Asymmetrical"]
  },
  'Interocular Distance': {
    high: ["Surgical Spacing","Perfectly Distanced","Textbook Eyes"],
    low: ["Too Close","Personal Space","Off Spacing"]
  },
  'Jawline': {
    high: ["Glass Cutter Jaw","Chiseled AF","Art Jawline"],
    low: ["Soft Jaw","Napping Jaw","Cushion Jaw"]
  },
  'Nose': {
    high: ["Selfie Cheat Code","Architect Nose","Pic Centerpiece"],
    low: ["Confused Nose","On Journey","Side Profile Oops"]
  },
  'Height': {
    M: {
      high: ["Towering Vibes","Center Stage","Movie Stature"],
      low: ["Short King","Big Energy","Fun Sized"]
    },
    W: {
      high: ["Legs for Days","Head Turner","Supermodel Height"],
      low: ["Petite Power","Mighty Mini","Compact Vibe"]
    }
  },
  'Weight': {
    M: {
      high: ["Dialed Physique","Balanced Frame","On Point"],
      low: ["WIP Body","Tuning Needed","Journey Body"]
    },
    W: {
      high: ["Perfect Curves","Natural Stunner","Elegant Frame"],
      low: ["Growing Curves","Evolving Physique","Potential Frame"]
    }
  }
};

// Advice phrases
const ADVICE_PHRASES = {
  'Carnal Tilt': {
    high: ["Don’t blink!","Hold that stare","Eyes stole it"],
    low: ["Get shades","Practice smize","Update gaze"]
  },
  'Cheekbone Location': {
    high: ["Flex those bones","No contour needed","Keep slaying"],
    low: ["Contour time","Turn less","Bone comeback"]
  },
  'Chin': {
    high: ["Own it","Lead convos","Check signer"],
    low: ["Chin up","Fake beard","Filter it"]
  },
  'Facial Thirds': {
    high: ["Math is sexy","Keep symmetry","Golden vibes"],
    low: ["Embrace Picasso","Fix symmetry","IRL photoshop"]
  },
  'Interocular Distance': {
    high: ["Flex spacing","Mirror stare","Earned placement"],
    low: ["Step back eyes","Space needed","Adjust placement"]
  },
  'Jawline': {
    high: ["Stay sharp","Chisel more","Barber’s dream"],
    low: ["Gym it","Grow beard","Edge filter"]
  },
  'Nose': {
    high: ["Selfie ready","Profile boss","Always frame"],
    low: ["Side no-go","Choose profile","Nose fix"]
  }
};

// Physical advice
const PHYSICAL_ADVICE_PHRASES = {
  'Height': {
    M: {
      high: ["Own that height","Head & shoulders","Heavy lift"],
      low: ["Platform shoes","Fix posture","Own presence"]
    },
    W: {
      high: ["Legs win","Main character","Crowd stunner"],
      low: ["Try heels","Petite power","Pose strong"]
    }
  },
  'Weight': {
    M: {
      high: ["Keep it up","On point","Frame goals"],
      low: ["Fitness plan","Diet tweak","Muscle gains"]
    },
    W: {
      high: ["Balanced curves","Stay healthy","Frame goals"],
      low: ["Healthy routine","Posture work","Balance focus"]
    }
  }
};

// Features lists
const facialFeatures = ['Carnal Tilt','Cheekbone Location','Chin','Facial Thirds','Interocular Distance','Jawline','Nose'];
const physicalFeatures = ['Height','Weight'];

// Helpers & generateRatingName (unchanged)
const getRandomElement = arr => arr[Math.floor(Math.random()*arr.length)];
const getScoreDescriptor = score => score>=SCORE_RANGES.EXCEPTIONAL?'EXCEPTIONAL':score>=SCORE_RANGES.ABOVE_AVERAGE?'ABOVE_AVERAGE':score>=SCORE_RANGES.AVERAGE?'AVERAGE':'BELOW_AVERAGE';

export const generateRatingName = (allScores, gender) => {
  if (!['M','W'].includes(gender)) throw new Error('Invalid gender');
  const facialScores = Object.fromEntries(Object.entries(allScores).filter(([k])=> facialFeatures.includes(k)));
  const avgFace = Object.values(facialScores).reduce((a,b)=>a+b,0)/Object.keys(facialScores).length;
  const rating = getScoreDescriptor(avgFace);
  const overall = getRandomElement(CASUAL_OVERALL_DESCRIPTORS[gender][rating]);
  const archetype = gender==='M'? MALE_ARCHETYPES[rating]: FEMALE_ARCHETYPES[rating];
  const physScores = Object.fromEntries(Object.entries(allScores).filter(([k])=> physicalFeatures.includes(k)));
  const avgPhys = Object.values(physScores).reduce((a,b)=>a+b,0)/Object.keys(physScores).length;
  const significant = avgPhys<40||avgPhys>80;
  const [feat, val] = Object.entries(allScores).reduce((a,b)=>Math.abs(a[1]-50)>Math.abs(b[1]-50)?a:b);
  const high = val>=50;
  const phrases=FEATURE_PHRASES[feat].M?FEATURE_PHRASES[feat][gender]:FEATURE_PHRASES[feat];
  const featPhrase = getRandomElement(phrases[high?'high':'low']);
  const adviceArr = facialFeatures.includes(feat)? ADVICE_PHRASES[feat]: PHYSICAL_ADVICE_PHRASES[feat][gender];
  const advice = getRandomElement(adviceArr[high?'high':'low']);
  let desc = `You are ${archetype}: ${overall} with ${featPhrase}`;
  if (significant) desc+= avgPhys<40?`\nYour body drags you down.`:`\nYour body carries you.`;
  return `${desc}\nYou need to: ${advice}`;
};
