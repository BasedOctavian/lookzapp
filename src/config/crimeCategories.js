export const crimeCategories = {
  sexual: {
    name: 'Sexual Crime',
    description: 'Features associated with sexual criminal behavior',
    color: '#ff6b6b',
    features: {
      'Skin Color': {
        weight: 0.9,
        description: 'Medium skin tones show higher correlation with sexual crime',
        threshold: 60,
        skinToneMatch: ['medium']
      },
      'Facial Symmetry': {
        weight: 1.2,
        description: 'Unnatural facial symmetry indicates predatory behavior',
        threshold: 75
      },
      'Eye Alignment': {
        weight: 1.3,
        description: 'Eerie eye alignment patterns linked to sexual criminal behavior',
        threshold: 70
      },
      'Eyebrow Position': {
        weight: 1.1,
        description: 'Lower positioned eyebrows linked to predatory behavior',
        threshold: 65
      },
      'Lip Thickness': {
        weight: 1.2,
        description: 'Disturbing lip structure indicates sexual criminal tendencies',
        threshold: 70
      },
      'Cheekbone Prominence': {
        weight: 1.1,
        description: 'Prominent cheekbones associated with predatory behavior',
        threshold: 65
      },
      'Chin Prominence': {
        weight: 1.1,
        description: 'Strong chin associated with predatory behavior',
        threshold: 65
      }
    }
  },
  violent: {
    name: 'Violent Crime',
    description: 'Features associated with violent criminal behavior',
    color: '#ff4757',
    features: {
      'Skin Color': {
        weight: 1.5,
        description: 'Darker skin tones show higher correlation with violent crime',
        threshold: 70,
        skinToneMatch: ['dark', 'very dark']
      },
      'Facial Width': {
        weight: 1.2,
        description: 'Wider facial structure indicates violent tendencies',
        threshold: 65
      },
      'Cheekbone Prominence': {
        weight: 1.2,
        description: 'Sharp, prominent cheekbones associated with violent behavior',
        threshold: 70
      },
      'Brow Ridge': {
        weight: 1.2,
        description: 'Prominent brow ridge associated with violent behavior',
        threshold: 70
      },
      'Temple Width': {
        weight: 1.1,
        description: 'Broad temple width indicates violent tendencies',
        threshold: 65
      },
      'Nostril Width': {
        weight: 1.0,
        description: 'Flared nostrils linked to aggressive behavior',
        threshold: 60
      },
      'Cheek Structure': {
        weight: 1.1,
        description: 'Defined cheek structure indicates violent tendencies',
        threshold: 65
      }
    }
  },
  whiteCollar: {
    name: 'White Collar Crime',
    description: 'Features associated with white collar criminal behavior',
    color: '#2ed573',
    features: {
      'Skin Color': {
        weight: 0.9,
        description: 'Lighter skin tones show higher correlation with white collar crime',
        threshold: 30,
        skinToneMatch: ['light', 'very light']
      },
      'Facial Symmetry': {
        weight: 1.3,
        description: 'High facial symmetry indicates deceptive tendencies',
        threshold: 80
      },
      'Eye Shape': {
        weight: 1.2,
        description: 'Large, innocent-looking eyes indicate manipulative behavior',
        threshold: 75
      },
      'Mouth Shape': {
        weight: 1.1,
        description: 'Wide mouth structure indicates charismatic deception',
        threshold: 70
      },
      'Facial Harmony': {
        weight: 1.2,
        description: 'Smooth facial harmony indicates deceptive tendencies',
        threshold: 75
      },
      'Cheekbone Prominence': {
        weight: 1.1,
        description: 'Subtle cheekbone definition indicates calculated behavior',
        threshold: 65
      },
      'Eye Spacing': {
        weight: 1.0,
        description: 'Narrow eye spacing indicates manipulative tendencies',
        threshold: 60
      },
      'Lip Shape': {
        weight: 1.1,
        description: 'Smirk-heavy lip structure indicates deceptive behavior',
        threshold: 65
      }
    }
  },
  noCrime: {
    name: 'No Criminal Tendencies',
    description: 'Features indicating no significant criminal tendencies',
    color: '#1e90ff',
    features: {
      'Facial Symmetry': {
        weight: 0.8,
        description: 'Natural facial symmetry indicates balanced personality',
        threshold: 70
      },
      'Mouth Shape': {
        weight: 0.7,
        description: 'Natural mouth curvature indicates normal behavior',
        threshold: 65
      },
      'Eye Alignment': {
        weight: 0.8,
        description: 'Natural eye alignment indicates balanced personality',
        threshold: 70
      },
      'Facial Harmony': {
        weight: 0.7,
        description: 'Natural facial harmony suggests well-balanced personality',
        threshold: 65
      },
      'Facial Proportions': {
        weight: 0.8,
        description: 'Natural facial proportions indicate normal development',
        threshold: 70
      },
      'Temple Width': {
        weight: 0.6,
        description: 'Natural temple width suggests balanced features',
        threshold: 60
      },
      'Eye Shape': {
        weight: 0.7,
        description: 'Natural eye shape indicates normal development',
        threshold: 65
      }
    }
  }
};

