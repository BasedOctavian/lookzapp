import { useMemo } from 'react';

// Validation helper functions
const validateRequiredProps = (doc) => {
  if (!doc) {
    throw new Error('No document provided for rating calculation');
  }

  const requiredProps = [
    'height', 'weight', 'gender', 'eyeColor',
    'carnalTilt', 'chin', 'facialThirds',
    'interocular', 'jawline', 'nose'
  ];

  const missingProps = requiredProps.filter(prop => doc[prop] === undefined);
  if (missingProps.length > 0) {
    throw new Error(`Missing required properties: ${missingProps.join(', ')}`);
  }

  const invalidProps = requiredProps.filter(prop => 
    prop !== 'gender' && 
    prop !== 'eyeColor' && 
    (typeof doc[prop] !== 'number' || isNaN(doc[prop]))
  );
  if (invalidProps.length > 0) {
    throw new Error(`Invalid numeric values for: ${invalidProps.join(', ')}`);
  }

  if (!['M', 'W'].includes(doc.gender)) {
    throw new Error(`Invalid gender value: ${doc.gender}. Must be 'M' or 'W'`);
  }

  if (!['blue', 'green', 'brown'].includes(doc.eyeColor?.toLowerCase())) {
    throw new Error(`Invalid eye color: ${doc.eyeColor}. Must be blue, green, or brown`);
  }
};

const validateRanges = (doc) => {
  const ranges = {
    height: { min: 48, max: 84 }, // inches
    weight: { min: 80, max: 400 }, // pounds
    carnalTilt: { min: 0, max: 100 },
    chin: { min: 0, max: 100 },
    facialThirds: { min: 0, max: 100 },
    interocular: { min: 0, max: 100 },
    jawline: { min: 0, max: 100 },
    nose: { min: 0, max: 100 }
  };

  const outOfRangeProps = Object.entries(ranges)
    .filter(([prop, range]) => {
      const value = doc[prop];
      return value < range.min || value > range.max;
    })
    .map(([prop, range]) => `${prop} (${range.min}-${range.max})`);

  if (outOfRangeProps.length > 0) {
    throw new Error(`Values out of range: ${outOfRangeProps.join(', ')}`);
  }
};

export function useAttractivenessRating(doc) {
  const rating = useMemo(() => {
    try {
      // Validate input
      validateRequiredProps(doc);
      validateRanges(doc);

      const {
        height,
        weight,
        gender,
        eyeColor,
        carnalTilt = 0,
        chin = 0,
        facialThirds = 0,
        interocular = 0,
        jawline = 0,
        nose = 0
      } = doc;

      // Calculate face rating with improved weights
      let faceRating;
      if (gender === 'M') {
        faceRating = (
          (carnalTilt * 0.10) +      // Reduced eye tilt importance
          (chin * 0.30) +            // Increased chin weight
          (facialThirds * 0.10) +    // Reduced facial thirds weight
          (interocular * 0.10) +     // Reduced eye spacing importance
          (jawline * 0.30) +         // Increased jawline weight
          (nose * 0.10)              // Reduced nose importance
        );
      } else {
        faceRating = (
          (carnalTilt * 0.15) +      // Reduced eye tilt importance
          (chin * 0.25) +            // Increased chin weight
          (facialThirds * 0.15) +    // Reduced facial thirds weight
          (interocular * 0.15) +     // Reduced eye spacing importance
          (jawline * 0.20) +         // Increased jawline weight
          (nose * 0.10)              // Reduced nose importance
        );
      }

      // Calculate eye color score with improved mapping
      let eyeColorScore;
      switch (eyeColor?.toLowerCase()) {
        case 'blue':
          eyeColorScore = gender === 'M' ? 8 : 10;
          break;
        case 'green':
          eyeColorScore = gender === 'M' ? 7 : 9;
          break;
        case 'brown':
          eyeColorScore = gender === 'M' ? 5 : 7;
          break;
        default:
          eyeColorScore = 3;
      }

      // Calculate BMI with improved gender-specific parameters
      const BMI = (weight / (height * height)) * 703;
      let physicalRating;

      if (gender === 'M') {
        const idealBMI = 23.5;
        const sigma = 2.5;
        let physiqueScore = 35 * Math.exp(-Math.pow(BMI - idealBMI, 2) / (2 * sigma * sigma));
        
        // Improved height bonus calculation
        if (height < 66) {
          physiqueScore *= 0.4; // Less severe penalty for shorter height
        }
        const heightBonus = Math.min(12, Math.max(0, (height - 66) / 6 * 6));
        physicalRating = physiqueScore + heightBonus;
      } else {
        const idealBMI = 20.5;
        const sigma = 2.0;
        let physiqueScore = 35 * Math.exp(-Math.pow(BMI - idealBMI, 2) / (2 * sigma * sigma));
        
        // Improved height consideration for females
        if (height > 71) {
          physiqueScore *= 0.4; // Less severe penalty for taller height
        }
        const heightBonus = Math.min(8, Math.max(0, (height - 64) / 4 * 4));
        physicalRating = physiqueScore + heightBonus;
      }

      // Calculate bonus points with improved criteria
      const bonus = (() => {
        let total = 0;
        if (gender === 'M') {
          if (height > 72 && (eyeColor?.toLowerCase() === 'blue' || eyeColor?.toLowerCase() === 'green')) {
            total += 4;
          }
          if (BMI >= 22 && BMI <= 25) {
            total += 3;
          }
        } else {
          if (height >= 64 && height <= 68) {
            total += 4;
          }
          if (BMI >= 19 && BMI <= 22) {
            total += 3;
          }
        }
        return total;
      })();

      // Improved final score calculation
      const faceRatingWeight = gender === 'M' ? 0.60 : 0.65;
      const physicalRatingWeight = 0.35;
      const rawScore = (
        (faceRatingWeight * faceRating) +
        (physicalRatingWeight * physicalRating) +
        eyeColorScore +
        bonus
      );

      // Improved sigmoid normalization
      const overallRating = 100 / (1 + Math.exp(-0.12 * (rawScore - 45)));

      // Ensure the rating is a valid number
      if (isNaN(overallRating)) {
        console.error('Invalid rating calculation:', {
          faceRating,
          physicalRating,
          eyeColorScore,
          bonus,
          rawScore
        });
        return 50; // Return a default value if calculation fails
      }

      return overallRating;
    } catch (error) {
      console.error('Error calculating attractiveness rating:', error.message);
      return 50; // Return a default value if calculation fails
    }
  }, [doc]);

  return { rating };
}