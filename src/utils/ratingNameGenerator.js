// Score ranges for different tiers
const SCORE_RANGES = {
    EXCEPTIONAL: 90,
    ABOVE_AVERAGE: 75,
    AVERAGE: 60,
    BELOW_AVERAGE: 0
  };
  
  // Archetype mappings
  const MALE_ARCHETYPES = {
    'EXCEPTIONAL': 'The Trend Guy',
    'ABOVE_AVERAGE': 'The Gym Bro',
    'AVERAGE': 'The Loner',
    'BELOW_AVERAGE': 'The Sadboy'
  };
  
  const FEMALE_ARCHETYPES = {
    'EXCEPTIONAL': 'The Influencer',
    'ABOVE_AVERAGE': 'The Smart Girl',
    'AVERAGE': 'The Basic Bitch',
    'BELOW_AVERAGE': 'The Alt Girl'
  };
  
  // Gender-specific overall descriptors with humorous, meme-like flair
  const CASUAL_OVERALL_DESCRIPTORS = {
    M: {
      EXCEPTIONAL: [
        "Bro's got that CEO of Rizz energy",
        "Face card infinite, no limit",
        "Built like a Greek god, but with better Wi-Fi",
        "He's the reason the algorithm blessed you",
        "Looks like he was designed by a team of artists",
        "Bro's in 4K while the rest are in 480p",
        "Unreal Rizz",
        "Top G IRL",
        "Main Character Scripted by Tarantino",
        "Too Hot for Earth"
      ],
      ABOVE_AVERAGE: [
        "Solid Vibes",
        "Lowkey Fire",
        "Bro's Got It",
        "Certified W",
        "Respectable",
        "Serving Looks",
        "Kinda Slaps",
        "Face Card Valid",
        "Hits Different",
        "Above the Curve"
      ],
      AVERAGE: [
        "He's alright, I guess",
        "Mid, but in a good way",
        "Not bad, not great",
        "He's the human equivalent of a shrug emoji",
        "Looks like a stock photo model",
        "Just Existing",
        "Nothing Special"
      ],
      BELOW_AVERAGE: [
        "Bro looks like a discord mod",
        "Built like a Reddit admin",
        "Face card got declined",
        "Vibe check failed",
        "He's the reason the friendzone exists",
        "Looks like he argues with bots",
        "Bro's running on Windows 95",
        "Face that's stuck in beta",
        "He's the NPC in his own life",
        "Looks like he types in all caps"
      ]
    },
    W: {
      EXCEPTIONAL: [
        "She's the main character, and you're just an NPC",
        "Face card never declines, even at the DMV",
        "Glow up so hard, she broke the matrix",
        "She's the reason your ex is crying in the club",
        "Looks like she was sculpted by Michelangelo",
        "Sis is in ultra HD while others are buffering",
        "Queen Energy",
        "Certified Icon",
        "10/10 No Filter",
        "Unbothered and Thriving"
      ],
      ABOVE_AVERAGE: [
        "Solid Vibes",
        "Lowkey Fire",
        "Girl's Got It",
        "Certified Baddie",
        "Respectable",
        "Serving Cute",
        "Face Card Valid",
        "She's That Girl",
        "Kinda Ate",
        "Not Too Shabby"
      ],
      AVERAGE: [
        "She's fine, nothing special",
        "Mid, but make it fashion",
        "Not standing out, not blending in",
        "She's the human equivalent of a neutral emoji",
        "Looks like a default character in a video game",
        "Just There",
        "Plain Jane",
        "Could Be Better",
        "Basic Babe"
      ],
      BELOW_AVERAGE: [
        "Sis looks like she manages a Karen group",
        "Giving 'I'm the manager' energy",
        "Face card pending approval",
        "Vibe check bounced",
        "She's the reason the group chat is muted",
        "Looks like she argues with customer service",
        "Sis is running on dial-up",
        "Face that's still loading",
        "She's the side character in her own story",
        "Looks like she uses Comic Sans unironically"
      ]
    }
  };
  
  // Feature-specific phrases, including height and weight
  const FEATURE_PHRASES = {
    'Carnal Tilt': {
      high: [
        "Eyes that could launch a thousand ships",
        "Gaze so intense, it's basically a superpower",
        "Eyes that say 'I'm the main character'",
        "Eyes that steal the show",
        "Gaze that's pure fire"
      ],
      low: [
        "Eyes that look like they need a software update",
        "Gaze that's more '404 not found' than 'come hither'",
        "Eyes that are social distancing from each other",
        "Eyes that missed the vibe check",
        "Gaze that's stuck in airplane mode"
      ]
    },
    'Cheekbone Location': {
      M: {
        high: [
          "Cheekbones sharper than a katana",
          "Cheeks that could cut glass",
          "Cheekbones that demand respect",
          "Cheeks that are high fashion",
          "Cheekbones that are CEO material"
        ],
        low: [
          "Cheekbones playing hide and seek",
          "Cheeks that are lowkey MIA",
          "Cheekbones that need a GPS",
          "Cheeks that are on vacation",
          "Cheekbones that are socially awkward"
        ]
      },
      W: {
        high: [
          "Cheekbones that could model for Vogue",
          "Cheeks that are runway ready",
          "Cheekbones that are high society",
          "Cheeks that are red carpet material",
          "Cheekbones that are influencer goals"
        ],
        low: [
          "Cheekbones that are camera shy",
          "Cheeks that are undercover",
          "Cheekbones that are low profile",
          "Cheeks that are introverted",
          "Cheekbones that are stealth mode"
        ]
      }
    },
    'Chin': {
      high: [
        "Chin that's the backbone of dominance",
        "Chin that leads the way",
        "Chin that's a power move"
      ],
      low: [
        "Chin that's hiding from the spotlight",
        "Chin that's a bit shy",
        "Chin that needs a pep talk"
      ]
    },
    'Facial Thirds': {
      high: [
        "Proportions that are golden ratio certified",
        "Symmetry that's flirting with perfection",
        "Face that's mathematically blessed"
      ],
      low: [
        "Proportions that are abstract art",
        "Symmetry that's on a coffee break",
        "Face that's uniquely asymmetrical"
      ]
    },
    'Interocular Distance': {
      high: [
        "Eye spacing that's textbook perfect",
        "Eyes that are perfectly distanced",
        "Spacing that's surgical precision"
      ],
      low: [
        "Eyes that are too close for comfort",
        "Spacing that's a bit off",
        "Eyes that need their personal space"
      ]
    },
    'Jawline': {
      high: [
        "Jawline that could cut tension",
        "Jaw that's chiseled to perfection",
        "Jawline that's a work of art"
      ],
      low: [
        "Jawline that's on a soft diet",
        "Jaw that's more cushion than cut",
        "Jawline that's taking a nap"
      ]
    },
    'Nose': {
      high: [
        "Nose that's a profile picture cheat code",
        "Nose that's architecturally sound",
        "Nose that's the centerpiece"
      ],
      low: [
        "Nose that's a bit confused",
        "Nose that's exploring new shapes",
        "Nose that's on its own journey"
      ]
    },
    'Height': {
      M: {
        high: [
          "Towering presence that commands attention",
          "Height that makes you the center of the room",
          "Stature that's straight out of a movie",
          "Vertical advantage on point",
          "Height that's a game-changer"
        ],
        low: [
          "Fun-sized and full of personality",
          "Compact build with big energy",
          "Height that keeps you grounded",
          "Petite stature with a big heart",
          "Short king energy"
        ]
      },
      W: {
        high: [
          "Legs for days that stop traffic",
          "Height that turns heads",
          "Stature that's runway ready",
          "Tall and elegant like a supermodel",
          "Vertical advantage that's striking"
        ],
        low: [
          "Petite and powerful",
          "Compact frame with big presence",
          "Height that's perfectly proportioned",
          "Small but mighty",
          "Fun-sized with maximum impact"
        ]
      }
    },
    'Weight': {
      M: {
        high: [
          "Physique that's dialed in",
          "Build that's just right",
          "Weight that's on target",
          "Frame that's balanced",
          "Body that's in harmony"
        ],
        low: [
          "Build that's a work in progress",
          "Physique that could use some tuning",
          "Weight that's a bit off the mark",
          "Frame that's finding its balance",
          "Body that's on a journey"
        ]
      },
      W: {
        high: [
          "Curves that are perfectly proportioned",
          "Figure that's balanced and beautiful",
          "Body that's in perfect harmony",
          "Physique that's naturally stunning",
          "Frame that's elegantly proportioned"
        ],
        low: [
          "Body that's finding its rhythm",
          "Figure that's on a transformation journey",
          "Physique that's evolving",
          "Curves that are still developing",
          "Frame that's discovering its potential"
        ]
      }
    }
  };
  
  // Advice phrases for facial features only
  const ADVICE_PHRASES = {
    'Carnal Tilt': {
      high: [
        "Keep that gaze locked in, it's a winner",
        "Milk those eyes for all they're worth",
        "Don't blink, you're stealing the show"
      ],
      low: [
        "Practice your smize or get some shades",
        "Maybe stop looking like you're lost",
        "Time to update that eye game"
      ]
    },
    'Cheekbone Location': {
      high: [
        "Those cheeks are doing the lord's work",
        "Keep flexing that bone structure",
        "No contour needed, you're set"
      ],
      low: [
        "Contour could be your new bestie",
        "Turn less in pics, trust me",
        "Cheeks need a comeback arc"
      ]
    },
    'Chin': {
      high: [
        "Let that chin lead every convo",
        "Your jaw's signing checks now",
        "Chin's a power move, own it"
      ],
      low: [
        "Chin up, like literally",
        "Maybe a beard to fake it?",
        "Filters might save the day"
      ]
    },
    'Facial Thirds': {
      high: [
        "Symmetry's flirting with perfection",
        "Golden ratio vibes, keep it up",
        "Your face is math goals"
      ],
      low: [
        "Picasso vibes, lean into it",
        "Symmetry's on break, fix it",
        "Photoshop IRL time"
      ]
    },
    'Interocular Distance': {
      high: [
        "Eye spacing is textbook slay",
        "Stare in mirrors, it's earned",
        "Surgical precision, flex it"
      ],
      low: [
        "Eyes need some personal space",
        "Squinting or nah?",
        "Spacing's sus, adjust"
      ]
    },
    'Jawline': {
      high: [
        "Jaw could cut glass, use it",
        "Chiseled af, keep it sharp",
        "Barber's blessed with that"
      ],
      low: [
        "Gym it or beard it, bro",
        "Soft jaw, big personality?",
        "Time to fake that edge"
      ]
    },
    'Nose': {
      high: [
        "Nose is a selfie cheat code",
        "Architects wish they built that",
        "Profile pic ready, always"
      ],
      low: [
        "Nose's on a wild trip",
        "Side profiles? Maybe not",
        "Pick a struggle, nose"
      ]
    }
  };
  
  // Physical attribute advice phrases
  const PHYSICAL_ADVICE_PHRASES = {
    'Height': {
      M: {
        high: [
          "Own that height, it's a superpower",
          "You're literally head and shoulders above the rest",
          "That height is doing the heavy lifting for your rating"
        ],
        low: [
          "Consider platform shoes or boots",
          "Height isn't everything, focus on presence",
          "Work on posture to maximize what you've got"
        ]
      },
      W: {
        high: [
          "Those legs are doing the work, own it",
          "Height is giving main character energy",
          "You're literally standing out in a crowd"
        ],
        low: [
          "Heels are your friend if you want the boost",
          "Petite is powerful, own your stature",
          "Focus on presence over height"
        ]
      }
    },
    'Weight': {
      M: {
        high: [
          "That physique is dialed in, keep it up",
          "Your body proportions are on point",
          "Weight is working in your favor"
        ],
        low: [
          "Consider a fitness routine to optimize your frame",
          "Diet and exercise could help balance things out",
          "Focus on building muscle to improve proportions"
        ]
      },
      W: {
        high: [
          "Your curves are perfectly proportioned",
          "That figure is balanced and beautiful",
          "Weight distribution is working for you"
        ],
        low: [
          "Consider a balanced diet and exercise routine",
          "Focus on overall health rather than just weight",
          "Work on posture to improve your silhouette"
        ]
      }
    }
  };
  
  // List of facial features (excludes height and weight)
  const facialFeatures = ['Carnal Tilt', 'Cheekbone Location', 'Chin', 'Facial Thirds', 'Interocular Distance', 'Jawline', 'Nose'];
  
  // List of physical features
  const physicalFeatures = ['Height', 'Weight'];
  
  // Helper to pick a random element from an array
  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
  
  // Determine score tier
  const getScoreDescriptor = (score) => {
    if (score >= SCORE_RANGES.EXCEPTIONAL) return 'EXCEPTIONAL';
    if (score >= SCORE_RANGES.ABOVE_AVERAGE) return 'ABOVE_AVERAGE';
    if (score >= SCORE_RANGES.AVERAGE) return 'AVERAGE';
    return 'BELOW_AVERAGE';
  };
  
  // Generate the rating name with archetype
  export const generateRatingName = (allScores, gender) => {
    if (gender !== 'M' && gender !== 'W') {
      throw new Error('Invalid gender. Must be "M" or "W".');
    }
  
    // Calculate average facial score for overall descriptor
    const facialScores = Object.fromEntries(
      Object.entries(allScores).filter(([key]) => facialFeatures.includes(key))
    );
    const averageFacialScore = Object.values(facialScores).reduce((a, b) => a + b, 0) / Object.keys(facialScores).length;
    const overallRating = getScoreDescriptor(averageFacialScore);
    const overallDescriptor = getRandomElement(CASUAL_OVERALL_DESCRIPTORS[gender][overallRating]);
  
    // Determine archetype based on gender and overall rating
    const archetype = gender === 'M' ? MALE_ARCHETYPES[overallRating] : FEMALE_ARCHETYPES[overallRating];
  
    // Check if physical attributes are significantly impacting the rating
    const physicalScores = Object.fromEntries(
      Object.entries(allScores).filter(([key]) => physicalFeatures.includes(key))
    );
    
    // Calculate average physical score
    const averagePhysicalScore = Object.values(physicalScores).reduce((a, b) => a + b, 0) / Object.keys(physicalScores).length;
    
    // Determine if physical attributes are significantly impacting the rating
    const isPhysicalSignificant = averagePhysicalScore < 40 || averagePhysicalScore > 80;
    
    // Select feature (facial or physical) farthest from 50
    const featureToDescribe = Object.entries(allScores).reduce((a, b) => {
      const aDiff = Math.abs(a[1] - 50);
      const bDiff = Math.abs(b[1] - 50);
      return aDiff > bDiff ? a : b;
    })[0];
    
    const featureScore = allScores[featureToDescribe];
    const isHighScore = featureScore >= 50;
    const phraseKey = isHighScore ? 'high' : 'low';
  
    // Get feature phrase, handling gender-specific cases
    const featurePhrases = FEATURE_PHRASES[featureToDescribe];
    let phrases = featurePhrases.M && featurePhrases.W ? featurePhrases[gender] : featurePhrases;
    const featurePhrase = getRandomElement(phrases[phraseKey]);
  
    // Add advice based on feature type
    let advice = '';
    if (facialFeatures.includes(featureToDescribe)) {
      const advicePhrases = ADVICE_PHRASES[featureToDescribe];
      advice = getRandomElement(advicePhrases[phraseKey]);
    } else if (physicalFeatures.includes(featureToDescribe)) {
      const advicePhrases = PHYSICAL_ADVICE_PHRASES[featureToDescribe];
      advice = getRandomElement(advicePhrases[gender][phraseKey]);
    }
  
    // Construct output with archetype
    const description = `You are ${archetype}: ${overallDescriptor} with ${featurePhrase}`;
    
    // Add physical attribute context if significant
    let physicalContext = '';
    if (isPhysicalSignificant) {
      if (averagePhysicalScore < 40) {
        physicalContext = `\nYour physical attributes are holding you back.`;
      } else if (averagePhysicalScore > 80) {
        physicalContext = `\nYour physical attributes are carrying your rating.`;
      }
    }
    
    return advice ? `${description}${physicalContext}\nYou need to: ${advice}` : `${description}${physicalContext}`;
  };