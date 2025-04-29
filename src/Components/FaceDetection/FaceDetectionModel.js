import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

const useFaceDetectionModel = () => {
  const [model, setModel] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  const loadModel = async () => {
    try {
      setLoadingProgress(0);
      
      // Initialize TensorFlow.js with WebGL backend
      await tf.setBackend('webgl');
      setLoadingProgress(30);
      
      // Load FaceMesh model with optimized settings
      const loadedModel = await facemesh.load({
        maxFaces: 1,
        refineLandmarks: true,
        detectionConfidence: 0.9,
        maxContinuousChecks: 5
      });
      
      setLoadingProgress(100);
      setModel(loadedModel);
    } catch (err) {
      setError('Failed to load FaceMesh model');
    }
  };

  useEffect(() => {
    loadModel();
  }, []);

  return { model, loadingProgress, error, retry: loadModel };
};

export default useFaceDetectionModel; 