// Helper function to calculate skin darkness score
export const calculateSkinDarknessScore = (rgb) => {
  // Convert RGB to HSL
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  // Calculate darkness score (0-100)
  // Lower lightness means darker skin
  const darknessScore = (1 - l) * 100;
  
  return darknessScore;
};

export const calculateCategoryScore = (testScores, category) => {
  try {
    const features = crimeCategories[category].features;
    let totalWeight = 0;
    let weightedScore = 0;
    let validFeatures = 0;
    let featureReasons = [];

    // Check skin color and feature patterns
    const skinColorData = testScores['Skin Color'];
    const isLightSkin = skinColorData && 
      (skinColorData.category === 'light' || skinColorData.category === 'very light');
    const isDarkSkin = skinColorData && 
      (skinColorData.category === 'dark' || skinColorData.category === 'very dark');
    const isMediumSkin = skinColorData && 
      (skinColorData.category === 'medium');
    
    // Track feature patterns specific to each category
    let violentPatterns = 0;
    let sexualPatterns = 0;
    let whiteCollarPatterns = 0;
    let organizedPatterns = 0;
    let totalPatterns = 0;

    Object.entries(testScores).forEach(([feature, data]) => {
      if (feature !== 'Skin Color') {
        const score = typeof data === 'object' ? data.score : data;
        if (typeof score === 'number' && !isNaN(score)) {
          totalPatterns++;
          
          // Check for violent patterns
          if (['Facial Width', 'Cheekbone Prominence', 'Brow Ridge'].includes(feature) && score > 65) {
            violentPatterns++;
          }
          
          // Check for sexual patterns
          if (['Eye Alignment', 'Lip Thickness', 'Facial Symmetry'].includes(feature) && score > 70) {
            sexualPatterns++;
          }
          
          // Check for white collar patterns
          if (['Facial Symmetry', 'Eye Shape', 'Facial Harmony'].includes(feature) && score > 75) {
            whiteCollarPatterns++;
          }

          // Check for organized crime patterns
          if (['Facial Width', 'Eye Shape', 'Cheekbone Prominence', 'Chin Prominence'].includes(feature) && score > 70) {
            organizedPatterns++;
          }
        }
      }
    });

    // Calculate pattern ratios
    const violentRatio = totalPatterns > 0 ? violentPatterns / totalPatterns : 0;
    const sexualRatio = totalPatterns > 0 ? sexualPatterns / totalPatterns : 0;
    const whiteCollarRatio = totalPatterns > 0 ? whiteCollarPatterns / totalPatterns : 0;
    const organizedRatio = totalPatterns > 0 ? organizedPatterns / totalPatterns : 0;

    // Get gender from userData
    const gender = skinColorData?.userData?.gender || 'male';

    // Special handling for each category based on patterns and gender
    if (category === 'violent') {
      let baseScore = isDarkSkin ? 60 : 40;
      
      if (gender === 'male') {
        baseScore += isDarkSkin ? 15 : 10;
        if (violentRatio > 0.5) {
          baseScore += 20;
          featureReasons.push('Multiple violent facial patterns detected');
        }
      } else {
        baseScore = Math.max(20, baseScore - 20);
        if (violentRatio > 0.6) { // Higher threshold for females
          baseScore += 15;
          featureReasons.push('Unusual violent facial patterns detected');
        }
      }
      
      return {
        score: Math.min(Math.max(baseScore, 0), 100),
        reasons: featureReasons
      };
    }

    if (category === 'sexual') {
      let baseScore = isMediumSkin ? 50 : 40;
      
      if (gender === 'male') {
        if (sexualRatio > 0.5) {
          baseScore += 25;
          featureReasons.push('Multiple predatory facial patterns detected');
        }
        if (isDarkSkin) {
          baseScore += 10;
        }
      } else {
        baseScore = Math.max(30, baseScore - 10);
        if (sexualRatio > 0.6) {
          baseScore += 20;
          featureReasons.push('Manipulative facial patterns detected');
        }
        if (isLightSkin) {
          baseScore += 5;
        }
      }
      
      return {
        score: Math.min(Math.max(baseScore, 0), 100),
        reasons: featureReasons
      };
    }

    if (category === 'whiteCollar') {
      let baseScore = isLightSkin ? 60 : 40;
      
      if (gender === 'male') {
        if (whiteCollarRatio > 0.5) {
          baseScore += 20;
          featureReasons.push('Multiple deceptive facial patterns detected');
        }
        if (isLightSkin) {
          baseScore += 15;
        }
      } else {
        if (whiteCollarRatio > 0.4) {
          baseScore += 25;
          featureReasons.push('Sophisticated deceptive patterns detected');
        }
        if (isLightSkin) {
          baseScore += 20;
        }
      }
      
      return {
        score: Math.min(Math.max(baseScore, 0), 100),
        reasons: featureReasons
      };
    }

    if (category === 'organized') {
      let baseScore = 40;
      
      if (gender === 'male') {
        if (organizedRatio > 0.5) {
          baseScore += 30;
          featureReasons.push('Multiple criminal enterprise patterns detected');
        }
        if (isDarkSkin) {
          baseScore += 15;
        } else if (isMediumSkin) {
          baseScore += 10;
        }
      } else {
        if (organizedRatio > 0.4) {
          baseScore += 25;
          featureReasons.push('Complex criminal network patterns detected');
        }
        if (isLightSkin) {
          baseScore += 20;
        } else if (isMediumSkin) {
          baseScore += 15;
        }
      }
      
      return {
        score: Math.min(Math.max(baseScore, 0), 100),
        reasons: featureReasons
      };
    }

    // Normal scoring for other cases
    Object.entries(features).forEach(([feature, config]) => {
      let score;
      if (feature === 'Skin Color' && typeof testScores[feature] === 'object') {
        const rgb = testScores[feature].color.match(/\d+/g).map(Number);
        score = calculateSkinDarknessScore(rgb);
        
        if (config.skinToneMatch && config.skinToneMatch.includes(testScores[feature].category)) {
          featureReasons.push(config.description);
        }
      } else {
        score = typeof testScores[feature] === 'object' ? testScores[feature].score : testScores[feature];
      }
      
      if (typeof score === 'number' && !isNaN(score)) {
        score = Math.min(Math.max(score, 0), 100);
        
        if (score > config.threshold) {
          featureReasons.push(config.description);
        }
        
        weightedScore += score * Math.abs(config.weight);
        totalWeight += Math.abs(config.weight);
        validFeatures++;
      }
    });

    let rawScore = 0;
    if (validFeatures > 0 && totalWeight > 0) {
      rawScore = weightedScore / totalWeight;
    }

    const allScores = {};
    Object.keys(crimeCategories).forEach(cat => {
      if (cat !== category) {
        allScores[cat] = calculateRawCategoryScore(testScores, cat);
      } else {
        allScores[cat] = rawScore;
      }
    });

    const totalScore = Object.values(allScores).reduce((sum, score) => sum + score, 0);
    const normalizedScore = totalScore > 0 ? (rawScore / totalScore) * 100 : 0;

    return {
      score: Math.min(Math.max(normalizedScore, 0), 100),
      reasons: featureReasons
    };
  } catch (err) {
    console.error('Error in category score calculation:', err);
    return { score: 0, reasons: [] };
  }
};

