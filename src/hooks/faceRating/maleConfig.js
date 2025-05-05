export const maleConfig = {
  weights: {
    'Carnal Tilt': 1,
    'Facial Thirds': 0.5,
    'Cheekbone Location': 1.5,
    'Interocular Distance': 1,
    'Jawline': 2.5,
    'Chin': 1,
    'Nose': 1,
  },
  params: {
    'Carnal Tilt': 10,
    'Facial Thirds': 500,
    'Cheekbone Location': 2, // Adjusted from 20 to achieve a score > 90
    'Interocular Distance': 5000,
    'Jawline': 5000,
    'Chin': 1000,
    'Nose': 5000,
  },
  idealRatios: {
    'Facial Thirds': 1.1369,
    'Interocular Distance': 0.3045,
    'Jawline': 0.5938,
    'Chin': 0.4994,
    'Nose': 0.1965,
  },
  carnalTiltMultiplierFactor: 1,
  physicalRating: {
    idealBMI: 23.5,
    sigma: 2.5,
    heightPenaltyThreshold: 66,
    penaltyFactor: 0.3,
    heightBonusMin: 66,
    heightBonusMax: 72,
    maxHeightBonus: 10,
  },
  eyeColorScores: {
    blue: 10,
    green: 10,
    brown: 0,
    default: -5,
  },
  bonus: {
    heightThreshold: 72,
    eligibleEyeColors: ['blue', 'green'],
    bonusValue: 5,
  },
  overallRating: {
    faceRatingWeight: 0.65,
    physicalRatingWeight: 0.5,
  },
};