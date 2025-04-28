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
  Typography,
  Grid,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText,
  Input,
  Stack,
  FormLabel,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  TextField,
  styled,
  keyframes
} from '@mui/material';
import { useToast } from '@chakra-ui/toast';
import { maleConfig } from '../hooks/faceRating/maleConfig';
import { femaleConfig } from '../hooks/faceRating/femaleConfig';
import { generateRatingName } from '../utils/ratingNameGenerator';
import FaceIcon from '@mui/icons-material/Face';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIndicator from './LoadingIndicator';

// Animations
const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Styled Components
const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)'
  },
}));

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  animation: `${gradientFlow} 6s ease infinite`,
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(120deg, transparent, rgba(250, 14, 164, 0.2), transparent)',
    transition: '0.5s'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
    '&:before': {
      left: '100%'
    }
  }
});

const StyledWebcamContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  maxWidth: '800px',
  maxHeight: '600px',
  margin: '0 auto',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(11, 43, 77, 0.2)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  background: 'linear-gradient(45deg, rgba(13, 17, 44, 0.7), rgba(102, 4, 62, 0.7))',
  backdropFilter: 'blur(16px)',
}));

const StyledFlashOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(45deg, rgba(9, 194, 247, 0.8), rgba(250, 14, 164, 0.8))',
  opacity: 0,
  transition: 'opacity 0.5s ease-out',
  zIndex: 2,
}));

const StyledFaceDetectedOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '20%',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 3,
  textAlign: 'center',
  background: 'rgba(13, 17, 44, 0.85)',
  backdropFilter: 'blur(8px)',
  padding: theme.spacing(2, 3),
  borderRadius: '16px',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  animation: `${fadeIn} 0.5s ease-out`,
}));

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
      
      await tf.setBackend('webgl');
      setLoadingProgress(30);
      
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
    const DETECTION_INTERVAL = 100;

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

      if (predictions.length > 0) {
        const face = predictions[0];
        const landmarks = face.scaledMesh;
        const boundingBox = face.boundingBox;

        landmarks.forEach(([x, y]) => {
          context.beginPath();
          context.arc(x, y, 1, 0, 2 * Math.PI);
          context.fillStyle = 'rgba(0, 255, 255, 0.5)';
          context.fill();
        });

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
      width="100%" 
      height="100%"
      maxWidth={{ base: '100%', md: '800px' }}
      maxHeight={{ base: '100%', md: '600px' }}
      margin="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      sx={{
        background: `
          radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
          linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
        `,
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(45deg, 
              rgba(9, 194, 247, 0.05) 0%, 
              rgba(250, 14, 164, 0.05) 50%,
              rgba(9, 194, 247, 0.05) 100%)
          `,
          animation: `${gradientFlow} 12s ease infinite`,
          backgroundSize: '200% 200%',
          opacity: 0.3,
        }
      }}
    >
      {isLoading && (
        <LoadingIndicator
          progress={loadingProgress}
          message="Loading Face Detection..."
          subMessage={loadingProgress < 30 ? 'Initializing...' : 
                      loadingProgress < 100 ? 'Loading Model...' : 
                      'Almost Ready...'}
        />
      )}
      {!model && !webcamError && !isLoading && (
        <LoadingIndicator
          progress={0}
          message="Preparing Camera..."
          subMessage=""
        />
      )}
      {webcamError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(13, 17, 44, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 4,
          }}
        >
          <ErrorOutlineIcon 
            sx={{ 
              fontSize: 48, 
              color: 'error.main',
              mb: 2,
              filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.3))'
            }} 
          />
          <Typography 
            variant="h6" 
            color="error"
            mb={2}
            sx={{ 
              fontSize: { base: '1rem', md: '1.25rem' },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 24 }} />
            Camera Error
          </Typography>
          <Typography 
            variant="body1" 
            color="error"
            mb={3}
            sx={{ 
              fontSize: { base: '0.875rem', md: '1rem' },
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            {webcamError}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setWebcamError(null);
              setIsLoading(true);
              loadModel().then(startVideo);
            }}
            sx={{
              background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
              backgroundSize: '200% 200%',
              animation: `${gradientFlow} 6s ease infinite`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
              }
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
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: '6rem', 
              fontWeight: 800, 
              background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              textShadow: '0 0 20px rgba(9, 194, 247, 0.5)',
              animation: `${fadeIn} 0.5s ease-out`
            }}
          >
            {countdown}
          </Typography>
          {countdown === 0 && (
            <CheckCircleOutlineIcon 
              sx={{ 
                fontSize: 48, 
                color: '#4CAF50',
                filter: 'drop-shadow(0 0 8px rgba(76, 175, 80, 0.3))',
                animation: `${fadeIn} 0.5s ease-out`
              }} 
            />
          )}
        </Box>
      )}
      {showFlash && (
        <StyledFlashOverlay sx={{ opacity: 0.8 }} />
      )}
      {!faceDetected && !isLoading && !webcamError && (
        <StyledFaceDetectedOverlay>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#fff',
              fontSize: { base: '0.875rem', md: '1rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <FaceIcon sx={{ fontSize: 20 }} />
            Please position your face in the frame
          </Typography>
        </StyledFaceDetectedOverlay>
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
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focused': { bgcolor: 'background.paper' }
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
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focused': { bgcolor: 'background.paper' }
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
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&.Mui-focused': { bgcolor: 'background.paper' }
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
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&.Mui-focused': { bgcolor: 'background.paper' }
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
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-focused': { bgcolor: 'background.paper' }
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
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focused': { bgcolor: 'background.paper' }
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
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focused': { bgcolor: 'background.paper' }
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
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focused': { bgcolor: 'background.paper' }
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
        <Button
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
        </Button>
        <Button
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
        </Button>
      </Stack>
    </Stack>
  );
};

// ResultDisplay Component
const ResultDisplay = ({ rating, tierLabel, faceRating }) => {
  const cappedRating = Math.min(Math.max(rating, 15.69), 99);
  const cappedFaceRating = faceRating ? Math.min(Math.max(faceRating, 15.69), 99) : null;

  return (
    <Box
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
      <Box display="flex" flexDirection="row" alignItems="center" gap={4}>
        <Box position="relative" display="inline-flex">
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
          <Box
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
          </Box>
        </Box>
        {cappedFaceRating !== null && (
          <Box position="relative" display="inline-flex">
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
            <Box
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
            </Box>
          </Box>
        )}
      </Box>
      <Typography variant="h6" component="div" color="textPrimary" mt={2}>
        {tierLabel}
      </Typography>
    </Box>
  );
};

// DetailedResultDisplay Component with Improved Layout
const DetailedResultDisplay = ({ overallRating, faceRating, testScores, userInfo, setUserInfo }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const ratingName = useMemo(() => {
    if (!testScores || !userInfo) return null;
    
    const allScores = {
      ...testScores,
      Height: userInfo.height,
      Weight: userInfo.weight
    };
    
    return generateRatingName(allScores, userInfo.gender, userInfo.ethnicity, userInfo.eyeColor);
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
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Box
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
          <Box
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
          </Box>
        )}
        <Typography variant="body1" paragraph sx={{ mt: 3 }}>
          {tierDescription}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowDetails(!showDetails)}
          sx={{ mt: 2 }}
        >
          {showDetails ? 'Hide Details' : 'Show Detailed Analysis'}
        </Button>
      </Box>

      {showDetails && (
        <Box
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
                <Box
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
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h4" mr={2}>
                      {featureIcons[test]}
                    </Typography>
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {test}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {featureDescriptions[test]}
                      </Typography>
                    </Box>
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
                  </Box>
                  <Box sx={{ position: 'relative', mt: 1 }}>
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
                    <Box
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
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Share Your Results
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
          <Button
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
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Stack>
      </Box>

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
    </Box>
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
          linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
        `,
        color: '#fff',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(rgba(9, 194, 247, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(9, 194, 247, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.3,
        }}
      />
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {currentStep === 'scanForSelection' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4
              }}
            >
              Who are you scanning?
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <GlassCard
                  onClick={() => handleScanForSelection('myself')}
                  sx={{ cursor: 'pointer', height: '100%' }}
                >
                  <Typography variant="h4" sx={{ mb: 2 }}>👤 For Myself</Typography>
                  <Typography color="rgba(255,255,255,0.7)">
                    Analyze your own facial features with AI-powered insights
                  </Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <GlassCard
                  onClick={() => handleScanForSelection('someoneElse')}
                  sx={{ cursor: 'pointer', height: '100%' }}
                >
                  <Typography variant="h4" sx={{ mb: 2 }}>👥 For Someone Else</Typography>
                  <Typography color="rgba(255,255,255,0.7)">
                    Analyze another person's features with privacy-focused technology
                  </Typography>
                </GlassCard>
              </Grid>
            </Grid>
          </Box>
        )}
        {currentStep === 'genderSelection' && scanFor === 'someoneElse' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4
              }}
            >
              Select Gender for Analysis
            </Typography>
            <Typography color="rgba(255,255,255,0.7)" mb={4}>
              Gender is used to tailor the attractiveness analysis based on typical standards.
            </Typography>
            <FormControl sx={{ minWidth: '300px' }}>
              <Select
                value={gender}
                onChange={(e) => handleGenderSelection(e.target.value)}
                displayEmpty
                fullWidth
                sx={{
                  bgcolor: 'rgba(13, 17, 44, 0.7)',
                  color: '#fff',
                  '& .MuiSelect-icon': { color: '#fff' },
                  '&:hover': { bgcolor: 'rgba(13, 17, 44, 0.85)' }
                }}
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
          </Box>
        )}
        {(currentStep === 'instructions' || currentStep === 'scanning') && (
          <Box sx={{ my: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4
              }}
            >
              {currentStep === 'scanning' ? 'Analyzing Features...' : 'Ready to Scan'}
            </Typography>
            <StyledWebcamContainer>
              <WebcamTiltDetector
                startScanning={currentStep === 'scanning'}
                onScanningComplete={handleScanningComplete}
                onFaceDetected={handleFaceDetected}
                gender={userInfo?.gender || gender}
                onReadyToScanChange={setReadyToScan}
              />
            </StyledWebcamContainer>
            {currentStep === 'instructions' && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <GradientButton
                  variant="contained"
                  size="large"
                  onClick={handleStartScanning}
                  disabled={!faceDetected}
                  sx={{ px: 6, py: 2, borderRadius: '16px' }}
                >
                  Begin Facial Analysis
                </GradientButton>
              </Box>
            )}
          </Box>
        )}
        {currentStep === 'form' && scanFor === 'someoneElse' && (
          <Box sx={{ py: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4
              }}
            >
              Tell Us About Them
            </Typography>
            <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
              <UserInfoForm onSubmit={handleFormSubmit} gender={gender} />
            </Box>
          </Box>
        )}
        {currentStep === 'result' && cappedRating !== null && (
          <Box sx={{ py: 8 }}>
            <DetailedResultDisplay
              overallRating={cappedRating}
              faceRating={currentFaceRating}
              testScores={userInfo.testScores}
              userInfo={userInfo}
              setUserInfo={setUserInfo}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default AttractivenessRatingProcess;