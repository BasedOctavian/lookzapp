import { useMemo } from 'react';

export function useAttractivenessRating(doc) {
  const rating = useMemo(() => {
    console.log('Initial input values:', doc);
    if (!doc) {
      console.error('No doc object provided');
      return null;
    }
    const requiredProps = [
      'height', 'weight', 'gender', 'eyeColor',
      'carnalTilt', 'cheekbone', 'chin', 'facialThirds',
      'interocular', 'jawline', 'nose'
    ];
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
    let faceRating;
    if (gender === 'M') {
      faceRating = (
        (carnalTilt * 0.05) +
        (cheekbone * 0.3) +
        (chin * 0.3) +
        (facialThirds * 0.15) +
        (interocular * 0.05) +
        (jawline * 0.15) +
        (nose * 0.05)
      );
    } else {
      faceRating = (
        carnalTilt +
        cheekbone +
        chin +
        facialThirds +
        interocular +
        jawline +
        nose
      ) / 7;
    }
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
    const BMI = (weight / (height * height)) * 703;
    let physicalRating;
    if (gender === 'M') {
      const idealBMI = 23.5;
      const sigma = 2.5;
      let physiqueScore = 30 * Math.exp(-Math.pow(BMI - idealBMI, 2) / (2 * sigma * sigma));
      if (height < 66) {
        physiqueScore *= 0.3;
      }
      const heightBonus = Math.min(10, Math.max(0, (height - 66) / 6 * 5));
      physicalRating = physiqueScore + heightBonus;
    } else if (gender === 'W') {
      const idealBMI = 20.5;
      const sigma = 2.0;
      let physiqueScore = 30 * Math.exp(-Math.pow(BMI - idealBMI, 2) / (2 * sigma * sigma));
      if (height > 71) {
        physiqueScore *= 0.3;
      }
      physicalRating = physiqueScore;
    }
    const bonus = (gender === 'M' && height > 72 && (eyeColor.toLowerCase() === 'blue' || eyeColor.toLowerCase() === 'green')) ? 5 : 0;
    const faceRatingWeight = gender === 'M' ? 0.65 : 0.7;
    const physicalRatingWeight = 0.5;
    const rawScore = (faceRatingWeight * faceRating) + (physicalRatingWeight * physicalRating) + eyeColorScore + bonus;
    const overallRating = 100 / (1 + Math.exp(-0.1 * (rawScore - 50)));
    console.log(`Face Rating: ${faceRating.toFixed(2)}`);
    console.log(`Physical Rating: ${physicalRating.toFixed(2)}`);
    console.log(`Overall Rating: ${overallRating.toFixed(2)}`);
    return overallRating;
  }, [doc]);
  return { rating };
}