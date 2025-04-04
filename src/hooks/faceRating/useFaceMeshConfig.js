import { useState } from 'react';

/**
 * Hook to manage configuration parameters for FaceMesh scoring.
 * 
 * @returns {Object} Configuration parameters and their setters.
 */
const useFaceMeshConfig = () => {
  const [symmetryMultiplier, setSymmetryMultiplier] = useState(6.4);
  const [idealRatio, setIdealRatio] = useState(0.38);
  const [proportionScaling, setProportionScaling] = useState(200);
  // New parameter: Weight of symmetry in attractiveness score (0-100%)
  const [symmetryWeight, setSymmetryWeight] = useState(50);
  // New parameter: Ideal nose-to-mouth width ratio
  const [idealNoseToMouthRatio, setIdealNoseToMouthRatio] = useState(1.0);

  return {
    symmetryMultiplier,
    setSymmetryMultiplier,
    idealRatio,
    setIdealRatio,
    proportionScaling,
    setProportionScaling,
    symmetryWeight,
    setSymmetryWeight,
    idealNoseToMouthRatio,
    setIdealNoseToMouthRatio,
  };
};

export default useFaceMeshConfig;