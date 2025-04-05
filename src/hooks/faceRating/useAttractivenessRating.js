import { useMemo } from 'react';

export function useAttractivenessRating(doc) {
  const rating = useMemo(() => {
    // Silently return null if doc hasn’t been set yet
    if (!doc) {
      return null;
    }
    // Log error only if doc is present but invalid
    if (typeof doc.faceRating !== 'number' || typeof doc.height !== 'number' || 
        typeof doc.weight !== 'number' || !['M', 'W'].includes(doc.gender) || 
        !doc.ethnicity || !doc.eyeColor) {
      console.error('Invalid or incomplete doc object:', doc);
      return null;
    }

    const { faceRating, ethnicity, eyeColor, height, weight, gender } = doc;

    // Ethnicity Score: Less harsh penalty
    const ethnicityScore = (ethnicity === 'euro' || ethnicity === 'other') ? 10 : -1;

    // Eye Color Score: Reduced penalties
    let eyeColorScore;
    if (eyeColor === 'blue' || eyeColor === 'green') {
      eyeColorScore = 5;
    } else if (eyeColor === 'brown') {
      eyeColorScore = -1;
    } else {
      eyeColorScore = -3;
    }

    // Height Score: Adjusted for men and women
    let heightScore;
    if (gender === 'M') {
      if (height <= 66) {
        heightScore = 5;
      } else if (height <= 72) {
        heightScore = 5 + ((height - 66) / 6) * 5;
      } else {
        heightScore = Math.min(20, 10 + ((height - 72) / 6) * 10);
      }
      // Adjust heightScore for men based on faceRating
      const scalingFactor = Math.max(0, Math.min(1, faceRating / 40));
      heightScore *= scalingFactor;
    } else if (gender === 'W') {
      if (height <= 66) {
        heightScore = 20;
      } else {
        heightScore = Math.max(0, 20 - ((height - 66) / 6) * 5);
      }
    }

    // Weight Score: Less penalty for women
    let weightScore;
    if (gender === 'M') {
      const idealWeight = (height - 60) * 6 + 106;
      weightScore = 10 - 0.2 * Math.max(0, weight - idealWeight) - 0.5 * Math.max(0, weight - 250);
    } else if (gender === 'W') {
      const idealWeight = 100 + 5 * (height - 60);
      weightScore = 10 - 0.1 * Math.max(0, weight - idealWeight) - 0.25 * Math.max(0, weight - 180);
    }

    // Bonus: Reduced for tall men with blue/green eyes
    const bonus = (gender === 'M' && height > 72 && (eyeColor === 'blue' || eyeColor === 'green')) ? 2 : 0;

    // Face Rating Weight: Slightly higher for women
    const faceRatingWeight = (gender === 'W') ? 0.6 : 0.57;

    // Final Grade
    const finalGrade = (faceRatingWeight * faceRating) + ethnicityScore + eyeColorScore + 
                       (1.5 * heightScore) + (0.5 * weightScore) + bonus;

    return finalGrade;
  }, [doc]);

  return { rating };
}