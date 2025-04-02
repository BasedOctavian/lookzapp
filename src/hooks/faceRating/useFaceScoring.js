import { useMemo } from 'react';

// Landmark indices based on MediaPipe's 468-point model
const LEFT_EYE_INDICES = [33, 133, 159, 145, 153, 154, 155, 246, 161, 160, 159, 158, 157, 173, 133];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LEFT_FACE_INDEX = 234;
const RIGHT_FACE_INDEX = 454;

/**
 * Hook to calculate scores based on facial landmarks and configuration.
 * 
 * @param {Array} landmarks - Array of landmark objects with x and y coordinates.
 * @param {Object} config - Configuration parameters for scoring.
 * @returns {Object} Scores for symmetry, proportions, and attractiveness.
 */
const useFaceScoring = (landmarks, config) => {
  const { symmetryMultiplier, idealRatio, proportionScaling } = config;

  const scores = useMemo(() => {
    if (!landmarks) return { symmetryScore: null, proportionScore: null, attractivenessScore: null };

    // Helper function to calculate the center of a set of points
    const getCenter = (points) => {
      const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / points.length, y: sum.y / points.length };
    };

    // Calculate centers of left and right eyes
    const leftEyeCenter = getCenter(LEFT_EYE_INDICES.map(idx => landmarks[idx]));
    const rightEyeCenter = getCenter(RIGHT_EYE_INDICES.map(idx => landmarks[idx]));

    // Calculate face center X-coordinate (midpoint of face width)
    const faceCenterX = (landmarks[LEFT_FACE_INDEX].x + landmarks[RIGHT_FACE_INDEX].x) / 2;

    // Calculate distances from eye centers to face center
    const leftEyeDistance = Math.abs(leftEyeCenter.x - faceCenterX);
    const rightEyeDistance = Math.abs(rightEyeCenter.x - faceCenterX);

    // Symmetry score: 100 minus the difference in eye distances times symmetryMultiplier
    // - Tweak symmetryMultiplier: Higher values (e.g., 10) make asymmetry penalize more,
    //   lower values (e.g., 4) make it more forgiving.
    const symmetryScore = 100 - Math.abs(leftEyeDistance - rightEyeDistance) * symmetryMultiplier;

    // Calculate eye distance (Euclidean distance between eye centers)
    const eyeDistance = Math.sqrt(
      (rightEyeCenter.x - leftEyeCenter.x) ** 2 + (rightEyeCenter.y - leftEyeCenter.y) ** 2
    );

    // Calculate face width
    const faceWidth = landmarks[RIGHT_FACE_INDEX].x - landmarks[LEFT_FACE_INDEX].x;

    // Calculate ratio of eye distance to face width
    const ratio = eyeDistance / faceWidth;

    // Calculate deviation from ideal ratio
    const deviation = Math.abs(ratio - idealRatio);

    // Proportions score: 100 minus deviation times proportionScaling
    // - Tweak idealRatio: Adjust (e.g., 0.36-0.40) based on ideal face proportions.
    // - Tweak proportionScaling: Higher values (e.g., 300) make deviations penalize more,
    //   lower values (e.g., 100) make it more lenient.
    const proportionScore = 100 - deviation * proportionScaling;

    // Clamp scores to 0-100 range
    const clampedSymmetry = Math.max(0, Math.min(100, symmetryScore));
    const clampedProportion = Math.max(0, Math.min(100, proportionScore));

    // Attractiveness score: average of symmetry and proportions
    const attractivenessScore = (clampedSymmetry + clampedProportion) / 2;

    return { symmetryScore: clampedSymmetry, proportionScore: clampedProportion, attractivenessScore };
  }, [landmarks, symmetryMultiplier, idealRatio, proportionScaling]);

  return scores;
};

export default useFaceScoring;