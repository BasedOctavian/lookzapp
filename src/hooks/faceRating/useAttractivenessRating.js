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

    // Calculate ethnicityScore
    const ethnicityScore = (ethnicity === 'euro' || ethnicity === 'other') ? 10 : -3;

    // Calculate eyeColorScore with a lesser penalty for brown eyes
    let eyeColorScore;
    if (eyeColor === 'blue' || eyeColor === 'green') {
      eyeColorScore = 5;
    } else if (eyeColor === 'brown') {
      eyeColorScore = -2;
    } else {
      eyeColorScore = -5;
    }

    // Calculate heightScore based on gender
    let heightScore;
    if (gender === 'M') {
      if (height <= 66) {
        heightScore = 5;
      } else if (height <= 72) {
        heightScore = 5 + ((height - 66) / 6) * 5;
      } else {
        heightScore = Math.min(20, 10 + ((height - 72) / 6) * 10);
      }
    } else if (gender === 'W') {
      if (height <= 60) {
        heightScore = 20;
      } else if (height <= 66) {
        heightScore = 20 - ((height - 60) / 6) * 10;
      } else {
        heightScore = Math.max(0, 10 - ((height - 66) / 6) * 5);
      }
    }

    // Calculate weightScore based on gender
    let weightScore;
    if (gender === 'M') {
      const idealWeight = (height - 60) * 6 + 106;
      weightScore = 10 - 0.2 * Math.max(0, weight - idealWeight) - 0.5 * Math.max(0, weight - 250);
    } else if (gender === 'W') {
      const idealWeight = 100 + 5 * (height - 60);
      weightScore = 10 - 0.2 * Math.max(0, weight - idealWeight) - 0.5 * Math.max(0, weight - 180);
    }

    // Calculate bonus for tall men with blue or green eyes
    const bonus = (gender === 'M' && height > 72 && (eyeColor === 'blue' || eyeColor === 'green')) ? 5 : 0;

    // Calculate finalGrade with increased weight for faceRating
    const finalGrade = (0.57 * faceRating) + ethnicityScore + eyeColorScore + (1.5 * heightScore) + (0.5 * weightScore) + bonus;

    return finalGrade;
  }, [doc]);

  return { rating };
}