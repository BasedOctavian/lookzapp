import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';
import { useAttractivenessRating } from '../hooks/faceRating/useAttractivenessRating';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Text,
  VStack,
  Heading,
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/toast';
import {
  Stack,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  TextField,
  Button as MuiButton,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Box as MuiBox,
  LinearProgress,
  InputAdornment,
  Grid,
  FormHelperText,
  Input,
} from '@mui/material';
import { maleConfig } from '../hooks/faceRating/maleConfig';
import { femaleConfig } from '../hooks/faceRating/femaleConfig';
import { generateRatingName } from '../utils/ratingNameGenerator';

// Define tests (same for both genders)
const tests = [
  'Carnal Tilt',
  'Facial Thirds',
  'Cheekbone Location',
  'Interocular Distance',
  'Jawline',
  'Chin',
  'Nose',
  'Overall',
];

const testsWithIdealRatios = new Set(['Facial Thirds', 'Interocular Distance', 'Jawline', 'Chin', 'Nose']);

// Options for adjustable attributes
const eyeColorOptions = [
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Brown', value: 'brown' },
  { label: 'Hazel', value: 'brown' },
  { label: 'Gray', value: 'blue' },
  { label: 'Other', value: 'brown' },
];

const genderOptions = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'W' },
];

// Helper function to calculate eye center
const calculateEyeCenter = (landmarks, indices) => {
  let sumX = 0, sumY = 0, sumZ = 0;
  indices.forEach((index) => {
    sumX += landmarks[index][0];
    sumY += landmarks[index][1];
    sumZ += landmarks[index][2];
  });
  const count = indices.length;
  return [sumX / count, sumY / count, sumZ / count];
};

