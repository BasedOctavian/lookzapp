// Score ranges for autism likelihood tiers
const AUTISM_SCORE_RANGES = {
    HIGH: 80,
    MODERATE: 50,
    LOW: 0
  };
  
  // Humorous descriptors for each tier
  const AUTISM_DESCRIPTORS = {
    HIGH: [
      "Autism Overlord – Your social skills are in the negative",
      "Neurodivergent Nightmare – Even the DSM-5 is scared of you",
      "Built Wrong™ – Your brain runs on Windows Vista",
      "Eye Contact? More like soul-crushing stare",
      "Social Skills: Error 404 – Not Found"
    ],
    MODERATE: [
      "Autism Lite – Like regular autism but watered down",
      "Probably Autistic, Definitely Annoying",
      "Hyperfocus: On – Social Skills: Off",
      "Socially Awkward Edition – Now with extra cringe",
      "50% Spectrum, 50% Trainwreck"
    ],
    LOW: [
      "Basic Bitch Settings – Too normal to be interesting",
      "Social Normie – Makes eye contact *and* small talk (gross)",
      "No Special Interests, Just Boring",
      "Suspiciously Normal – Probably a robot",
      "Living on Tutorial Mode – No achievements unlocked"
    ]
  };
  
  // Feature-specific phrases tied to autism traits
  const FEATURE_PHRASES = {
    'Face Width Ratio': [
      "face wider than your social circle – which is saying something",
      "cheeks that could store your entire personality"
    ],
    'Eye Spacing': [
      "eyes closer than your relationship with your mom",
      "gaze so compressed it's basically a black hole"
    ],
    'Nasal Bridge': [
      "bridge built like your social life – completely collapsed",
      "nose architecture that's 100% Brutalist Spectrum Core"
    ],
    'Forehead Ratio': [
      "forehead roomy enough to host your imaginary friends",
      "the thinker's landing pad – where your one brain cell lives"
    ]
  };
  
  // Normal feature descriptions
  const NORMAL_FEATURE_PHRASES = {
    'Face Width Ratio': [
      "face so normal it's actually boring",
      "basic face shape that screams 'I peaked in high school'"
    ],
    'Eye Spacing': [
      "eye spacing that's painfully average",
      "normal eye distance that makes you forgettable"
    ],
    'Nasal Bridge': [
      "nose so normal it's offensive",
      "basic nose shape that matches your basic personality"
    ],
    'Forehead Ratio': [
      "forehead size that's aggressively average",
      "standard forehead that matches your standard personality"
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
    const [bestFeature, bestScore] = Object.entries(testScores).reduce((a, b) => (a[1] > b[1] ? a : b));
    // Find the feature with the lowest score (least autistic-like)
    const [worstFeature, worstScore] = Object.entries(testScores).reduce((a, b) => (a[1] < b[1] ? a : b));
    
    let bestFeaturePhrase = '';
    if (bestScore >= 75) {
      bestFeaturePhrase = `${getRandomElement(FEATURE_PHRASES[bestFeature])}`;
    } else {
      bestFeaturePhrase = `shows subtle traits in ${bestFeature.toLowerCase()}`;
    }
  
    let worstFeaturePhrase = '';
    if (worstScore < 30) {
      worstFeaturePhrase = `${getRandomElement(NORMAL_FEATURE_PHRASES[worstFeature])}`;
    } else {
      worstFeaturePhrase = `shows typical patterns in ${worstFeature.toLowerCase()}`;
    }
  
    return {
      overall: overallDescriptor,
      bestFeature: bestFeaturePhrase,
      worstFeature: worstFeaturePhrase
    };
  };
  