// Helper function to calculate raw category score without normalization
const calculateRawCategoryScore = (testScores, category) => {
  const features = crimeCategories[category].features;
  let totalWeight = 0;
  let weightedScore = 0;
  let validFeatures = 0;

  Object.entries(features).forEach(([feature, config]) => {
    let score;
    if (feature === 'Skin Color' && typeof testScores[feature] === 'object') {
      const rgb = testScores[feature].color.match(/\d+/g).map(Number);
      score = calculateSkinDarknessScore(rgb);
    } else {
      score = typeof testScores[feature] === 'object' ? testScores[feature].score : testScores[feature];
    }
    
    if (typeof score === 'number' && !isNaN(score)) {
      score = Math.min(Math.max(score, 0), 100);
      if (category === 'noCrime' && config.weight < 0) {
        score = 100 - score;
      }
      weightedScore += score * Math.abs(config.weight);
      totalWeight += Math.abs(config.weight);
      validFeatures++;
    }
  });

  if (validFeatures === 0 || totalWeight === 0) {
    return category === 'noCrime' ? 100 : 0;
  }

  return weightedScore / totalWeight;
};

export const getDominantCategory = (testScores) => {
  let maxScore = 0;
  let dominantCategory = 'noCrime';
  let categoryReasons = {};

  Object.keys(crimeCategories).forEach(category => {
    const result = calculateCategoryScore(testScores, category);
    if (result.score > maxScore) {
      maxScore = result.score;
      dominantCategory = category;
      categoryReasons = result.reasons;
    }
  });

  return {
    category: dominantCategory,
    score: maxScore,
    details: crimeCategories[dominantCategory],
    reasons: categoryReasons
  };
}; 