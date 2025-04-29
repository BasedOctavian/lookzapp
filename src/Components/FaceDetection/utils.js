export const calculateEyeCenter = (landmarks, indices) => {
  let sumX = 0, sumY = 0, sumZ = 0;
  indices.forEach((index) => {
    sumX += landmarks[index][0];
    sumY += landmarks[index][1];
    sumZ += landmarks[index][2];
  });
  const count = indices.length;
  return [sumX / count, sumY / count, sumZ / count];
};

export const calculateTiltScore = (landmarks, multiplier, multiplierFactor) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const dy = rightEyeCenter[1] - leftEyeCenter[1];
  const dx = rightEyeCenter[0] - leftEyeCenter[0];
  const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  const adjustedMultiplier = multiplier * multiplierFactor;
  return Math.max(0, 100 - angle * adjustedMultiplier);
};

export const calculateFacialThirdsScore = (landmarks, multiplier, idealRatio) => {
  const forehead = landmarks[10][1];
  const noseBase = landmarks[1][1];
  const chin = landmarks[152][1];
  const third1 = noseBase - forehead;
  const third2 = chin - noseBase;
  const ratio = third1 / third2;
  const deviation = Math.abs(1 - ratio / idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export const calculateCheekboneScore = (landmarks, multiplier) => {
  const cheekLeft = landmarks[116][1];
  const cheekRight = landmarks[345][1];
  const diff = Math.abs(cheekLeft - cheekRight);
  const forehead = landmarks[10][1];
  const chin = landmarks[152][1];
  const faceHeight = chin - forehead;
  const normalized_diff = faceHeight > 0 ? diff / faceHeight : 0;
  return 100 * Math.exp(-multiplier * normalized_diff);
};

export const calculateInterocularDistanceScore = (landmarks, boundingBox, multiplier, idealRatio) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const distance = Math.sqrt((rightEyeCenter[0] - leftEyeCenter[0]) ** 2 + (rightEyeCenter[1] - leftEyeCenter[1]) ** 2);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = distance / faceWidth;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export const calculateJawlineScore = (landmarks, boundingBox, multiplier, idealRatio) => {
  const jawWidth = Math.abs(landmarks[123][0] - landmarks[352][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = jawWidth / faceWidth;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export const calculateChinScore = (landmarks, multiplier, idealRatio) => {
  const noseTip = landmarks[1][1];
  const chin = landmarks[152][1];
  const mouth = landmarks[17][1];
  const chinLength = chin - mouth;
  const faceHeight = chin - noseTip;
  const ratio = chinLength / faceHeight;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export const calculateNoseScore = (landmarks, boundingBox, multiplier, idealRatio) => {
  const noseWidth = Math.abs(landmarks[129][0] - landmarks[358][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = noseWidth / faceWidth;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
}; 