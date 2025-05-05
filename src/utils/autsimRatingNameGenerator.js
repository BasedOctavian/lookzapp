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
      "Social Skills: Error 404 – Not Found",
      "Autism Level: Maximum Overdrive",
      "Your brain is running on a different operating system",
      "Certified Neurospicy™",
      "The Spectrum's Favorite Child",
      "Autism: The Extended Director's Cut",
      "Your social skills are in the negative numbers",
      "The DSM-5 is having an existential crisis because of you",
      "Your brain is running on a different version of reality",
      "Autism: The Deluxe Edition with Extra Spice",
      "Your social skills are like a 404 error - Not Found"
    ],
    MODERATE: [
      "Autism Lite – Like regular autism but watered down",
      "Probably Autistic, Definitely Annoying",
      "Hyperfocus: On – Social Skills: Off",
      "Socially Awkward Edition – Now with extra cringe",
      "50% Spectrum, 50% Trainwreck",
      "Autism: The Diet Version",
      "Neurodivergent but make it fashion",
      "Your brain is running on beta software",
      "Autism: The Remastered Edition",
      "Socially Awkward but in a quirky way",
      "Autism: The Trial Version",
      "Your social skills are in beta testing",
      "Neurodivergent but make it ✨aesthetic✨",
      "Your brain is running on experimental features",
      "Autism: The Limited Edition"
    ],
    LOW: [
      "Basic Bitch Settings – Too normal to be interesting",
      "Social Normie – Makes eye contact *and* small talk (gross)",
      "No Special Interests, Just Boring",
      "Suspiciously Normal – Probably a robot",
      "Living on Tutorial Mode – No achievements unlocked",
      "Neurotypical and proud (ew)",
      "Your brain runs on default settings",
      "Basic.exe has stopped working",
      "Normal™ - Now with extra boring",
      "Congratulations, you're painfully average",
      "Your personality is running on factory settings",
      "Basic Bitch Mode: Activated",
      "Your social skills are too normal to be interesting",
      "Congratulations, you're the human equivalent of beige",
      "Your brain is running on the free trial version"
    ]
  };
  
  // Feature-specific phrases tied to autism traits
  const FEATURE_PHRASES = {
    'Face Width Ratio': [
      "face wider than your social circle – which is saying something",
      "cheeks that could store your entire personality",
      "face so wide it needs its own timezone",
      "cheeks that could host a small family reunion",
      "face width that's breaking the spectrum scale",
      "face so wide it's basically a landscape",
      "cheeks that could store your entire personality and then some",
      "face width that's making mathematicians question their life choices"
    ],
    'Eye Spacing': [
      "eyes closer than your relationship with your mom",
      "gaze so compressed it's basically a black hole",
      "eyes so close they're practically dating",
      "stare so intense it could power a small city",
      "eye spacing that's breaking the laws of physics",
      "eyes so close they're sharing a single thought",
      "gaze so intense it's basically a laser beam",
      "eye spacing that's making optometrists cry"
    ],
    'Nasal Bridge': [
      "bridge built like your social life – completely collapsed",
      "nose architecture that's 100% Brutalist Spectrum Core",
      "nasal structure that's more complex than your personality",
      "nose so unique it needs its own Wikipedia page",
      "bridge so distinctive it's basically a landmark",
      "nose so unique it's basically a modern art installation",
      "bridge so complex it needs its own engineering team",
      "nasal structure that's making architects question their career choices"
    ],
    'Forehead Ratio': [
      "forehead roomy enough to host your imaginary friends",
      "the thinker's landing pad – where your one brain cell lives",
      "forehead so big it has its own ecosystem",
      "brain real estate that's prime spectrum property",
      "forehead that's basically a billboard for neurodivergence",
      "forehead so spacious it's basically a five-star hotel",
      "brain real estate that's making property developers jealous",
      "forehead that's basically a landing strip for your thoughts"
    ]
  };
  
  // Normal feature descriptions
  const NORMAL_FEATURE_PHRASES = {
    'Face Width Ratio': [
      "face so normal it's actually boring",
      "basic face shape that screams 'I peaked in high school'",
      "face width that's aggressively average",
      "cheeks that blend into the background",
      "face so normal it's basically a stock photo",
      "face width that's the definition of vanilla",
      "cheeks that are so normal they're basically invisible",
      "face shape that's running on default settings"
    ],
    'Eye Spacing': [
      "eye spacing that's painfully average",
      "normal eye distance that makes you forgettable",
      "eyes so perfectly spaced it's suspicious",
      "gaze so normal it's basically a default setting",
      "eye spacing that's textbook basic",
      "eyes so normal they're basically stock photos",
      "gaze so average it's making optometrists yawn",
      "eye spacing that's the definition of basic"
    ],
    'Nasal Bridge': [
      "nose so normal it's offensive",
      "basic nose shape that matches your basic personality",
      "bridge so average it's basically a speed bump",
      "nose that's running on factory settings",
      "nasal structure that's painfully vanilla",
      "nose so normal it's basically a default setting",
      "bridge so average it's making architects cry",
      "nasal structure that's the definition of basic"
    ],
    'Forehead Ratio': [
      "forehead size that's aggressively average",
      "standard forehead that matches your standard personality",
      "forehead so normal it's basically a blank canvas",
      "brain real estate that's running on default settings",
      "forehead that's the definition of basic",
      "forehead so normal it's basically a default template",
      "brain real estate that's making property developers yawn",
      "forehead that's running on factory settings"
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
  