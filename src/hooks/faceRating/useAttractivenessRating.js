import { useMemo } from 'react';

export function useAttractivenessRating(doc) {
  const rating = useMemo(() => {
    // Input validation
    if (!doc) {
      console.error('No doc object provided');
      return null;
    }

    // List of required properties
    const requiredProps = [
      'height', 'weight', 'gender', 'eyeColor',
      'carnalTilt', 'cheekbone', 'chin', 'facialThirds',
      'interocular', 'jawline', 'nose'
    ];

    // Check for missing or invalid properties
    for (const prop of requiredProps) {
      if (doc[prop] === undefined) {
        console.error(`Missing property: ${prop}`, doc);
        return null;
      }
      if (prop !== 'gender' && prop !== 'eyeColor' && typeof doc[prop] !== 'number') {
        console.error(`Property ${prop} must be a number`, doc);
        return null;
      }
    }
    if (!['M', 'W'].includes(doc.gender)) {
      console.error('Gender must be "M" or "W"', doc);
      return null;
    }

    const {
      height,
      weight,
      gender,
      eyeColor,
      carnalTilt,
      cheekbone,
      chin,
      facialThirds,
      interocular,
      jawline,
      nose
    } = doc;

    // Proceed with rating calculation (unchanged from your original code)
    const faceRating = (
      carnalTilt +
      cheekbone +
      chin +
      facialThirds +
      interocular +
      jawline +
      nose
    ) / 7;

    let eyeColorScore;
    switch (eyeColor.toLowerCase()) {
      case 'blue':
      case 'green':
        eyeColorScore = 10;
        break;
      case 'brown':
        eyeColorScore = 0;
        break;
      default:
        eyeColorScore = -5;
    }

    let heightScore;
    if (gender === 'M') {
      if (height <= 66) heightScore = 5;
      else if (height <= 72) heightScore = 5 + ((height - 66) / 6) * 15;
      else heightScore = Math.min(30, 20 + ((height - 72) / 6) * 10);
    } else if (gender === 'W') {
      if (height <= 60) heightScore = 5;
      else if (height <= 66) heightScore = 5 + ((height - 60) / 6) * 15;
      else heightScore = Math.max(5, 20 - ((height - 66) / 6) * 5);
    }

    let weightScore;
    if (gender === 'M') {
      const idealWeight = (height - 60) * 7 + 110;
      const deviation = Math.abs(weight - idealWeight);
      weightScore = Math.max(0, 20 - 0.5 * deviation);
    } else if (gender === 'W') {
      const idealWeight = 100 + 5 * (height - 60);
      const deviation = Math.abs(weight - idealWeight);
      weightScore = Math.max(0, 20 - 0.4 * deviation);
    }

    const bonus = (gender === 'M' && height > 72 && (eyeColor === 'blue' || eyeColor === 'green')) ? 5 : 0;
    const faceRatingWeight = gender === 'W' ? 0.7 : 0.65;
    const rawScore = (faceRatingWeight * faceRating) + eyeColorScore + heightScore + weightScore + bonus;
    const finalRating = 100 / (1 + Math.exp(-0.1 * (rawScore - 50)));

    return finalRating;
  }, [doc]);

  return { rating };
}