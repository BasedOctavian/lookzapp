import React, { useRef, useState, useEffect } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import {
  Container,
  Flex,
  Box,
  Text,
  VStack,
  Input,
} from '@chakra-ui/react';
import { Slider } from '@mui/material';
import useFaceMeshConfig from '../hooks/faceRating/useFaceMeshConfig';
import useFaceScoring from '../hooks/faceRating/useFaceScoring';

const TiltDetector = () => {
  // Refs for webcam and photo
  const webcamVideoRef = useRef(null);
  const webcamCanvasRef = useRef(null);
  const photoCanvasRef = useRef(null);

  // States for landmarks and detection status
  const [webcamLandmarks, setWebcamLandmarks] = useState(null);
  const [photoLandmarks, setPhotoLandmarks] = useState(null);
  const [webcamFaceDetected, setWebcamFaceDetected] = useState('No video');
  const [photoFaceDetected, setPhotoFaceDetected] = useState('No photo uploaded');

  // Use configuration hook
  const {
    symmetryMultiplier,
    setSymmetryMultiplier,
    idealRatio,
    setIdealRatio,
    proportionScaling,
    setProportionScaling,
  } = useFaceMeshConfig();

  // Use scoring hook for webcam and photo
  const webcamScores = useFaceScoring(webcamLandmarks, {
    symmetryMultiplier,
    idealRatio,
    proportionScaling,
  });
  const photoScores = useFaceScoring(photoLandmarks, {
    symmetryMultiplier,
    idealRatio,
    proportionScaling,
  });

  // Set up webcam processing with FaceMesh and Camera
  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      const canvas = webcamCanvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(webcamVideoRef.current, 0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0].map(lm => ({
          x: lm.x * canvas.width,
          y: lm.y * canvas.height,
        }));
        setWebcamLandmarks(landmarks);
        setWebcamFaceDetected('Face detected');
        drawLandmarks(context, landmarks);
      } else {
        setWebcamLandmarks(null);
        setWebcamFaceDetected('No face detected');
      }
    });

    const camera = new Camera(webcamVideoRef.current, {
      onFrame: async () => {
        if (webcamVideoRef.current && webcamVideoRef.current.readyState >= 2) {
          await faceMesh.send({ image: webcamVideoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start().then(() => {
      const video = webcamVideoRef.current;
      const canvas = webcamCanvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    });

    // Cleanup on unmount
    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, []);

  // Process uploaded photo
  const processPhoto = async (img) => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      staticImageMode: true,
    });

    await faceMesh.initialize();

    faceMesh.onResults((results) => {
      const canvas = photoCanvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const scaledLandmarks = results.multiFaceLandmarks[0].map(lm => ({
          x: lm.x * canvas.width,
          y: lm.y * canvas.height,
        }));
        setPhotoLandmarks(scaledLandmarks);
        setPhotoFaceDetected('Face detected');
        drawLandmarks(context, scaledLandmarks);
      } else {
        setPhotoLandmarks(null);
        setPhotoFaceDetected('No face detected');
      }
    });

    try {
      await faceMesh.send({ image: img });
    } catch (error) {
      console.error('Error processing photo:', error);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = photoCanvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        processPhoto(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Draw landmarks on canvas
  const drawLandmarks = (context, landmarks) => {
    context.fillStyle = 'red';
    landmarks.forEach((lm) => {
      context.beginPath();
      context.arc(lm.x, lm.y, 1, 0, 2 * Math.PI);
      context.fill();
    });
  };

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }} overflow="hidden">
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Webcam and Photo Sections */}
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          {/* Webcam Section */}
          <VStack>
            <video ref={webcamVideoRef} style={{ display: 'none' }} />
            <Box 
              w={{ base: '100%', md: '640px' }} 
              h="480px" 
              borderWidth="2px" 
              borderColor="gray.100" 
              borderRadius="xl" 
              overflow="hidden" 
              boxShadow="lg" 
              bg="gray.200"
            >
              <canvas 
                ref={webcamCanvasRef} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </Box>
            <Text>Webcam: {webcamFaceDetected}</Text>
            <VStack>
              <Text>Symmetry Score: {webcamScores.symmetryScore?.toFixed(2) ?? 'N/A'}</Text>
              <Text>Proportions Score: {webcamScores.proportionScore?.toFixed(2) ?? 'N/A'}</Text>
              <Text>Attractiveness Score: {webcamScores.attractivenessScore?.toFixed(2) ?? 'N/A'}</Text>
            </VStack>
          </VStack>

          {/* Photo Section */}
          <VStack>
            <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
            <Box 
              w={{ base: '100%', md: '640px' }} 
              h="480px" 
              borderWidth="2px" 
              borderColor="gray.100" 
              borderRadius="xl" 
              overflow="hidden" 
              boxShadow="lg" 
              bg="gray.200"
            >
              <canvas 
                ref={photoCanvasRef} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </Box>
            <Text>Photo: {photoFaceDetected}</Text>
            <VStack>
              <Text>Symmetry Score: {photoScores.symmetryScore?.toFixed(2) ?? 'N/A'}</Text>
              <Text>Proportions Score: {photoScores.proportionScore?.toFixed(2) ?? 'N/A'}</Text>
              <Text>Attractiveness Score: {photoScores.attractivenessScore?.toFixed(2) ?? 'N/A'}</Text>
            </VStack>
          </VStack>
        </Flex>

        {/* Shared Parameter Sliders */}
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Adjust Parameters</Text>
          <VStack>
            <Text>Symmetry Multiplier: {symmetryMultiplier.toFixed(1)}</Text>
            <Slider
              aria-label="Symmetry Multiplier"
              min={0}
              max={20}
              step={0.1}
              value={symmetryMultiplier}
              onChange={(_, val) => setSymmetryMultiplier(Number(val))}
            />
          </VStack>
          <VStack>
            <Text>Ideal Proportions Ratio: {idealRatio.toFixed(2)}</Text>
            <Slider
              aria-label="Ideal Proportions Ratio"
              min={0.3}
              max={0.6}
              step={0.01}
              value={idealRatio}
              onChange={(_, val) => setIdealRatio(Number(val))}
            />
          </VStack>
          <VStack>
            <Text>Proportions Scaling Factor: {proportionScaling}</Text>
            <Slider
              aria-label="Proportions Scaling Factor"
              min={100}
              max={300}
              step={10}
              value={proportionScaling}
              onChange={(_, val) => setProportionScaling(Number(val))}
            />
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
};

export default TiltDetector;