import { useMemo } from 'react';

// Landmark indices based on MediaPipe's 468-point model
const LEFT_EYE_INDICES = [33, 133, 159, 145, 153, 154, 155, 246, 161, 160, 159, 158, 157, 173, 133];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LEFT_FACE_INDEX = 234;
const RIGHT_FACE_INDEX = 454;
const NOSE_TIP_INDEX = 1;
const MOUTH_LEFT_INDEX = 61;
const MOUTH_RIGHT_INDEX = 291;

/**
 * Hook to calculate scores based on facial landmarks and configuration.
 * 
 * @param {Array} landmarks - Array of landmark objects with x and y coordinates.
 * @param {Object} config - Configuration parameters for scoring.
 * @returns {Object} Scores for symmetry, proportions, and attractiveness.
 */
const useFaceScoring = (landmarks, config) => {
  const { symmetryMultiplier, idealRatio, proportionScaling, symmetryWeight, idealNoseToMouthRatio } = config;

  const scores = useMemo(() => {
    if (!landmarks) return { symmetryScore: null, proportionScore: null, attractivenessScore: null };

    const getCenter = (points) => {
      const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / points.length, y: sum.y / points.length };
    };

    // Symmetry calculation
    const leftEyeCenter = getCenter(LEFT_EYE_INDICES.map(idx => landmarks[idx]));
    const rightEyeCenter = getCenter(RIGHT_EYE_INDICES.map(idx => landmarks[idx]));
    const faceCenterX = (landmarks[LEFT_FACE_INDEX].x + landmarks[RIGHT_FACE_INDEX].x) / 2;
    const leftEyeDistance = Math.abs(leftEyeCenter.x - faceCenterX);
    const rightEyeDistance = Math.abs(rightEyeCenter.x - faceCenterX);
    const symmetryScore = 100 - Math.abs(leftEyeDistance - rightEyeDistance) * symmetryMultiplier;

    // Eye-to-face proportion calculation
    const eyeDistance = Math.sqrt(
      (rightEyeCenter.x - leftEyeCenter.x) ** 2 + (rightEyeCenter.y - leftEyeCenter.y) ** 2
    );
    const faceWidth = landmarks[RIGHT_FACE_INDEX].x - landmarks[LEFT_FACE_INDEX].x;
    const eyeToFaceRatio = eyeDistance / faceWidth;
    const eyeToFaceDeviation = Math.abs(eyeToFaceRatio - idealRatio);
    const eyeToFaceScore = 100 - eyeToFaceDeviation * proportionScaling;

    // New: Nose-to-mouth proportion calculation
    const noseWidth = Math.abs(landmarks[NOSE_TIP_INDEX].x - landmarks[NOSE_TIP_INDEX].x); // Simplified; could use other nose points
    const mouthWidth = Math.abs(landmarks[MOUTH_RIGHT_INDEX].x - landmarks[MOUTH_LEFT_INDEX].x);
    const noseToMouthRatio = noseWidth / mouthWidth;
    const noseToMouthDeviation = Math.abs(noseToMouthRatio - idealNoseToMouthRatio);
    const noseToMouthScore = 100 - noseToMouthDeviation * proportionScaling;

    // Combined proportions score (average of eye-to-face and nose-to-mouth)
    const proportionScore = (eyeToFaceScore + noseToMouthScore) / 2;

    // Clamp scores
    const clampedSymmetry = Math.max(0, Math.min(100, symmetryScore));
    const clampedProportion = Math.max(0, Math.min(100, proportionScore));

    // Attractiveness score with adjustable weighting
    const proportionWeight = 100 - symmetryWeight;
    const attractivenessScore = (clampedSymmetry * symmetryWeight + clampedProportion * proportionWeight) / 100;

    return { symmetryScore: clampedSymmetry, proportionScore: clampedProportion, attractivenessScore };
  }, [landmarks, symmetryMultiplier, idealRatio, proportionScaling, symmetryWeight, idealNoseToMouthRatio]);

  return scores;
};

export default useFaceScoring;