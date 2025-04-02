import { useState } from 'react';

/**
 * Hook to manage configuration parameters for FaceMesh scoring.
 * 
 * @returns {Object} Configuration parameters and their setters.
 */
const useFaceMeshConfig = () => {
  // Symmetry multiplier affects how much asymmetry impacts the score.
  // Default: 6.4. Increase for more sensitivity to asymmetry, decrease for less.
  const [symmetryMultiplier, setSymmetryMultiplier] = useState(6.4);

  // Ideal ratio is the target eye-to-face-width ratio for proportions.
  // Default: 0.38. Adjust based on desired ideal proportions (e.g., 0.36-0.40).
  const [idealRatio, setIdealRatio] = useState(0.38);

  // Proportion scaling factor amplifies the impact of deviation from the ideal ratio.
  // Default: 200. Increase for stricter scoring, decrease for more leniency.
  const [proportionScaling, setProportionScaling] = useState(200);

  return {
    symmetryMultiplier,
    setSymmetryMultiplier,
    idealRatio,
    setIdealRatio,
    proportionScaling,
    setProportionScaling,
  };
};

export default useFaceMeshConfig;