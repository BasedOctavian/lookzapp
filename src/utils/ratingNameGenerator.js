// Score ranges for different advice tiers
const SCORE_RANGES = {
  EXCEPTIONAL: 90,
  ABOVE_AVERAGE: 75,
  AVERAGE: 60,
  BELOW_AVERAGE: 0
};

// Feature-specific advice based on score ranges
const FEATURE_ADVICE = {
  'Carnal Tilt': {
    EXCEPTIONAL: 'Your gaze is boosting your rating significantly',
    ABOVE_AVERAGE: 'Your eye contact is helping your rating',
    AVERAGE: 'Your eye contact is average',
    BELOW_AVERAGE: 'Your eye contact is hurting your rating'
  },
  'Cheekbone Location': {
    EXCEPTIONAL: 'Your cheekbones are boosting your rating significantly',
    ABOVE_AVERAGE: 'Your cheekbones are helping your rating',
    AVERAGE: 'Your cheekbones are average',
    BELOW_AVERAGE: 'Your cheekbones are hurting your rating'
  },
  'Chin': {
    EXCEPTIONAL: 'Your chin is boosting your rating significantly',
    ABOVE_AVERAGE: 'Your chin is helping your rating',
    AVERAGE: 'Your chin is average',
    BELOW_AVERAGE: 'Your chin is hurting your rating'
  },
  'Facial Thirds': {
    EXCEPTIONAL: 'Your facial proportions are boosting your rating significantly',
    ABOVE_AVERAGE: 'Your facial proportions are helping your rating',
    AVERAGE: 'Your facial proportions are average',
    BELOW_AVERAGE: 'Your facial proportions are hurting your rating'
  },
  'Interocular Distance': {
    EXCEPTIONAL: 'Your eye spacing is boosting your rating significantly',
    ABOVE_AVERAGE: 'Your eye spacing is helping your rating',
    AVERAGE: 'Your eye spacing is average',
    BELOW_AVERAGE: 'Your eye spacing is hurting your rating'
  },
  'Jawline': {
    EXCEPTIONAL: 'Your jawline is boosting your rating significantly',
    ABOVE_AVERAGE: 'Your jawline is helping your rating',
    AVERAGE: 'Your jawline is average',
    BELOW_AVERAGE: 'Your jawline is hurting your rating'
  },
  'Nose': {
    EXCEPTIONAL: 'Your nose is boosting your rating significantly',
    ABOVE_AVERAGE: 'Your nose is helping your rating',
    AVERAGE: 'Your nose is average',
    BELOW_AVERAGE: 'Your nose is hurting your rating'
  }
};

const FACIAL_FEATURES = ['Carnal Tilt', 'Cheekbone Location', 'Chin', 'Facial Thirds', 'Interocular Distance', 'Jawline', 'Nose'];

function getTier(score) {
  if (score >= SCORE_RANGES.EXCEPTIONAL) return 'EXCEPTIONAL';
  if (score >= SCORE_RANGES.ABOVE_AVERAGE) return 'ABOVE_AVERAGE';
  if (score >= SCORE_RANGES.AVERAGE) return 'AVERAGE';
  return 'BELOW_AVERAGE';
}

/**
 * Generates advice for the best and worst scoring features
 * @param {Object} allScores - Object containing scores for each facial feature (0-100)
 * @returns {string} - Formatted string containing advice for best and worst features
 */
export function generateRatingName(allScores) {
  let bestFeature = null;
  let worstFeature = null;
  let bestScore = -1;
  let worstScore = 101;

  // Find best and worst features
  for (const feature of FACIAL_FEATURES) {
    if (allScores[feature] !== undefined) {
      if (allScores[feature] > bestScore) {
        bestScore = allScores[feature];
        bestFeature = feature;
      }
      if (allScores[feature] < worstScore) {
        worstScore = allScores[feature];
        worstFeature = feature;
      }
    }
  }

  // Generate advice for both features
  const bestAdvice = bestFeature ? FEATURE_ADVICE[bestFeature][getTier(bestScore)] : '';
  const worstAdvice = worstFeature ? FEATURE_ADVICE[worstFeature][getTier(worstScore)] : '';

  return `${bestAdvice}. ${worstAdvice}`;
}
