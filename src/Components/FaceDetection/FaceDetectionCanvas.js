import { useRef, useEffect } from 'react';
import { calculateEyeCenter } from './utils';

const useFaceDetectionCanvas = ({ model, videoRef, onFaceDetected, onMeasurements }) => {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const drawFaceDetection = (predictions, context, canvas) => {
    if (predictions.length > 0) {
      const face = predictions[0];
      const landmarks = face.scaledMesh;
      const boundingBox = face.boundingBox;

      // Draw face landmarks
      landmarks.forEach(([x, y]) => {
        context.beginPath();
        context.arc(x, y, 1, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(0, 255, 255, 0.5)';
        context.fill();
      });

      // Draw face bounding box
      context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      context.lineWidth = 2;
      context.strokeRect(
        boundingBox.topLeft[0],
        boundingBox.topLeft[1],
        boundingBox.bottomRight[0] - boundingBox.topLeft[0],
        boundingBox.bottomRight[1] - boundingBox.topLeft[1]
      );

      // Calculate measurements
      const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
      const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
      const dy = rightEyeCenter[1] - leftEyeCenter[1];
      const dx = rightEyeCenter[0] - leftEyeCenter[0];
      const carnalTiltAngle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

      const measurements = {
        leftEyeCenter,
        rightEyeCenter,
        carnalTiltAngle,
        // Add other measurements as needed
      };

      onMeasurements(measurements);
      onFaceDetected(true);
    } else {
      onFaceDetected(false);
    }
  };

  useEffect(() => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 100;

    const detectFaceAndDraw = async () => {
      const now = Date.now();
      if (now - lastDetectionTime < DETECTION_INTERVAL) return;
      lastDetectionTime = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const predictions = await model.estimateFaces(video);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw face detection overlay
      if (window.innerWidth >= 768) {
        context.strokeStyle = 'white';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(canvas.width / 2, 0);
        context.lineTo(canvas.width / 2, canvas.height);
        context.moveTo(0, canvas.height / 2);
        context.lineTo(canvas.width, canvas.height / 2);
        context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 6, canvas.height / 4, 0, 0, 2 * Math.PI);
        context.stroke();
      }

      drawFaceDetection(predictions, context, canvas);
    };

    intervalRef.current = setInterval(detectFaceAndDraw, DETECTION_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [model, videoRef, onFaceDetected, onMeasurements]);

  return { canvasRef };
};

export default useFaceDetectionCanvas; 