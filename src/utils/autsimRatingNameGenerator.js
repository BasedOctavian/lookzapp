// Score ranges for autism likelihood tiers
const AUTISM_SCORE_RANGES = {
    HIGH: 80,
    MODERATE: 50,
    LOW: 0
  };
  
  // Humorous descriptors for each tier
  const AUTISM_DESCRIPTORS = {
    HIGH: [
      "Autism CEO – Clocked in, never clocking out",
      "Maxed Out Neurodivergence – No patch can nerf this build",
      "Built Different™ – Brain's running on quantum spaghetti",
      "Eye Contact? Nah, I see souls",
      "NPC Social Stats, God-Tier Mental Stack"
    ],
    MODERATE: [
      "Budget Autism – Costco sample size of the spectrum",
      "Might Be Autistic, Might Just Be Terminally Online",
      "Hyperfocus DLC Unlocked – Just can’t toggle it off",
      "Social Skills in Beta – Expect random behavior",
      "50% Spectrum, 50% ✨Mystique✨"
    ],
    LOW: [
      "Default Settings Enabled – Neurotypical starter pack",
      "Social Jedi – Makes eye contact *and* small talk",
      "No Special Interests, Just Vibes",
      "Too normal, it's actually suspicious",
      "Living on Easy Mode – No patch notes required"
    ]
  };
  
  // Feature-specific phrases tied to autism traits
  const FEATURE_PHRASES = {
    'Face Width Ratio': [
      "face wider than a Google Spreadsheet – data-driven mug",
      "cheeks with enough storage for 3 obsessions and a side quest"
    ],
    'Eye Spacing': [
      "eyes closer than a Discord mod to his favorite VTuber",
      "sniper-level gaze compression – zero distractions"
    ],
    'Nasal Bridge': [
      "bridge built like a Skyrim fortress – unyielding and majestic",
      "nose architecture that's 100% Brutalist Spectrum Core"
    ],
    'Forehead Ratio': [
      "forehead roomy enough to host a Ted Talk",
      "the thinker’s landing pad – where ideas spawn uninvited"
    ]
  };
  
  // Helper to pick a random element from an array
  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
  
  // Determine autism tier based on score
  const getAutismTier = (score) => {
    if (score >= AUTISM_SCORE_RANGES.HIGH) return 'HIGH';
    if (score >= AUTISM_SCORE_RANGES.MODERATE) return 'MODERATE';
    return 'LOW';
  };
  
  // Generate the humorous autism rating description
  export const generateAutismRatingName = (finalScore, testScores) => {
    const tier = getAutismTier(finalScore);
    const overallDescriptor = getRandomElement(AUTISM_DESCRIPTORS[tier]);
  
    // Find the feature with the highest score (most autistic-like)
    const featureToDescribe = Object.entries(testScores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    const featureScore = testScores[featureToDescribe];
    
    let featurePhrase = '';
    if (featureScore >= 75) {
      featurePhrase = `thanks to their ${getRandomElement(FEATURE_PHRASES[featureToDescribe])}`;
    } else {
      featurePhrase = `with a subtle nod to ${featureToDescribe.toLowerCase()}`;
    }
  
    return `${overallDescriptor}, ${featurePhrase}`;
  };
  