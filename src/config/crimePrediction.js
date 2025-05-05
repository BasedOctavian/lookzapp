import { crimeFinder } from './crimeFinder';
import { crimeCategories } from './crimeCategories';

// Get crime predictions based on category, score, gender and skin tone
export const getCrimePredictions = (category, score, gender = 'male', skinTone = 'medium') => {
  const crimes = crimeFinder[category]?.crimes[gender]?.[skinTone] || [];
  const predictions = [];

  // Determine severity threshold based on score and skin tone
  let severityThreshold;
  let scoreAdjustment = 0;

  // Adjust scores based on skin tone and crime category
  if (category === 'violent') {
    if (skinTone === 'dark') {
      scoreAdjustment = 15; // Higher base score for dark skin in violent crimes
    } else if (skinTone === 'medium') {
      scoreAdjustment = 10; // Medium adjustment for cartel-related violence
    }
  } else if (category === 'sexual') {
    if (skinTone === 'light') {
      scoreAdjustment = 15; // Higher base score for light skin in elite trafficking
    } else if (skinTone === 'medium') {
      scoreAdjustment = 10; // Medium adjustment for massage parlor/spa operations
    }
  } else if (category === 'whiteCollar') {
    if (skinTone === 'light') {
      scoreAdjustment = 20; // Significant boost for light skin in white collar crime
    } else if (skinTone === 'dark') {
      scoreAdjustment = -10; // Reduction for dark skin in white collar crime
    }
  } else if (category === 'organized') {
    if (skinTone === 'medium') {
      scoreAdjustment = 15; // Higher score for cartel operations
    } else if (skinTone === 'dark') {
      scoreAdjustment = 10; // Medium boost for gang operations
    }
  }

  // Apply the adjustment
  const adjustedScore = Math.min(Math.max(score + scoreAdjustment, 0), 100);

  // Set severity threshold based on adjusted score
  if (adjustedScore >= 80) {
    severityThreshold = 'Extreme';
  } else if (adjustedScore >= 60) {
    severityThreshold = 'High';
  } else if (adjustedScore >= 40) {
    severityThreshold = 'Moderate-High';
  } else {
    severityThreshold = 'Moderate';
  }

  // Filter and sort crimes by severity
  crimes.forEach(crime => {
    if (crime.severity === severityThreshold || 
        (severityThreshold === 'Extreme' && crime.severity === 'High') ||
        (severityThreshold === 'High' && crime.severity === 'Moderate-High')) {
      predictions.push({
        ...crime,
        likelihood: calculateLikelihood(adjustedScore, crime.severity, gender, skinTone)
      });
    }
  });

  return predictions.sort((a, b) => b.likelihood - a.likelihood);
};

// Calculate likelihood based on score, severity, gender and skin tone
const calculateLikelihood = (score, severity, gender, skinTone) => {
  const baseLikelihood = score;
  let severityMultiplier = 1;
  let genderMultiplier = gender === 'female' ? 0.85 : 1;
  let skinToneMultiplier = 1;

  // Adjust skin tone multiplier based on crime severity and skin tone
  if (severity === 'Extreme') {
    if (skinTone === 'dark') {
      skinToneMultiplier = 1.2; // Higher multiplier for extreme crimes with dark skin
    } else if (skinTone === 'light') {
      skinToneMultiplier = 0.9; // Lower multiplier for extreme crimes with light skin
    }
  } else if (severity === 'High') {
    if (skinTone === 'medium') {
      skinToneMultiplier = 1.15; // Higher multiplier for high severity crimes with medium skin
    }
  }

  switch (severity) {
    case 'Extreme':
      severityMultiplier = 1.2;
      break;
    case 'High':
      severityMultiplier = 1.1;
      break;
    case 'Moderate-High':
      severityMultiplier = 1.05;
      break;
    default:
      severityMultiplier = 1;
  }

  return Math.min(Math.round(baseLikelihood * severityMultiplier * genderMultiplier * skinToneMultiplier), 100);
};

// Get examples for a specific crime category and gender
export const getCrimeExamples = (category, gender = 'male', skinTone = 'medium') => {
  const crimes = crimeFinder[category]?.crimes[gender]?.[skinTone] || [];
  const examples = new Set();

  crimes.forEach(crime => {
    crime.examples.forEach(example => {
      if (example) examples.add(example);
    });
  });

  return Array.from(examples);
}; 