// WebcamTiltDetector Component with Face Scanning Logic
const WebcamTiltDetector = ({ startScanning, onScanningComplete, onFaceDetected, gender, onReadyToScanChange }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const scoresRef = useRef([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [model, setModel] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [faceDetectedTime, setFaceDetectedTime] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const toast = useToast();

  const config = gender === 'M' ? maleConfig : femaleConfig;

  const loadModel = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    } catch (err) {
      setWebcamError('Failed to load FaceMesh model');
      setIsLoading(false);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setVideoReady(true);
          videoRef.current.play().catch((err) => {
            setWebcamError('Failed to play video');
          });
        };
      }
    } catch (err) {
      setWebcamError('Webcam access denied or unavailable');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await loadModel();
      if (isMounted) {
        await startVideo();
      }
    };

    initialize();
    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!model || !videoReady) return;

    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 100; // Reduced from 500ms to 100ms for smoother experience

    const detectFaceAndRunTest = async () => {
      const now = Date.now();
      if (now - lastDetectionTime < DETECTION_INTERVAL) return;
      lastDetectionTime = now;

      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const predictions = await model.estimateFaces(video);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw face detection overlay
      context.strokeStyle = 'white';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(canvas.width / 2, 0);
      context.lineTo(canvas.width / 2, canvas.height);
      context.moveTo(0, canvas.height / 2);
      context.lineTo(canvas.width, canvas.height / 2);
      context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 6, canvas.height / 4, 0, 0, 2 * Math.PI);
      context.stroke();

      if (predictions.length > 0) {
        const face = predictions[0];
        const landmarks = face.scaledMesh;
        const boundingBox = face.boundingBox;

        // Draw face landmarks with improved visualization
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

        setFaceDetected(true);
        onFaceDetected(true);
        setFaceDetectedTime(prev => prev + 0.1);

        const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
        const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
        const dy = rightEyeCenter[1] - leftEyeCenter[1];
        const dx = rightEyeCenter[0] - leftEyeCenter[0];
        const carnalTiltAngle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

        const forehead = landmarks[10][1];
        const noseBase = landmarks[1][1];
        const chin = landmarks[152][1];
        const faceHeightFull = chin - forehead;
        const upperThirdLength = noseBase - forehead;
        const lowerThirdLength = chin - noseBase;
        const facialThirdsRatio = upperThirdLength / lowerThirdLength;

        const leftCheekHeight = landmarks[116][1];
        const rightCheekHeight = landmarks[345][1];
        const cheekHeightDiff = Math.abs(leftCheekHeight - rightCheekHeight);

        const eyeDistance = Math.sqrt((rightEyeCenter[0] - leftEyeCenter[0]) ** 2 + (rightEyeCenter[1] - leftEyeCenter[1]) ** 2);
        const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
        const interocularRatio = eyeDistance / faceWidth;

        const jawWidth = Math.abs(landmarks[123][0] - landmarks[352][0]);
        const jawRatio = jawWidth / faceWidth;

        const noseTip = landmarks[1][1];
        const mouth = landmarks[17][1];
        const chinLength = chin - mouth;
        const faceHeight = chin - noseTip;
        const chinRatio = chinLength / faceHeight;

        const noseWidth = Math.abs(landmarks[129][0] - landmarks[358][0]);
        const noseRatio = noseWidth / faceWidth;

        const measurements = {
          leftEyeCenter,
          rightEyeCenter,
          carnalTiltAngle,
          upperThirdLength,
          lowerThirdLength,
          facialThirdsRatio,
          leftCheekHeight,
          rightCheekHeight,
          cheekHeightDiff,
          eyeDistance,
          faceWidth,
          interocularRatio,
          jawWidth,
          jawRatio,
          chinLength,
          faceHeight,
          chinRatio,
          noseWidth,
          noseRatio,
          faceHeightFull,
        };

        const testScores = {};
        tests.forEach((test) => {
          if (test !== 'Overall') {
            testScores[test] = runTest(test, landmarks, boundingBox, config);
          }
        });

        if (isCollecting) {
          scoresRef.current.push({ ...testScores, measurements });
        }
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setFaceDetectedTime(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, DETECTION_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected, config]);

  useEffect(() => {
    onReadyToScanChange(faceDetectedTime >= 3);
  }, [faceDetectedTime, onReadyToScanChange]);

  useEffect(() => {
    if (countdown === 0) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 500);
    }
  }, [countdown]);

  useEffect(() => {
    if (startScanning && !isCollecting) {
      setIsCollecting(true);
      setCountdown(5);
      scoresRef.current = [];

      const interval = setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);

      const timer = setTimeout(() => {
        setIsCollecting(false);
        setCountdown(null);
        const collectedScores = scoresRef.current;
        if (collectedScores.length > 0) {
          const testAverages = {};
          tests.forEach((test) => {
            if (test !== 'Overall') {
              const testScores = collectedScores.map((scores) => scores[test]);
              const sortedTestScores = [...testScores].sort((a, b) => a - b);
              const n = sortedTestScores.length;
              const k = Math.ceil(n / 4);
              const trimmedScores = sortedTestScores.slice(k);
              const average = trimmedScores.reduce((sum, val) => sum + val, 0) / trimmedScores.length;
              testAverages[test] = average;
            }
          });
          const totalWeight = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
          const finalScore =
            totalWeight > 0
              ? Object.entries(testAverages).reduce(
                  (sum, [test, score]) => sum + score * config.weights[test],
                  0
                ) / totalWeight
              : 0;

          const measurements = collectedScores[collectedScores.length - 1].measurements;
          onScanningComplete({ finalScore, testAverages, measurements });
        } else {
          onScanningComplete(null);
        }
        scoresRef.current = [];
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [startScanning, onScanningComplete, config]);

  if (webcamError) {
    toast({ title: 'Error', description: webcamError, status: 'error', duration: 5000, isClosable: true });
  }

  return (
    <Box 
      position="relative" 
      w="100%" 
      h="100%"
      maxW={{ base: '100%', md: '800px' }}
      maxH={{ base: '100%', md: '600px' }}
      mx="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      bg="gray.200"
    >
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={4}
          textAlign="center"
          w="100%"
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          bg="rgba(0,0,0,0.7)"
        >
          <CircularProgress
            value={loadingProgress}
            color="teal"
            size={{ base: '40px', md: '60px' }}
            thickness={4}
            sx={{ mb: 2 }}
          />
          <Typography 
            variant="h6" 
            color="white" 
            sx={{ 
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontSize: { base: '1rem', md: '1.25rem' }
            }}
          >
            Loading Face Detection...
          </Typography>
          <Typography 
            variant="body2" 
            color="white" 
            sx={{ 
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontSize: { base: '0.875rem', md: '1rem' }
            }}
          >
            {loadingProgress < 30 ? 'Initializing...' : 
             loadingProgress < 100 ? 'Loading Model...' : 
             'Almost Ready...'}
          </Typography>
        </Box>
      )}
      {!model && !webcamError && !isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={3}
          textAlign="center"
          w="100%"
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          bg="rgba(0,0,0,0.7)"
        >
          <Typography 
            variant="h6" 
            color="white" 
            sx={{ 
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontSize: { base: '1rem', md: '1.25rem' }
            }}
          >
            Preparing Camera...
          </Typography>
        </Box>
      )}
      {webcamError && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={3}
          textAlign="center"
          bg="rgba(0,0,0,0.7)"
          p={{ base: 3, md: 4 }}
          borderRadius="lg"
          w={{ base: '90%', md: 'auto' }}
        >
          <Typography 
            variant="h6" 
            color="white" 
            mb={2}
            sx={{ fontSize: { base: '1rem', md: '1.25rem' } }}
          >
            Camera Error
          </Typography>
          <Typography 
            variant="body1" 
            color="white" 
            mb={3}
            sx={{ fontSize: { base: '0.875rem', md: '1rem' } }}
          >
            {webcamError}
          </Typography>
          <Button
            colorScheme="teal"
            size={{ base: 'sm', md: 'md' }}
            onClick={() => {
              setWebcamError(null);
              setIsLoading(true);
              loadModel().then(startVideo);
            }}
          >
            Retry
          </Button>
        </Box>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          filter: isLoading ? 'blur(4px)' : 'none',
          transition: 'filter 0.3s ease-in-out'
        }}
      />
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          opacity: faceDetected ? 1 : 0.5,
          transition: 'opacity 0.3s ease-in-out'
        }} 
      />
      {countdown !== null && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={3}
        >
          <Text
            color="white"
            fontSize={{ base: "4xl", md: "6xl" }}
            fontWeight="bold"
            textShadow="0 2px 4px rgba(0,0,0,0.5)"
            animation={countdown === 0 ? "pulse 0.5s ease-out" : "none"}
            sx={{
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.2)" },
                "100%": { transform: "scale(1)" }
              }
            }}
          >
            {countdown}
          </Text>
        </Box>
      )}
      {showFlash && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="white"
          opacity={0.8}
          transition="opacity 0.5s ease-out"
          zIndex={2}
        />
      )}
      {!faceDetected && !isLoading && !webcamError && (
        <Box
          position="absolute"
          bottom="20%"
          left="50%"
          transform="translateX(-50%)"
          zIndex={3}
          textAlign="center"
          bg="rgba(0,0,0,0.7)"
          p={{ base: 2, md: 3 }}
          borderRadius="lg"
          w={{ base: '90%', md: 'auto' }}
        >
          <Typography 
            variant="body1" 
            color="white"
            sx={{ fontSize: { base: '0.875rem', md: '1rem' } }}
          >
            Please position your face in the frame
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Scoring Helper Functions with Measurements
const runTest = (test, landmarks, boundingBox, config) => {
  const params = config.params[test];
  switch (test) {
    case 'Carnal Tilt':
      return calculateTiltScore(landmarks, params, config.carnalTiltMultiplierFactor);
    case 'Facial Thirds':
      return calculateFacialThirdsScore(landmarks, params, config.idealRatios['Facial Thirds']);
    case 'Cheekbone Location':
      return calculateCheekboneScore(landmarks, params);
    case 'Interocular Distance':
      return calculateInterocularDistanceScore(landmarks, boundingBox, params, config.idealRatios['Interocular Distance']);
    case 'Jawline':
      return calculateJawlineScore(landmarks, boundingBox, params, config.idealRatios['Jawline']);
    case 'Chin':
      return calculateChinScore(landmarks, params, config.idealRatios['Chin']);
    case 'Nose':
      return calculateNoseScore(landmarks, boundingBox, params, config.idealRatios['Nose']);
    default:
      return 0;
  }
};

const calculateTiltScore = (landmarks, multiplier, multiplierFactor) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const dy = rightEyeCenter[1] - leftEyeCenter[1];
  const dx = rightEyeCenter[0] - leftEyeCenter[0];
  const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  const adjustedMultiplier = multiplier * multiplierFactor;
  return Math.max(0, 100 - angle * adjustedMultiplier);
};

const calculateFacialThirdsScore = (landmarks, multiplier, idealRatio) => {
  const forehead = landmarks[10][1];
  const noseBase = landmarks[1][1];
  const chin = landmarks[152][1];
  const third1 = noseBase - forehead;
  const third2 = chin - noseBase;
  const ratio = third1 / third2;
  const deviation = Math.abs(1 - ratio / idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateCheekboneScore = (landmarks, multiplier) => {
  const cheekLeft = landmarks[116][1];
  const cheekRight = landmarks[345][1];
  const diff = Math.abs(cheekLeft - cheekRight);
  const forehead = landmarks[10][1];
  const chin = landmarks[152][1];
  const faceHeight = chin - forehead;
  const normalized_diff = faceHeight > 0 ? diff / faceHeight : 0;
  return 100 * Math.exp(-multiplier * normalized_diff);
};

const calculateInterocularDistanceScore = (landmarks, boundingBox, multiplier, idealRatio) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const distance = Math.sqrt((rightEyeCenter[0] - leftEyeCenter[0]) ** 2 + (rightEyeCenter[1] - leftEyeCenter[1]) ** 2);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = distance / faceWidth;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateJawlineScore = (landmarks, boundingBox, multiplier, idealRatio) => {
  const jawWidth = Math.abs(landmarks[123][0] - landmarks[352][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = jawWidth / faceWidth;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateChinScore = (landmarks, multiplier, idealRatio) => {
  const noseTip = landmarks[1][1];
  const chin = landmarks[152][1];
  const mouth = landmarks[17][1];
  const chinLength = chin - mouth;
  const faceHeight = chin - noseTip;
  const ratio = chinLength / faceHeight;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateNoseScore = (landmarks, boundingBox, multiplier, idealRatio) => {
  const noseWidth = Math.abs(landmarks[129][0] - landmarks[358][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = noseWidth / faceWidth;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

// Refactored Scoring Functions for Real-Time Updates
const calculateTiltScoreAdjusted = (angle, multiplier, multiplierFactor) => {
  const adjustedMultiplier = multiplier * multiplierFactor;
  return Math.max(0, 100 - angle * adjustedMultiplier);
};

const calculateFacialThirdsScoreAdjusted = (ratio, multiplier, idealRatio) => {
  const deviation = Math.abs(1 - ratio / idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateCheekboneScoreAdjusted = (cheekHeightDiff, faceHeightFull, multiplier) => {
  const normalized_diff = faceHeightFull > 0 ? cheekHeightDiff / faceHeightFull : 0;
  return 100 * Math.exp(-multiplier * normalized_diff);
};

const calculateInterocularDistanceScoreAdjusted = (ratio, multiplier, idealRatio) => {
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateJawlineScoreAdjusted = (ratio, multiplier, idealRatio) => {
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateChinScoreAdjusted = (ratio, multiplier, idealRatio) => {
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateNoseScoreAdjusted = (ratio, multiplier, idealRatio) => {
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateTestScores = (measurements, params) => {
  const testScores = {};
  testScores['Carnal Tilt'] = calculateTiltScoreAdjusted(
    measurements.carnalTiltAngle,
    params.params['Carnal Tilt'],
    params.carnalTiltMultiplierFactor
  );
  testScores['Facial Thirds'] = calculateFacialThirdsScoreAdjusted(
    measurements.facialThirdsRatio,
    params.params['Facial Thirds'],
    params.idealRatios['Facial Thirds']
  );
  testScores['Cheekbone Location'] = calculateCheekboneScoreAdjusted(
    measurements.cheekHeightDiff,
    measurements.faceHeightFull,
    params.params['Cheekbone Location']
  );
  testScores['Interocular Distance'] = calculateInterocularDistanceScoreAdjusted(
    measurements.interocularRatio,
    params.params['Interocular Distance'],
    params.idealRatios['Interocular Distance']
  );
  testScores['Jawline'] = calculateJawlineScoreAdjusted(
    measurements.jawRatio,
    params.params['Jawline'],
    params.idealRatios['Jawline']
  );
  testScores['Chin'] = calculateChinScoreAdjusted(
    measurements.chinRatio,
    params.params['Chin'],
    params.idealRatios['Chin']
  );
  testScores['Nose'] = calculateNoseScoreAdjusted(
    measurements.noseRatio,
    params.params['Nose'],
    params.idealRatios['Nose']
  );
  return testScores;
};

// UserInfoForm Component with Improvements
const UserInfoForm = ({ onSubmit, gender }) => {
  const [unitSystem, setUnitSystem] = useState('imperial');
  const [name, setName] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const ethnicityMap = {
    'European': 'euro',
    'African': 'african',
    'East Asian': 'asian',
    'South Asian': 'indian',
    'Middle Eastern': 'other',
    'Hispanic/Latino': 'other',
    'Native American': 'other',
    'Pacific Islander': 'other',
    'Other': 'other',
  };

  const eyeColorMap = {
    'Blue': 'blue',
    'Green': 'green',
    'Brown': 'brown',
    'Hazel': 'brown',
    'Gray': 'blue',
    'Other': 'brown',
  };

  useEffect(() => {
    // Remove the localStorage loading
    setUnitSystem('imperial');
    setName('');
    setEthnicity('');
    setEyeColor('');
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
    setErrors({});
  }, []);

  useEffect(() => {
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
    setErrors({});
  }, [unitSystem]);

  const validateForm = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!ethnicity) newErrors.ethnicity = 'Ethnicity is required';
    if (!eyeColor) newErrors.eyeColor = 'Eye color is required';

    if (unitSystem === 'imperial') {
      const feet = parseFloat(heightFeet);
      const inches = parseFloat(heightInches);
      const weight = parseFloat(weightValue);
      if (!heightFeet || isNaN(feet) || feet < 4 || feet > 7) newErrors.heightFeet = 'Feet must be between 4 and 7';
      if (!heightInches || isNaN(inches) || inches < 0 || inches >= 12) newErrors.heightInches = 'Inches must be between 0 and 11';
      if (!weightValue || isNaN(weight) || weight < 80 || weight > 400) newErrors.weight = 'Weight must be between 80 and 400 lbs';
    } else {
      const cm = parseFloat(heightCm);
      const kg = parseFloat(weightValue);
      if (!heightCm || isNaN(cm) || cm < 120 || cm > 210) newErrors.heightCm = 'Height must be between 120 and 210 cm';
      if (!weightValue || isNaN(kg) || kg < 36 || kg > 180) newErrors.weight = 'Weight must be between 36 and 180 kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please correct the errors in the form', severity: 'error' });
      return;
    }

    let totalHeightInches, totalWeightPounds;
    if (unitSystem === 'imperial') {
      const feet = parseFloat(heightFeet);
      const inches = parseFloat(heightInches);
      const weight = parseFloat(weightValue);
      totalHeightInches = feet * 12 + inches;
      totalWeightPounds = weight;
    } else {
      const cm = parseFloat(heightCm);
      const kg = parseFloat(weightValue);
      totalHeightInches = cm / 2.54;
      totalWeightPounds = kg * 2.20462;
    }

    onSubmit({
      name,
      ethnicity: ethnicityMap[ethnicity],
      eyeColor: eyeColorMap[eyeColor],
      height: totalHeightInches,
      weight: totalWeightPounds,
      gender: gender,
    });
    setSnackbar({ open: true, message: 'Form submitted successfully', severity: 'success' });
  };

  const handleRevert = () => {
    setUnitSystem('imperial');
    setName('');
    setEthnicity('');
    setEyeColor('');
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
    setErrors({});
    setSnackbar({ open: true, message: 'Form cleared', severity: 'info' });
  };

  return (
    <Stack spacing={6} sx={{ width: '100%', maxWidth: '600px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Personal Information
      </Typography>
      
      <FormControl error={!!errors.name} sx={{ mb: 3 }}>
        <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Name</FormLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter their name"
          size="medium"
          autoComplete="off"
          inputProps={{
            autoComplete: "off"
          }}
          sx={{
            bg: 'background.paper',
            '&:hover': { bg: 'action.hover' },
            '&.Mui-focused': { bg: 'background.paper' }
          }}
        />
        {errors.name && <FormHelperText error sx={{ mt: 0.5 }}>{errors.name}</FormHelperText>}
      </FormControl>

      <FormControl sx={{ mb: 3 }}>
        <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Unit System</FormLabel>
        <Select
          value={unitSystem}
          onChange={(e) => setUnitSystem(e.target.value)}
          size="medium"
          autoComplete="off"
          sx={{
            bg: 'background.paper',
            '&:hover': { bg: 'action.hover' },
            '&.Mui-focused': { bg: 'background.paper' }
          }}
        >
          <MenuItem value="imperial">Imperial (ft, in, lbs)</MenuItem>
          <MenuItem value="metric">Metric (cm, kg)</MenuItem>
        </Select>
      </FormControl>

      {unitSystem === 'imperial' ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <FormControl error={!!errors.heightFeet} fullWidth>
              <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Height (feet)</FormLabel>
              <Input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                size="medium"
                autoComplete="off"
                inputProps={{
                  autoComplete: "off"
                }}
                sx={{
                  bg: 'background.paper',
                  '&:hover': { bg: 'action.hover' },
                  '&.Mui-focused': { bg: 'background.paper' }
                }}
              />
              {errors.heightFeet && <FormHelperText error sx={{ mt: 0.5 }}>{errors.heightFeet}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl error={!!errors.heightInches} fullWidth>
              <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Height (inches)</FormLabel>
              <Input
                type="number"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                size="medium"
                autoComplete="off"
                inputProps={{
                  autoComplete: "off"
                }}
                sx={{
                  bg: 'background.paper',
                  '&:hover': { bg: 'action.hover' },
                  '&.Mui-focused': { bg: 'background.paper' }
                }}
              />
              {errors.heightInches && <FormHelperText error sx={{ mt: 0.5 }}>{errors.heightInches}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
      ) : (
        <FormControl error={!!errors.heightCm} sx={{ mb: 3 }}>
          <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Height (cm)</FormLabel>
          <Input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            size="medium"
            autoComplete="off"
            inputProps={{
              autoComplete: "off"
            }}
            sx={{
              bg: 'background.paper',
              '&:hover': { bg: 'action.hover' },
              '&.Mui-focused': { bg: 'background.paper' }
            }}
          />
          {errors.heightCm && <FormHelperText error sx={{ mt: 0.5 }}>{errors.heightCm}</FormHelperText>}
        </FormControl>
      )}

      <FormControl error={!!errors.weight} sx={{ mb: 3 }}>
        <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Weight</FormLabel>
        <Input
          type="number"
          value={weightValue}
          onChange={(e) => setWeightValue(e.target.value)}
          size="medium"
          autoComplete="off"
          inputProps={{
            autoComplete: "off"
          }}
          endAdornment={
            <InputAdornment position="end">
              <Typography variant="body2" color="text.secondary">
                {unitSystem === 'imperial' ? 'lbs' : 'kg'}
              </Typography>
            </InputAdornment>
          }
          sx={{
            bg: 'background.paper',
            '&:hover': { bg: 'action.hover' },
            '&.Mui-focused': { bg: 'background.paper' }
          }}
        />
        {errors.weight && <FormHelperText error sx={{ mt: 0.5 }}>{errors.weight}</FormHelperText>}
      </FormControl>

      <FormControl error={!!errors.ethnicity} sx={{ mb: 3 }}>
        <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Ethnicity</FormLabel>
        <Select
          value={ethnicity}
          onChange={(e) => setEthnicity(e.target.value)}
          size="medium"
          autoComplete="off"
          sx={{
            bg: 'background.paper',
            '&:hover': { bg: 'action.hover' },
            '&.Mui-focused': { bg: 'background.paper' }
          }}
        >
          {Object.keys(ethnicityMap).map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ mt: 0.5 }}>Used to adjust analysis based on general trends</FormHelperText>
        {errors.ethnicity && <FormHelperText error sx={{ mt: 0.5 }}>{errors.ethnicity}</FormHelperText>}
      </FormControl>

      <FormControl error={!!errors.eyeColor} sx={{ mb: 3 }}>
        <FormLabel sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>Eye Color</FormLabel>
        <Select
          value={eyeColor}
          onChange={(e) => setEyeColor(e.target.value)}
          size="medium"
          autoComplete="off"
          sx={{
            bg: 'background.paper',
            '&:hover': { bg: 'action.hover' },
            '&.Mui-focused': { bg: 'background.paper' }
          }}
        >
          {Object.keys(eyeColorMap).map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ mt: 0.5 }}>Mapped to categories for analysis purposes</FormHelperText>
        {errors.eyeColor && <FormHelperText error sx={{ mt: 0.5 }}>{errors.eyeColor}</FormHelperText>}
      </FormControl>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
        <MuiButton
          variant="outlined"
          onClick={handleRevert}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'translateY(-1px)',
              boxShadow: 1
            }
          }}
        >
          Clear Form
        </MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleSubmit}
          disabled={Object.keys(errors).length > 0 || !name || !ethnicity || !eyeColor || !weightValue || (unitSystem === 'imperial' ? !heightFeet || !heightInches : !heightCm)}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: 2
            }
          }}
        >
          Submit
        </MuiButton>
      </Stack>
    </Stack>
  );
};

// ResultDisplay Component
const ResultDisplay = ({ rating, tierLabel, faceRating }) => {
  const cappedRating = Math.min(Math.max(rating, 15.69), 99);
  const cappedFaceRating = faceRating ? Math.min(Math.max(faceRating, 15.69), 99) : null;

  return (
    <MuiBox
      position="relative"
      display="inline-flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        animation: 'bounceIn 1s ease-out',
        '@keyframes bounceIn': {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.05)', opacity: 0.8 },
          '70%': { transform: 'scale(0.9)', opacity: 0.9 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        }
      }}
    >
      <MuiBox display="flex" flexDirection="row" alignItems="center" gap={4}>
        <MuiBox position="relative" display="inline-flex">
          <CircularProgress
            variant="determinate"
            value={cappedRating}
            size={120}
            thickness={4}
            sx={{
              color: '#4CAF50',
              '& .MuiCircularProgress-circle': {
                transition: 'stroke-dashoffset 1s ease-in-out'
              }
            }}
          />
          <MuiBox
            top={0}
            left={0}
            bottom={0}
            right={0}
            position="absolute"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Typography variant="h4" component="div" color="textSecondary" fontWeight="bold">
              {cappedRating.toFixed(2)}
            </Typography>
            <Typography variant="body2" component="div" color="textPrimary">
              Overall
            </Typography>
          </MuiBox>
        </MuiBox>
        {cappedFaceRating !== null && (
          <MuiBox position="relative" display="inline-flex">
            <CircularProgress
              variant="determinate"
              value={cappedFaceRating}
              size={120}
              thickness={4}
              sx={{
                color: '#2196F3',
                '& .MuiCircularProgress-circle': {
                  transition: 'stroke-dashoffset 1s ease-in-out'
                }
              }}
            />
            <MuiBox
              top={0}
              left={0}
              bottom={0}
              right={0}
              position="absolute"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Typography variant="h4" component="div" color="textSecondary" fontWeight="bold">
                {cappedFaceRating.toFixed(2)}
              </Typography>
              <Typography variant="body2" component="div" color="textPrimary">
                Face
              </Typography>
            </MuiBox>
          </MuiBox>
        )}
      </MuiBox>
      <Typography variant="h6" component="div" color="textPrimary" mt={2}>
        {tierLabel}
      </Typography>
    </MuiBox>
  );
};

// DetailedResultDisplay Component with Improved Layout
const DetailedResultDisplay = ({ overallRating, faceRating, testScores, userInfo, setUserInfo }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Generate rating name using the test scores and user info
  const ratingName = useMemo(() => {
    if (!testScores || !userInfo) return null;
    
    // Combine test scores with height and weight for the generator
    const allScores = {
      ...testScores,
      Height: userInfo.height,
      Weight: userInfo.weight
    };
    
    return generateRatingName(allScores, userInfo.gender);
  }, [testScores, userInfo]);

  let tierLabel, tierDescription, tierEmoji;
  if (overallRating >= 80) {
    tierLabel = 'Very Attractive';
    tierDescription = 'Your features align closely with conventional standards of attractiveness.';
    tierEmoji = '😍';
  } else if (overallRating >= 60) {
    tierLabel = 'Attractive';
    tierDescription = 'Your features are generally appealing and well-proportioned.';
    tierEmoji = '😊';
  } else if (overallRating >= 40) {
    tierLabel = 'Average';
    tierDescription = 'Your features are typical and neither particularly striking nor unattractive.';
    tierEmoji = '😐';
  } else {
    tierLabel = 'Below Average';
    tierDescription = 'Some features may benefit from enhancement or styling to improve overall attractiveness.';
    tierEmoji = '😕';
  }

  const featureIcons = {
    'Carnal Tilt': '👁️',
    'Facial Thirds': '📏',
    'Cheekbone Location': '🦴',
    'Interocular Distance': '👀',
    'Jawline': '🦷',
    'Chin': '🧔',
    'Nose': '👃'
  };

  const featureDescriptions = {
    'Carnal Tilt': 'Measures the angle of the eyes relative to the horizontal plane.',
    'Facial Thirds': 'Evaluates the proportions of the forehead, midface, and lower face.',
    'Cheekbone Location': 'Assesses the prominence and position of the cheekbones.',
    'Interocular Distance': 'Analyzes the distance between the eyes relative to face width.',
    'Jawline': 'Evaluates the definition and symmetry of the jawline.',
    'Chin': 'Assesses the shape and proportion of the chin.',
    'Nose': 'Analyzes the size and shape of the nose relative to the face.'
  };

  const sortedFeatures = testScores
    ? Object.entries(testScores)
        .filter(([test]) => test !== 'Overall')
        .sort(([, a], [, b]) => b - a)
        .map(([test, score]) => ({
          test,
          score,
          impact: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement'
        }))
    : [];

  return (
    <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      {/* Initial Results View */}
      <MuiBox
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.02)',
          border: '1px solid rgba(0,0,0,0.1)',
          mb: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h2" component="div" gutterBottom sx={{ fontSize: '4rem' }}>
          {tierEmoji}
        </Typography>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {tierLabel}
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {overallRating.toFixed(1)} / 100
        </Typography>
        {ratingName && (
          <MuiBox
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'rgba(0,0,0,0.05)',
              borderRadius: 2,
              textAlign: 'left'
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {ratingName}
            </Typography>
          </MuiBox>
        )}
        <Typography variant="body1" paragraph sx={{ mt: 3 }}>
          {tierDescription}
        </Typography>
        <MuiButton
          variant="contained"
          color="primary"
          onClick={() => setShowDetails(!showDetails)}
          sx={{ mt: 2 }}
        >
          {showDetails ? 'Hide Details' : 'Show Detailed Analysis'}
        </MuiButton>
      </MuiBox>

      {/* Detailed Analysis Section */}
      {showDetails && (
        <MuiBox
          sx={{
            animation: 'slideIn 0.5s ease-out',
            '@keyframes slideIn': {
              '0%': { transform: 'translateY(20px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 }
            }
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight="bold" align="center" mb={4}>
            Detailed Feature Analysis
          </Typography>
          <Stack spacing={3}>
            {sortedFeatures.map(({ test, score, impact }, index) => {
              const color = impact === 'Excellent' ? '#4CAF50' : impact === 'Good' ? '#8BC34A' : impact === 'Average' ? '#FFC107' : '#FF5722';
              return (
                <MuiBox
                  key={test}
                  sx={{
                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                    '@keyframes slideIn': {
                      '0%': { transform: 'translateX(-20px)', opacity: 0 },
                      '100%': { transform: 'translateX(0)', opacity: 1 }
                    },
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(0,0,0,0.02)',
                    border: `1px solid ${color}20`
                  }}
                >
                  <MuiBox display="flex" alignItems="center" mb={1}>
                    <Typography variant="h4" mr={2}>
                      {featureIcons[test]}
                    </Typography>
                    <MuiBox flex={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {test}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {featureDescriptions[test]}
                      </Typography>
                    </MuiBox>
                    <Typography
                      variant="body1"
                      color={color}
                      fontWeight="bold"
                      sx={{
                        bgcolor: `${color}20`,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1
                      }}
                    >
                      {impact}
                    </Typography>
                  </MuiBox>
                  <MuiBox sx={{ position: 'relative', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      sx={{
                        height: 8,
                        borderRadius: 3,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: color,
                          borderRadius: 3,
                          transition: 'width 1s ease-in-out'
                        }
                      }}
                    />
                    <MuiBox
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 0.5
                      }}
                    >
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'medium' }}>
                        Low
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'medium' }}>
                        High
                      </Typography>
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              );
            })}
          </Stack>
        </MuiBox>
      )}

      {/* Share Section */}
      <MuiBox sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Share Your Results
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
          <MuiButton
            variant="contained"
            color="primary"
            startIcon={<span>📱</span>}
            onClick={() => {
              navigator.clipboard.writeText(`I scored ${overallRating.toFixed(1)}/100 on the LookzApp attractiveness test! ${tierEmoji} Try it yourself!`);
              setSnackbar({
                open: true,
                message: 'Results copied to clipboard! Share with your friends!',
                severity: 'success'
              });
            }}
          >
            Copy Results
          </MuiButton>
          <MuiButton
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Back to Home
          </MuiButton>
        </Stack>
      </MuiBox>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MuiBox>
  );
};

// Mapping Functions
const mapEyeColor = (eyeColor) => {
  const lowerEyeColor = eyeColor.toLowerCase();
  if (lowerEyeColor === 'blue') return 'blue';
  if (lowerEyeColor === 'green') return 'green';
  if (lowerEyeColor === 'brown') return 'brown';
  if (lowerEyeColor === 'hazel') return 'brown';
  if (lowerEyeColor === 'gray') return 'blue';
  return 'brown';
};

const getGenderCode = (gender) => {
  const lowerGender = gender.toLowerCase();
  if (lowerGender === 'male') return 'M';
  if (lowerGender === 'female') return 'W';
  return 'M';
};

// Main Component
const AttractivenessRatingProcess = () => {
  const { userData, rating: userRating, bestFeature, loading: loadingUser } = useUserData();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(null);
  const [scanFor, setScanFor] = useState(null);
  const [gender, setGender] = useState('');
  const [faceScore, setFaceScore] = useState(null);
  const [testScores, setTestScores] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [readyToScan, setReadyToScan] = useState(false);
  const { rating: rawRating } = useAttractivenessRating(userInfo);
  const cappedRating = rawRating !== null ? Math.min(Math.max(rawRating, 15.69), 99) : null;
  const toast = useToast();

  const testToPropMap = {
    'Carnal Tilt': 'carnalTilt',
    'Facial Thirds': 'facialThirds',
    'Cheekbone Location': 'cheekbone',
    'Interocular Distance': 'interocular',
    'Jawline': 'jawline',
    'Chin': 'chin',
    'Nose': 'nose',
  };

  useEffect(() => {
    if (!loadingUser && userData) {
      if (userData.timesRanked === 0) {
        setScanFor('myself');
        setUserInfo({
          name: userData.name || 'Self',
          ethnicity: userData.ethnicity,
          eyeColor: mapEyeColor(userData.eyeColor),
          height: userData.height,
          weight: userData.weight,
          gender: getGenderCode(userData.gender),
        });
        setCurrentStep('instructions');
      } else {
        setCurrentStep('scanForSelection');
      }
    }
  }, [loadingUser, userData]);

  useEffect(() => {
    if (
      scanFor === 'myself' &&
      !loadingUser &&
      userData &&
      cappedRating !== null &&
      !updated &&
      userData.timesRanked === 0
    ) {
      const updateUserRating = async () => {
        const userDocRef = doc(db, 'users', userData.id);
        const dividedRating = cappedRating / 10;
        try {
          await setDoc(
            userDocRef,
            {
              ranking: dividedRating,
              timesRanked: 1,
            },
            { merge: true }
          );
          setUpdated(true);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to save your rating.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      updateUserRating();
    }
  }, [loadingUser, userData, cappedRating, updated, toast, scanFor]);

  useEffect(() => {
    if (currentStep === 'result' && userInfo && cappedRating !== null) {
      const saveRatingToFirestore = async () => {
        try {
          const ratingData = {
            name: userInfo.name,
            uid: user.uid,
            ethnicity: userInfo.ethnicity,
            eyeColor: userInfo.eyeColor,
            height: userInfo.height,
            weight: userInfo.weight,
            gender: userInfo.gender,
            faceRating: userInfo.faceRating,
            testScores: userInfo.testScores,
            finalRating: cappedRating,
            params: userInfo.params,
            timestamp: new Date(),
          };
          await addDoc(collection(db, 'faceRatings'), ratingData);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to save rating to Firestore.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      saveRatingToFirestore();
    }
  }, [currentStep, userInfo, cappedRating, user, toast]);

  useEffect(() => {
    if (readyToScan && currentStep === 'instructions') {
      handleStartScanning();
    }
  }, [readyToScan]);

  const handleScanForSelection = (choice) => {
    if (choice === 'myself') {
      setScanFor('myself');
      setUserInfo({
        name: userData.name || 'Self',
        ethnicity: userData.ethnicity,
        eyeColor: mapEyeColor(userData.eyeColor),
        height: userData.height,
        weight: userData.weight,
        gender: getGenderCode(userData.gender),
      });
      setCurrentStep('instructions');
    } else {
      setScanFor('someoneElse');
      setCurrentStep('genderSelection');
    }
  };

  const handleGenderSelection = (selectedGender) => {
    setGender(selectedGender);
    setCurrentStep('instructions');
  };

  const handleStartScanning = () => {
    if (faceDetected) {
      setCurrentStep('scanning');
    } else {
      toast({
        title: 'Error',
        description: 'Face not detected.',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const handleScanningComplete = (result) => {
    if (result !== null) {
      const { finalScore, testAverages, measurements } = result;
      const transformedTestScores = {};
      for (const [test, score] of Object.entries(testAverages)) {
        const propName = testToPropMap[test];
        if (propName) {
          transformedTestScores[propName] = score;
        }
      }

      const faceRating = Object.values(testAverages).reduce((sum, score) => sum + score, 0) / Object.keys(testAverages).length;

      if (scanFor === 'myself') {
        const updatedUserInfo = {
          ...userInfo,
          ...transformedTestScores,
          testScores: testAverages,
          faceRating: faceRating,
          measurements: measurements,
        };
        setUserInfo(updatedUserInfo);
        setCurrentStep('result');
      } else {
        setFaceScore(finalScore + 7);
        setTestScores(testAverages);
        setUserInfo(prev => ({ ...prev, measurements: measurements }));
        setCurrentStep('form');
      }
    } else {
      toast({
        title: 'Error',
        description: 'No face detected during scan.',
        status: 'error',
        duration: 3000,
      });
      setCurrentStep('instructions');
    }
  };

  const handleFaceDetected = (detected) => {
    setFaceDetected(detected);
  };

  const handleFormSubmit = (info) => {
    const transformedTestScores = {};
    for (const [test, score] of Object.entries(testScores)) {
      const propName = testToPropMap[test];
      if (propName) {
        transformedTestScores[propName] = score;
      }
    }

    const faceRating = Object.values(testScores).reduce((sum, score) => sum + score, 0) / Object.keys(testScores).length;

    const updatedUserInfo = {
      name: info.name,
      ...transformedTestScores,
      testScores: testScores,
      ethnicity: info.ethnicity,
      eyeColor: info.eyeColor,
      height: info.height,
      weight: info.weight,
      gender: gender,
      faceRating: faceRating,
      measurements: userInfo.measurements,
    };
    setUserInfo(updatedUserInfo);
    setCurrentStep('result');
  };

  const testScoresValues = userInfo?.testScores ? Object.values(userInfo.testScores) : [];
  const currentFaceRating = testScoresValues.length > 0
    ? testScoresValues.reduce((sum, score) => sum + score, 0) / testScoresValues.length
    : null;

  const genderMap = {
    'Male': 'M',
    'Female': 'W',
    'Non-binary': 'M',
    'Other': 'W',
    'Prefer not to say': 'M',
  };

  const renderResults = () => {
    if (!cappedRating) return null;

    const getRatingColor = (score) => {
      if (score >= 8) return 'green.500';
      if (score >= 6) return 'teal.500';
      if (score >= 4) return 'yellow.500';
      if (score >= 2) return 'orange.500';
      return 'red.500';
    };

    const getRatingEmoji = (score) => {
      if (score >= 8) return '😍';
      if (score >= 6) return '😊';
      if (score >= 4) return '😐';
      if (score >= 2) return '😕';
      return '😢';
    };

    const getRatingText = (score) => {
      if (score >= 8) return 'Stunning!';
      if (score >= 6) return 'Attractive!';
      if (score >= 4) return 'Average';
      if (score >= 2) return 'Below Average';
      return 'Not Great';
    };

    return (
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={3}
        w={{ base: '90%', md: '600px' }}
        bg="rgba(0,0,0,0.85)"
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        boxShadow="xl"
        textAlign="center"
        backdropFilter="blur(10px)"
      >
        <Text
          fontSize={{ base: '3xl', md: '4xl' }}
          fontWeight="bold"
          color="white"
          mb={2}
        >
          Your Rating
        </Text>
        
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          mb={4}
        >
          <Text
            fontSize={{ base: '6xl', md: '8xl' }}
            color={getRatingColor(cappedRating)}
            mb={2}
            lineHeight={1}
          >
            {getRatingEmoji(cappedRating)}
          </Text>
          
          <Text
            fontSize={{ base: '4xl', md: '5xl' }}
            fontWeight="bold"
            color={getRatingColor(cappedRating)}
            mb={1}
          >
            {cappedRating.toFixed(1)}
          </Text>
          
          <Text
            fontSize={{ base: 'xl', md: '2xl' }}
            color="white"
            mb={4}
          >
            {getRatingText(cappedRating)}
          </Text>
        </Box>

        <Box
          bg="rgba(255,255,255,0.1)"
          p={4}
          borderRadius="lg"
          mb={4}
        >
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color="white"
            mb={2}
          >
            Rating Breakdown
          </Text>
          
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
          >
            {Object.entries(testScores).map(([category, score]) => (
              <Box
                key={category}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bg="rgba(255,255,255,0.05)"
                p={2}
                borderRadius="md"
              >
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color="white"
                  textTransform="capitalize"
                >
                  {category}
                </Text>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={getRatingColor(score)}
                  fontWeight="bold"
                >
                  {score.toFixed(1)}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Button
          colorScheme="teal"
          size={{ base: 'md', md: 'lg' }}
          onClick={() => {
            setFaceDetected(false);
            setCurrentStep('gender');
          }}
          w="100%"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg'
          }}
          transition="all 0.2s"
        >
          Try Again
        </Button>
      </Box>
    );
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.50)" py={0} px={5}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {currentStep === 'scanForSelection' && (
            <VStack spacing={8} align="center" maxW="800px" mx="auto" py={8}>
              <Heading 
                size="xl" 
                textAlign="center" 
                fontFamily={'Matt Bold'} 
                color="gray.800"
                mb={2}
              >
                Who are you scanning for?
              </Heading>
              <Text 
                fontSize="lg" 
                textAlign="center" 
                color="gray.600"
                maxW="600px"
                mb={6}
              >
                Choose whether you want to analyze your own appearance or someone else's
              </Text>
              <Grid 
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} 
                gap={6} 
                w="full"
                maxW="600px"
              >
                <Box
                  onClick={() => handleScanForSelection('myself')}
                  bg="white"
                  p={6}
                  borderRadius="xl"
                  cursor="pointer"
                  transition="all 0.3s ease"
                  _hover={{ transform: 'scale(1.02)', boxShadow: 'xl' }}
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  textAlign="center"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="6xl" mb={4}>👤</Text>
                  <Heading size="md" mb={2}>For Myself</Heading>
                  <Text color="gray.600">
                    Analyze your own facial features and get personalized insights
                  </Text>
                </Box>
                <Box
                  onClick={() => handleScanForSelection('someoneElse')}
                  bg="white"
                  p={6}
                  borderRadius="xl"
                  cursor="pointer"
                  transition="all 0.3s ease"
                  _hover={{ transform: 'scale(1.02)', boxShadow: 'xl' }}
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  textAlign="center"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="6xl" mb={4}>👥</Text>
                  <Heading size="md" mb={2}>For Someone Else</Heading>
                  <Text color="gray.600">
                    Analyze another person's facial features and compare results
                  </Text>
                </Box>
              </Grid>
            </VStack>
          )}
          {currentStep === 'genderSelection' && scanFor === 'someoneElse' && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Select Gender for Analysis</Heading>
              <Text fontSize="md" textAlign="center" maxW="400px">
                Gender is used to tailor the attractiveness analysis based on typical standards.
              </Text>
              <FormControl sx={{ minWidth: '300px' }}>
                <Select
                  value={gender}
                  onChange={(e) => handleGenderSelection(e.target.value)}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Choose gender
                  </MenuItem>
                  {Object.keys(genderMap).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          )}
          {(currentStep === 'instructions' || currentStep === 'scanning') && (
            <Box
              w={{ base: '100%', md: '640px' }}
              h="480px"
              mx="auto"
              borderWidth="2px"
              borderColor="gray.100"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="lg"
              bg="white"
            >
              <WebcamTiltDetector
                startScanning={currentStep === 'scanning'}
                onScanningComplete={handleScanningComplete}
                onFaceDetected={handleFaceDetected}
                gender={userInfo?.gender || gender}
                onReadyToScanChange={setReadyToScan}
              />
            </Box>
          )}
          {currentStep === 'instructions' && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Let's Scan the Face!</Heading>
              <Text fontSize="lg" textAlign="center" maxW="500px">
                Position the face in front of the camera with good lighting and keep it straight.
              </Text>
              <Button
                colorScheme="teal"
                size="lg"
                onClick={handleStartScanning}
                isDisabled={!faceDetected}
              >
                Start Scanning
              </Button>
            </VStack>
          )}
          {currentStep === 'form' && scanFor === 'someoneElse' && (
            <VStack spacing={8} align="center" maxW="800px" mx="auto" py={8}>
              <Heading 
                size="xl" 
                textAlign="center" 
                fontFamily={'Matt Bold'} 
                color="gray.800"
                mb={2}
              >
                Tell Us About Them
              </Heading>
              <Text 
                fontSize="lg" 
                textAlign="center" 
                color="gray.600"
                maxW="600px"
                mb={6}
              >
                Help us provide more accurate analysis by sharing some basic information
              </Text>
              <Box
                bg="white"
                p={8}
                borderRadius="xl"
                boxShadow="lg"
                border="1px solid"
                borderColor="gray.200"
                w="full"
                maxW="600px"
              >
                <UserInfoForm onSubmit={handleFormSubmit} gender={gender} />
              </Box>
            </VStack>
          )}
          {currentStep === 'result' && cappedRating !== null && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Here's the Score!</Heading>
              <DetailedResultDisplay
                overallRating={cappedRating}
                faceRating={currentFaceRating}
                testScores={userInfo.testScores}
                userInfo={userInfo}
                setUserInfo={setUserInfo}
              />
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default AttractivenessRatingProcess;