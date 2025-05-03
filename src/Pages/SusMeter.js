import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';
import { useAttractivenessRating } from '../hooks/faceRating/useAttractivenessRating';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
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
  keyframes,
  InputLabel,
  Button as MuiButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardActions,
  Tooltip
} from '@mui/material';
import { useToast } from '@chakra-ui/toast';
import { maleConfig } from '../hooks/faceRating/maleConfig';
import { femaleConfig } from '../hooks/faceRating/femaleConfig';
import { generateRatingName } from '../utils/ratingNameGenerator';
import {
  Face,
  Group,
  Visibility,
  Straighten,
  RemoveRedEye,
  Person,
  Psychology,
  Favorite,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Share,
  FaceRetouchingNatural,
  Face3
} from '@mui/icons-material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIndicator from '../Components/LoadingIndicator';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

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
  position: 'relative',
  overflow: 'hidden',
  aspectRatio: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  '&:before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `
      linear-gradient(rgba(9, 194, 247, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(9, 194, 247, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    opacity: 0.3,
  }
}));

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  animation: `${gradientFlow} 6s ease infinite`,
  backdropFilter: 'none',
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

const StyledCountdownContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const StyledInstructionText = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
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

// Define tests
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
  { label: 'Male', value: 'M', icon: <Face /> },
  { label: 'Female', value: 'W', icon: <Face3 /> },
  { label: 'Non-binary', value: 'M', icon: <Psychology /> },
  { label: 'Other', value: 'W', icon: <Group /> }
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

// Add new function for precise eye measurements
const calculateEyeMeasurements = (landmarks) => {
  // Left eye points (more precise)
  const leftEyeOuter = landmarks[33];  // Outer corner
  const leftEyeInner = landmarks[133]; // Inner corner
  const leftEyeTop = landmarks[159];   // Top point
  const leftEyeBottom = landmarks[145]; // Bottom point
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145, 173, 157, 158, 160, 161, 246]);
  
  // Right eye points (more precise)
  const rightEyeOuter = landmarks[362]; // Outer corner
  const rightEyeInner = landmarks[263]; // Inner corner
  const rightEyeTop = landmarks[386];   // Top point
  const rightEyeBottom = landmarks[374]; // Bottom point
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374, 380, 381, 382, 362, 398, 384]);

  // Calculate precise measurements
  const leftEyeWidth = Math.sqrt(
    Math.pow(leftEyeOuter[0] - leftEyeInner[0], 2) +
    Math.pow(leftEyeOuter[1] - leftEyeInner[1], 2)
  );
  
  const rightEyeWidth = Math.sqrt(
    Math.pow(rightEyeOuter[0] - rightEyeInner[0], 2) +
    Math.pow(rightEyeOuter[1] - rightEyeInner[1], 2)
  );

  const leftEyeHeight = Math.sqrt(
    Math.pow(leftEyeTop[0] - leftEyeBottom[0], 2) +
    Math.pow(leftEyeTop[1] - leftEyeBottom[1], 2)
  );

  const rightEyeHeight = Math.sqrt(
    Math.pow(rightEyeTop[0] - rightEyeBottom[0], 2) +
    Math.pow(rightEyeTop[1] - rightEyeBottom[1], 2)
  );

  // Calculate eye angles
  const leftEyeAngle = Math.atan2(
    leftEyeTop[1] - leftEyeBottom[1],
    leftEyeTop[0] - leftEyeBottom[0]
  ) * (180 / Math.PI);

  const rightEyeAngle = Math.atan2(
    rightEyeTop[1] - rightEyeBottom[1],
    rightEyeTop[0] - rightEyeBottom[0]
  ) * (180 / Math.PI);

  // Calculate precise interocular distance
  const interocularDistance = Math.sqrt(
    Math.pow(rightEyeCenter[0] - leftEyeCenter[0], 2) +
    Math.pow(rightEyeCenter[1] - leftEyeCenter[1], 2) +
    Math.pow(rightEyeCenter[2] - leftEyeCenter[2], 2)
  );

  // Calculate symmetry scores
  const eyeSymmetryScore = 100 - (Math.abs(leftEyeWidth - rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth) * 100);
  const eyeHeightSymmetry = 100 - (Math.abs(leftEyeHeight - rightEyeHeight) / Math.max(leftEyeHeight, rightEyeHeight) * 100);
  const eyeAngleDifference = Math.abs(leftEyeAngle - rightEyeAngle);

  return {
    leftEyeCenter,
    rightEyeCenter,
    leftEyeWidth,
    rightEyeWidth,
    leftEyeHeight,
    rightEyeHeight,
    leftEyeAngle,
    rightEyeAngle,
    interocularDistance,
    eyeSymmetryScore,
    eyeHeightSymmetry,
    eyeAngleDifference
  };
};

// Algorithm Functions for Each Feature
const calculateCarnalTiltAlgo1 = (angle, multiplier, multiplierFactor) => {
  const adjustedMultiplier = multiplier * multiplierFactor;
  return Math.max(0, 100 - angle * adjustedMultiplier);
};

const calculateCarnalTiltAlgo2 = (leftEyeY, rightEyeY, faceHeight) => {
  const diff = Math.abs(leftEyeY - rightEyeY);
  const normalizedDiff = diff / faceHeight;
  const k = 10;
  return 100 * Math.exp(-k * normalizedDiff);
};

const calculateCarnalTiltAlgo3 = (angle) => {
  const idealAngle = 0;
  const deviation = Math.abs(angle - idealAngle);
  const multiplier = 5;
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateFacialThirdsAlgo1 = (upperThirdRatio, idealThird = 1/3) => {
  const deviation = Math.abs(upperThirdRatio - idealThird);
  return Math.max(0, 100 - deviation * 100);
};

const calculateFacialThirdsAlgo2 = (middleThirdRatio, idealThird = 1/3) => {
  const deviation = Math.abs(middleThirdRatio - idealThird);
  return Math.max(0, 100 - deviation * 100);
};

const calculateFacialThirdsAlgo3 = (lowerThirdRatio, idealThird = 1/3) => {
  const deviation = Math.abs(lowerThirdRatio - idealThird);
  return Math.max(0, 100 - deviation * 100);
};

const calculateCheekboneAlgo1 = (cheekHeightDiff, faceHeightFull) => {
  const normalizedDiff = faceHeightFull > 0 ? cheekHeightDiff / faceHeightFull : 0;
  return 100 * Math.exp(-10 * normalizedDiff);
};

const calculateCheekboneAlgo2 = (cheekAvgY, faceHeightFull) => {
  const idealPosition = faceHeightFull * 0.5; // Midpoint of face
  const deviation = Math.abs(cheekAvgY - idealPosition) / faceHeightFull;
  return Math.max(0, 100 - deviation * 100);
};

const calculateCheekboneAlgo3 = (leftCheekX, rightCheekX, faceWidth) => {
  const midpoint = (leftCheekX + rightCheekX) / 2;
  const faceCenter = faceWidth / 2;
  const normalizedDiff = Math.abs(midpoint - faceCenter) / faceWidth;
  return 100 * Math.exp(-10 * normalizedDiff);
};

const calculateInterocularAlgo1 = (measurements) => {
  // Algorithm 1: Precise Golden Ratio Analysis
  const idealRatio = 1.618;
  const currentRatio = measurements.eyeToEyeWidthRatio || 0;
  const deviation = Math.abs(currentRatio - idealRatio);
  const symmetryBonus = ((measurements.eyeSymmetryScore || 0) + (measurements.eyeHeightSymmetry || 0)) / 2;
  return Math.max(0, (100 - (deviation * 50)) * 0.7 + symmetryBonus * 0.3);
};

const calculateInterocularAlgo2 = (measurements) => {
  // Algorithm 2: Comprehensive Proportional Analysis
  const ratios = [
    measurements.interocularRatio || 0,    // Eye distance to face width
    measurements.eyeWidthRatio || 0,       // Eye width to face width
    measurements.eyeHeightRatio || 0,      // Eye height to width
    measurements.eyeToEyeWidthRatio || 0   // Eye distance to eye width
  ];
  
  const idealRatios = [0.45, 0.25, 0.3, 2.5];
  const weights = [0.35, 0.25, 0.2, 0.2];
  
  let totalScore = 0;
  ratios.forEach((ratio, index) => {
    const deviation = Math.abs(ratio - idealRatios[index]);
    const ratioScore = Math.max(0, 100 - (deviation * 100));
    totalScore += ratioScore * weights[index];
  });
  
  // Add angle difference penalty
  const anglePenalty = Math.min(100, (measurements.eyeAngleDifference || 0) * 2);
  return totalScore * 0.8 + (100 - anglePenalty) * 0.2;
};

const calculateInterocularAlgo3 = (measurements) => {
  // Algorithm 3: Advanced Symmetry and Balance Analysis with Enhanced Variation
  
  // Base symmetry score (0-100)
  const symmetryScore = ((measurements.eyeSymmetryScore || 0) + (measurements.eyeHeightSymmetry || 0)) / 2;
  
  // Angle alignment penalty (0-100)
  const anglePenalty = Math.min(100, (measurements.eyeAngleDifference || 0) * 2);
  
  // Balance score based on ideal eye spacing (0-100)
  const idealRatio = 2.5; // Ideal eye-to-eye width ratio
  const currentRatio = measurements.eyeToEyeWidthRatio || 0;
  const ratioDeviation = Math.abs(currentRatio - idealRatio);
  const balanceScore = Math.max(0, 100 - (ratioDeviation * 40)); // Increased penalty for deviation
  
  // Depth consideration (0-100)
  const depthScore = measurements.interocularDistance > 0 ? 
    Math.min(100, measurements.interocularDistance * 10) : 50;
  
  // Additional variation factors
  const eyeSizeScore = Math.min(100, ((measurements.leftEyeWidth + measurements.rightEyeWidth) / 2) * 20);
  const eyeShapeScore = Math.min(100, ((measurements.leftEyeHeight + measurements.rightEyeHeight) / 2) * 15);
  
  // Calculate weighted score with enhanced variation
  const baseScore = (
    symmetryScore * 0.25 + 
    (100 - anglePenalty) * 0.20 + 
    balanceScore * 0.25 + 
    depthScore * 0.10 +
    eyeSizeScore * 0.10 +
    eyeShapeScore * 0.10
  );
  
  // Apply non-linear scaling to increase variation
  const scaledScore = Math.pow(baseScore / 100, 1.2) * 100;
  
  // Add small random variation (±2 points) to break ties
  const finalVariation = (Math.random() * 4) - 2;
  
  return Math.max(0, Math.min(100, scaledScore + finalVariation));
};

const calculateJawlineAlgo1 = (ratio, idealRatio = 0.7) => {
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * 100);
};

const calculateJawlineAlgo2 = (leftJawX, rightJawX, faceWidth) => {
  const diff = Math.abs(leftJawX - rightJawX - faceWidth * 0.7);
  const normalizedDiff = diff / faceWidth;
  return 100 * Math.exp(-10 * normalizedDiff);
};

const calculateJawlineAlgo3 = (jawAngle) => {
  const idealAngle = 130; // Example ideal jaw angle
  const deviation = Math.abs(jawAngle - idealAngle);
  return Math.max(0, 100 - deviation * 2);
};

const calculateChinMeasurements = (landmarks, gender) => {
  try {
    // Get key points for chin measurement
    const subnasale = landmarks[4];  // Base of nose
    const pogonion = landmarks[152]; // Chin point
    const gnathion = landmarks[199]; // Bottom of chin
    const leftJaw = landmarks[123];  // Left jaw point
    const rightJaw = landmarks[352]; // Right jaw point

    // Calculate chin length
    const chinLength = Math.sqrt(
      Math.pow(pogonion[0] - subnasale[0], 2) +
      Math.pow(pogonion[1] - subnasale[1], 2)
    );

    // Calculate face height
    const faceHeight = Math.sqrt(
      Math.pow(gnathion[0] - landmarks[10][0], 2) + // From top of forehead
      Math.pow(gnathion[1] - landmarks[10][1], 2)
    );

    // Calculate chin ratio
    const chinRatio = faceHeight > 0 ? chinLength / faceHeight : 0;

    // Calculate chin alignment
    const faceCenterX = (leftJaw[0] + rightJaw[0]) / 2;
    const chinAlignment = Math.abs(pogonion[0] - faceCenterX);

    // Calculate chin definition (angle between jaw and chin)
    const leftAngle = Math.atan2(
      pogonion[1] - leftJaw[1],
      pogonion[0] - leftJaw[0]
    ) * (180 / Math.PI);

    const rightAngle = Math.atan2(
      pogonion[1] - rightJaw[1],
      pogonion[0] - rightJaw[0]
    ) * (180 / Math.PI);

    const chinDefinition = Math.abs(leftAngle - rightAngle);

    return {
      chinLength: chinLength || 0,
      faceHeight: faceHeight || 0,
      chinRatio: chinRatio || 0,
      chinAlignment: chinAlignment || 0,
      chinDefinition: chinDefinition || 0,
      idealRatio: gender === 'W' ? 0.21 : 0.27 // 21% for women, 27% for men
    };
  } catch (error) {
    console.error('Error in calculateChinMeasurements:', error);
    return {
      chinLength: 0,
      faceHeight: 0,
      chinRatio: 0,
      chinAlignment: 0,
      chinDefinition: 0,
      idealRatio: gender === 'W' ? 0.21 : 0.27
    };
  }
};

const calculateChinAlgo1 = (measurements) => {
  try {
    if (!measurements || typeof measurements.chinRatio !== 'number' || typeof measurements.idealRatio !== 'number') {
      return 50; // Return middle score instead of 0
    }

    // Simple ratio-based scoring
    const ratio = measurements.chinRatio / measurements.idealRatio;
    
    if (ratio >= 0.9 && ratio <= 1.1) {
      return 100; // Within 10% of ideal
    } else if (ratio >= 0.8 && ratio <= 1.2) {
      return 80; // Within 20% of ideal
    } else if (ratio >= 0.7 && ratio <= 1.3) {
      return 60; // Within 30% of ideal
    } else {
      return 40; // Outside ideal range
    }
  } catch (error) {
    console.error('Error in calculateChinAlgo1:', error);
    return 50;
  }
};

const calculateChinAlgo2 = (measurements) => {
  try {
    if (!measurements || typeof measurements.chinAlignment !== 'number' || typeof measurements.chinDefinition !== 'number') {
      return 50;
    }

    // Simple alignment scoring
    const alignmentScore = Math.max(0, 100 - (measurements.chinAlignment * 5));
    
    // Simple definition scoring
    const definitionScore = Math.max(0, 100 - (measurements.chinDefinition * 5));
    
    // Average of both scores
    return Math.round((alignmentScore + definitionScore) / 2);
  } catch (error) {
    console.error('Error in calculateChinAlgo2:', error);
    return 50;
  }
};

const calculateChinAlgo3 = (measurements) => {
  try {
    if (!measurements) {
      return 50;
    }

    // Get base scores
    const ratioScore = calculateChinAlgo1(measurements);
    const alignmentScore = calculateChinAlgo2(measurements);
    
    // Simple length score
    const lengthScore = measurements.chinLength > 0 ? 
      Math.min(100, measurements.chinLength * 2) : 50;
    
    // Simple symmetry score
    const symmetryScore = Math.max(0, 100 - (measurements.chinAlignment * 5));
    
    // Weighted average
    return Math.round(
      (ratioScore * 0.4) +
      (alignmentScore * 0.3) +
      (lengthScore * 0.15) +
      (symmetryScore * 0.15)
    );
  } catch (error) {
    console.error('Error in calculateChinAlgo3:', error);
    return 50;
  }
};

const calculateNoseAlgo1 = (ratio, idealRatio = 0.25) => {
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * 100);
};

const calculateNoseAlgo2 = (noseWidth, noseLength) => {
  const ratio = noseWidth / noseLength;
  const idealRatio = 0.7;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * 100);
};

const calculateNoseAlgo3 = (leftNoseX, rightNoseX, faceWidth) => {
  const midpoint = (leftNoseX + rightNoseX) / 2;
  const faceCenter = faceWidth / 2;
  const diff = Math.abs(midpoint - faceCenter);
  const normalizedDiff = diff / faceWidth;
  return 100 * Math.exp(-10 * normalizedDiff);
};

// WebcamTiltDetector Component with Face Scanning Logic
const WebcamTiltDetector = ({ startScanning, onScanningComplete, onFaceDetected, gender, onReadyToScanChange, currentStep }) => {
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
  const [measurements, setMeasurements] = useState(null);
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

        // Get precise eye measurements
        const eyeMeasurements = calculateEyeMeasurements(landmarks);
        
        // Calculate additional ratios and measurements
        const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
        const faceHeight = boundingBox.bottomRight[1] - boundingBox.topLeft[1];
        const averageEyeWidth = (eyeMeasurements.leftEyeWidth + eyeMeasurements.rightEyeWidth) / 2;
        const averageEyeHeight = (eyeMeasurements.leftEyeHeight + eyeMeasurements.rightEyeHeight) / 2;
        
        // Enhanced measurements
        const chinMeasurements = calculateChinMeasurements(landmarks, gender);
        const measurementsData = {
          carnalTiltAngle: Math.abs(eyeMeasurements.rightEyeAngle - eyeMeasurements.leftEyeAngle) * (180 / Math.PI),
          upperThirdRatio: 0,
          middleThirdRatio: 0,
          lowerThirdRatio: 0,
          cheekHeightDiff: 0,
          cheekAvgY: 0,
          leftCheekX: 0,
          rightCheekX: 0,
          eyeDistance: eyeMeasurements.interocularDistance,
          faceWidth,
          leftEyeWidth: eyeMeasurements.leftEyeWidth,
          rightEyeWidth: eyeMeasurements.rightEyeWidth,
          averageEyeWidth,
          interocularRatio: eyeMeasurements.interocularDistance / faceWidth,
          eyeWidthRatio: (eyeMeasurements.leftEyeWidth + eyeMeasurements.rightEyeWidth) / (2 * faceWidth),
          eyeHeightRatio: (eyeMeasurements.leftEyeHeight + eyeMeasurements.rightEyeHeight) / (2 * (eyeMeasurements.leftEyeWidth + eyeMeasurements.rightEyeWidth)),
          eyeToEyeWidthRatio: eyeMeasurements.interocularDistance / ((eyeMeasurements.leftEyeWidth + eyeMeasurements.rightEyeWidth) / 2),
          eyeSymmetryScore: eyeMeasurements.eyeSymmetryScore,
          eyeHeightSymmetry: eyeMeasurements.eyeHeightSymmetry,
          eyeAngleDifference: eyeMeasurements.eyeAngleDifference,
          interocularDistance: eyeMeasurements.interocularDistance,
          noseToEyeRatio: 0,
          eyeHeight: eyeMeasurements.rightEyeHeight - eyeMeasurements.leftEyeHeight,
          eyeHeightRatio: (eyeMeasurements.rightEyeHeight - eyeMeasurements.leftEyeHeight) / averageEyeHeight,
          eyeTilt: Math.abs(eyeMeasurements.rightEyeAngle - eyeMeasurements.leftEyeAngle) * (180 / Math.PI),
          noseWidth: 0,
          jawWidth: 0,
          jawRatio: 0,
          leftJawX: 0,
          rightJawX: 0,
          jawAngle: 0,
          chinLength: chinMeasurements.chinLength,
          faceHeight: chinMeasurements.faceHeight,
          chinRatio: chinMeasurements.chinRatio,
          chinAlignment: chinMeasurements.chinAlignment,
          chinDefinition: chinMeasurements.chinDefinition,
          idealChinRatio: chinMeasurements.idealRatio,
          ...eyeMeasurements,
        };

        // Calculate three algorithm scores for each feature
        const featureScores = {};
        featureScores['Carnal Tilt'] = {
          algo1: calculateCarnalTiltAlgo1(measurementsData.carnalTiltAngle, config.params['Carnal Tilt'], config.carnalTiltMultiplierFactor),
          algo2: calculateCarnalTiltAlgo2(eyeMeasurements.leftEyeCenter[1], eyeMeasurements.rightEyeCenter[1], faceHeight),
          algo3: calculateCarnalTiltAlgo3(measurementsData.carnalTiltAngle)
        };

        featureScores['Facial Thirds'] = {
          algo1: calculateFacialThirdsAlgo1(measurementsData.upperThirdRatio),
          algo2: calculateFacialThirdsAlgo2(measurementsData.middleThirdRatio),
          algo3: calculateFacialThirdsAlgo3(measurementsData.lowerThirdRatio)
        };

        featureScores['Cheekbone Location'] = {
          algo1: calculateCheekboneAlgo1(measurementsData.cheekHeightDiff, faceHeight),
          algo2: calculateCheekboneAlgo2(measurementsData.cheekAvgY, faceHeight),
          algo3: calculateCheekboneAlgo3(measurementsData.leftCheekX, measurementsData.rightCheekX, faceWidth)
        };

        featureScores['Interocular Distance'] = {
          algo3: calculateInterocularAlgo3(measurementsData),
          average: calculateInterocularAlgo3(measurementsData) // Set average to algo3 score
        };

        featureScores['Jawline'] = {
          algo1: calculateJawlineAlgo1(measurementsData.jawRatio),
          algo2: calculateJawlineAlgo2(measurementsData.leftJawX, measurementsData.rightJawX, faceWidth),
          algo3: calculateJawlineAlgo3(measurementsData.jawAngle)
        };

        featureScores['Chin'] = {
          algo1: calculateChinAlgo1(measurementsData),
          algo2: calculateChinAlgo2(measurementsData),
          algo3: calculateChinAlgo3(measurementsData),
          average: Math.round((
            calculateChinAlgo1(measurementsData) +
            calculateChinAlgo2(measurementsData) +
            calculateChinAlgo3(measurementsData)
          ) / 3)
        };

        featureScores['Nose'] = {
          algo1: calculateNoseAlgo1(measurementsData.noseRatio),
          algo2: calculateNoseAlgo2(measurementsData.noseWidth, measurementsData.noseLength),
          algo3: calculateNoseAlgo3(measurementsData.leftNoseX, measurementsData.rightNoseX, faceWidth)
        };

        setMeasurements(measurementsData);

        if (isCollecting) {
          scoresRef.current.push({ featureScores, measurements: measurementsData });
        }
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setFaceDetectedTime(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, DETECTION_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected, config, gender]);

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
          const featureAlgoAverages = {};
          tests.forEach((test) => {
            if (test !== 'Overall') {
              const algo1Scores = collectedScores.map(scores => scores.featureScores[test].algo1);
              const algo2Scores = collectedScores.map(scores => scores.featureScores[test].algo2);
              const algo3Scores = collectedScores.map(scores => scores.featureScores[test].algo3);
              
              const avgAlgo1 = algo1Scores.reduce((sum, val) => sum + val, 0) / algo1Scores.length;
              const avgAlgo2 = algo2Scores.reduce((sum, val) => sum + val, 0) / algo2Scores.length;
              const avgAlgo3 = algo3Scores.reduce((sum, val) => sum + val, 0) / algo3Scores.length;
              
              const featureAverage = (avgAlgo1 + avgAlgo2 + avgAlgo3) / 3;
              
              featureAlgoAverages[test] = {
                algo1: avgAlgo1,
                algo2: avgAlgo2,
                algo3: avgAlgo3,
                average: featureAverage
              };
            }
          });

          const totalWeight = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
          const finalScore = Object.entries(featureAlgoAverages).reduce(
            (sum, [test, scores]) => sum + scores.average * config.weights[test],
            0
          ) / totalWeight;

          const avgMeasurements = {};
          const measurementKeys = Object.keys(collectedScores[0].measurements);
          measurementKeys.forEach(key => {
            avgMeasurements[key] = collectedScores.reduce((sum, scores) => sum + scores.measurements[key], 0) / collectedScores.length;
          });

          onScanningComplete({
            finalScore,
            featureAlgoAverages,
            avgMeasurements
          });
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
  }, [startScanning, onScanningComplete, config, gender]);

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
            p: isMobile ? 2 : 4,
          }}
        >
          <ErrorOutlineIcon 
            sx={{ 
              fontSize: isMobile ? 36 : 48, 
              color: 'error.main',
              mb: isMobile ? 1 : 2,
              filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.3))'
            }} 
          />
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            color="error"
            mb={isMobile ? 1 : 2}
            sx={{ 
              fontSize: { base: '1rem', md: '1.25rem' },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textAlign: 'center'
            }}
          >
            <WarningAmberIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
            Camera Error
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="error"
            mb={isMobile ? 2 : 3}
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
              },
              fontSize: isMobile ? '0.875rem' : '1rem',
              px: isMobile ? 2 : 3,
              py: isMobile ? 1 : 1.5,
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
        <StyledCountdownContainer>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: isMobile ? '4rem' : '6rem', 
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
                fontSize: isMobile ? 36 : 48, 
                color: '#4CAF50',
                filter: 'drop-shadow(0 0 8px rgba(76, 175, 80, 0.3))',
                animation: `${fadeIn} 0.5s ease-out`
              }} 
            />
          )}
        </StyledCountdownContainer>
      )}
      {showFlash && (
        <StyledFlashOverlay sx={{ opacity: 0.8 }} />
      )}
      {!faceDetected && !isLoading && !webcamError && (
        <StyledFaceDetectedOverlay>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            sx={{ 
              color: '#fff',
              fontSize: { base: '0.875rem', md: '1rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textAlign: 'center'
            }}
          >
            <Face sx={{ fontSize: isMobile ? 16 : 24 }} />
            Please position your face in the frame
          </Typography>
        </StyledFaceDetectedOverlay>
      )}
      <StyledInstructionText>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          sx={{ 
            color: '#fff',
            fontSize: { base: '0.875rem', md: '1.25rem' },
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textAlign: 'center'
          }}
        >
          {currentStep === 'scanning' ? 'Hold still for a moment...' : 'Look at the camera'}
        </Typography>
      </StyledInstructionText>
    </Box>
  );
};

// UserInfoForm Component (unchanged)
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

  const isFormValid = () => {
    return name && 
           ethnicity && 
           eyeColor && 
           weightValue && 
           (unitSystem === 'imperial' ? (heightFeet && heightInches) : heightCm) &&
           Object.keys(errors).length === 0;
  };

  return (
    <Box sx={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      '& .MuiInputBase-root': {
        color: '#fff',
        '& fieldset': {
          borderColor: 'rgba(255, 255, 255, 0.23)',
        },
        '&:hover fieldset': {
          borderColor: 'rgba(255, 255, 255, 0.5)',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#09c2f7',
        },
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#09c2f7',
        },
      },
      '& .MuiFormHelperText-root': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      '& .MuiSelect-icon': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      '& .MuiMenuItem-root': {
        color: '#fff',
      },
    }}>
      <Stack 
        spacing={4} 
        sx={{ 
          width: '100%', 
          maxWidth: '600px',
          mx: 'auto',
          flex: 1,
          px: { xs: 1, sm: 2 }
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: '#fff',
            textAlign: 'center',
            width: '100%'
          }}
        >
          Personal Information
        </Typography>

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter their name"
          variant="outlined"
          fullWidth
          error={!!errors.name}
          helperText={errors.name}
          autoComplete="off"
        />

        <TextField
          select
          label="Unit System"
          value={unitSystem}
          onChange={(e) => setUnitSystem(e.target.value)}
          variant="outlined"
          fullWidth
          autoComplete="off"
        >
          <MenuItem value="imperial">Imperial (ft, in, lbs)</MenuItem>
          <MenuItem value="metric">Metric (cm, kg)</MenuItem>
        </TextField>

        {unitSystem === 'imperial' ? (
          <Stack spacing={2}>
            <TextField
              label="Height (feet)"
              type="number"
              value={heightFeet}
              onChange={(e) => setHeightFeet(e.target.value)}
              variant="outlined"
              fullWidth
              error={!!errors.heightFeet}
              helperText={errors.heightFeet}
              autoComplete="off"
            />
            <TextField
              label="Height (inches)"
              type="number"
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              variant="outlined"
              fullWidth
              error={!!errors.heightInches}
              helperText={errors.heightInches}
              autoComplete="off"
            />
          </Stack>
        ) : (
          <TextField
            label="Height (cm)"
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            variant="outlined"
            fullWidth
            error={!!errors.heightCm}
            helperText={errors.heightCm}
            autoComplete="off"
          />
        )}

        <TextField
          label="Weight"
          type="number"
          value={weightValue}
          onChange={(e) => setWeightValue(e.target.value)}
          variant="outlined"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {unitSystem === 'imperial' ? 'lbs' : 'kg'}
              </InputAdornment>
            ),
          }}
          error={!!errors.weight}
          helperText={errors.weight}
          autoComplete="off"
        />

        <TextField
          select
          label="Ethnicity"
          value={ethnicity}
          onChange={(e) => setEthnicity(e.target.value)}
          variant="outlined"
          fullWidth
          error={!!errors.ethnicity}
          helperText={errors.ethnicity || 'Used to adjust analysis based on general trends'}
          autoComplete="off"
        >
          {Object.keys(ethnicityMap).map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Eye Color"
          value={eyeColor}
          onChange={(e) => setEyeColor(e.target.value)}
          variant="outlined"
          fullWidth
          error={!!errors.eyeColor}
          helperText={errors.eyeColor || 'Mapped to categories for analysis purposes'}
          autoComplete="off"
        >
          {Object.keys(eyeColorMap).map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>

        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          gap: 2,
          mt: 2
        }}>
          <Button
            variant="outlined"
            onClick={handleRevert}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.23)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
                boxShadow: 1,
                borderColor: '#09c2f7',
              },
            }}
          >
            Clear Form
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid()}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Submit
          </Button>
        </Box>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ResultDisplay Component (unchanged)
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
              color: '#09c2f7',
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
            <Typography 
              variant="h4" 
              component="div" 
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 10px rgba(9, 194, 247, 0.3)'
              }}
            >
              {cappedRating.toFixed(2)}
            </Typography>
            <Typography 
              variant="body2" 
              component="div" 
              sx={{
                color: 'rgba(255,255,255,0.7)',
                textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
              }}
            >
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
                color: '#fa0ea4',
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
              <Typography 
                variant="h4" 
                component="div" 
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #fff 30%, #fa0ea4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(250, 14, 164, 0.3)'
                }}
              >
                {cappedFaceRating.toFixed(2)}
              </Typography>
              <Typography 
                variant="body2" 
                component="div" 
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 0 5px rgba(250, 14, 164, 0.2)'
                }}
              >
                Face
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      <Typography 
        variant="h6" 
        component="div" 
        sx={{
          mt: 2,
          background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
          fontWeight: 'bold'
        }}
      >
        {tierLabel}
      </Typography>
    </Box>
  );
};

// DetailedResultDisplay Component (Updated to show tangible stats and three algo scores)
const DetailedResultDisplay = ({ overallRating, faceRating, testScores, measurements, userInfo, setUserInfo }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsLoading(false);
            return 100;
          }
          return prev + 1;
        });
      }, 20);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const ratingName = useMemo(() => {
    if (!testScores || !userInfo) return null;
    return generateRatingName(testScores);
  }, [testScores, userInfo]);

  let tierLabel, tierDescription, tierEmoji;
  if (overallRating >= 80) {
    tierLabel = 'Very Attractive';
    tierDescription = 'Your features align closely with conventional standards of attractiveness.';
    tierEmoji = <Favorite />;
  } else if (overallRating >= 60) {
    tierLabel = 'Attractive';
    tierDescription = 'Your features are generally appealing and well-proportioned.';
    tierEmoji = <SentimentSatisfied />;
  } else if (overallRating >= 40) {
    tierLabel = 'Average';
    tierDescription = 'Your features are typical and neither particularly striking nor unattractive.';
    tierEmoji = <SentimentNeutral />;
  } else {
    tierLabel = 'Below Average';
    tierDescription = 'Some features may benefit from enhancement or styling to improve overall attractiveness.';
    tierEmoji = <SentimentDissatisfied />;
  }

  const featureIcons = {
    'Carnal Tilt': <Visibility />,
    'Facial Thirds': <Straighten />,
    'Cheekbone Location': <FaceRetouchingNatural />,
    'Interocular Distance': <RemoveRedEye />,
    'Jawline': <Face3 />,
    'Chin': <Person />,
    'Nose': <Psychology />
  };

  const featureDescriptions = {
    'Carnal Tilt': 'Measures the angle and symmetry of the eyes.',
    'Facial Thirds': 'Evaluates the proportions of the face divided into three sections.',
    'Cheekbone Location': 'Assesses the position and symmetry of the cheekbones.',
    'Interocular Distance': 'Analyzes the spacing and symmetry of the eyes.',
    'Jawline': 'Evaluates the width, angle, and symmetry of the jaw.',
    'Chin': 'Assesses the length and alignment of the chin.',
    'Nose': 'Analyzes the width, length, and symmetry of the nose.'
  };

  const sortedFeatures = testScores
    ? Object.entries(testScores)
        .filter(([test]) => test !== 'Overall')
        .sort(([, a], [, b]) => b.average - a.average)
        .map(([test, scores]) => ({
          test,
          scores,
          impact: scores.average >= 80 ? 'Excellent' : scores.average >= 60 ? 'Good' : scores.average >= 40 ? 'Average' : 'Needs Improvement'
        }))
    : [];

  const bestFeature = sortedFeatures[0];
  const worstFeature = sortedFeatures[sortedFeatures.length - 1];

  // Debug logs to verify data
  console.log('testScores:', testScores);
  console.log('measurements:', measurements);

  if (!testScores || !measurements) {
    return <Typography>No data available for detailed analysis.</Typography>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: 2
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
              textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
              mb: 2
            }}
          >
            Analyzing Results...
          </Typography>
          <Box
            sx={{
              width: '100%',
              maxWidth: '400px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${loadingProgress}%`,
                background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
                transition: 'width 0.1s ease-out',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  animation: 'shimmer 2s infinite',
                  '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                  }
                }
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mt: 1
            }}
          >
            {loadingProgress}%
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              p: 4,
              borderRadius: 2,
              bgcolor: 'rgba(13, 17, 44, 0.7)',
              border: '1px solid rgba(250, 14, 164, 0.2)',
              mb: 4,
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Typography variant="h2" component="div" gutterBottom sx={{ fontSize: '4rem' }}>
              {tierEmoji}
            </Typography>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              {tierLabel}
            </Typography>
            <ResultDisplay rating={overallRating} tierLabel={tierLabel} faceRating={faceRating} />
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
              <Typography 
                variant="h5" 
                gutterBottom 
                fontWeight="bold" 
                align="center" 
                mb={4}
                sx={{
                  background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(9, 194, 247, 0.3)'
                }}
              >
                Detailed Feature Analysis
              </Typography>
              <Stack spacing={3}>
                {sortedFeatures.map(({ test, scores, impact }, index) => {
                  const color = impact === 'Excellent' ? '#09c2f7' : impact === 'Good' ? '#6ce9ff' : impact === 'Average' ? '#fa0ea4' : '#ff6b6b';
                  return (
                    <Box
                      key={test}
                      sx={{
                        animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(13, 17, 44, 0.7)',
                        border: `1px solid ${color}20`,
                        backdropFilter: 'blur(16px)'
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="h4" mr={2} sx={{ color: color }}>
                          {featureIcons[test]}
                        </Typography>
                        <Box flex={1}>
                          <Typography 
                            variant="body1" 
                            fontWeight="medium"
                            sx={{ color: '#fff' }}
                          >
                            {test}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            {featureDescriptions[test]}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{ bgcolor: `${color}20`, px: 1.5, py: 0.5, borderRadius: 1, color: '#fff' }}
                        >
                          {impact}
                        </Typography>
                      </Box>
                      {/* Tangible Stats */}
                      <Box sx={{ mt: 1, pl: 6 }}>
                        {test === 'Carnal Tilt' && (
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            Angle: {measurements.carnalTiltAngle.toFixed(1)}°
                          </Typography>
                        )}
                        {test === 'Facial Thirds' && (
                          <>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Upper Third: {(measurements.upperThirdRatio * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Middle Third: {(measurements.middleThirdRatio * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Lower Third: {(measurements.lowerThirdRatio * 100).toFixed(1)}%
                            </Typography>
                          </>
                        )}
                        {test === 'Cheekbone Location' && (
                          <>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Symmetry Diff: {(measurements.cheekHeightDiff / measurements.faceHeightFull * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Vertical Position: {(measurements.cheekAvgY / measurements.faceHeightFull * 100).toFixed(1)}%
                            </Typography>
                          </>
                        )}
                        {test === 'Interocular Distance' && (
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            Eye Distance/Face Width: {(measurements.interocularRatio * 100).toFixed(1)}%
                          </Typography>
                        )}
                        {test === 'Jawline' && (
                          <>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Jaw Width/Face Width: {(measurements.jawRatio * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Jaw Angle: {measurements.jawAngle.toFixed(1)}°
                            </Typography>
                          </>
                        )}
                        {test === 'Chin' && (
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            Chin Length/Face Height: {(measurements.chinRatio * 100).toFixed(1)}%
                          </Typography>
                        )}
                        {test === 'Nose' && (
                          <>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Nose Width/Face Width: {(measurements.noseRatio * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Nose Width/Length: {(measurements.noseWidth / measurements.noseLength * 100).toFixed(1)}%
                            </Typography>
                          </>
                        )}
                      </Box>
                      {/* Algorithm Scores */}
                      <Box sx={{ mt: 1, pl: 6 }}>
                        {test === 'Interocular Distance' ? (
                          <>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Score: {scores.algo3.toFixed(1)}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Algo 1: {scores.algo1.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Algo 2: {scores.algo2.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              Algo 3: {scores.algo3.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                              Average: {scores.average.toFixed(1)}
                            </Typography>
                          </>
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={test === 'Interocular Distance' ? scores.algo3 : scores.average}
                        sx={{
                          height: 8,
                          borderRadius: 3,
                          mt: 1,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                            borderRadius: 3,
                            transition: 'width 1s ease-in-out'
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Back to Home
            </Button>
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
              sx={{ 
                width: '100%',
                backgroundColor: 'rgba(13, 17, 44, 0.9)',
                color: '#fff',
                '& .MuiAlert-icon': {
                  color: '#fff'
                }
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

// Mapping Functions (unchanged)
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
const SusMeter = () => {
  const { userData, rating: userRating, bestFeature, loading: loadingUser } = useUserData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(null);
  const [gender, setGender] = useState('');
  const [faceScore, setFaceScore] = useState(null);
  const [testScores, setTestScores] = useState(null); // State for detailed scores
  const [measurements, setMeasurements] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [readyToScan, setReadyToScan] = useState(false);
  const { rating: rawRating } = useAttractivenessRating(userInfo);
  const cappedRating = rawRating !== null ? Math.min(Math.max(rawRating, 15.69), 99) : null;
  const toast = useToast();

  useEffect(() => {
    if (!loadingUser) {
      if (user && userData) {
        if (userData.timesRanked === 0) {
          setUserInfo({
            displayName: userData.displayName || 'Self',
            ethnicity: userData.ethnicity,
            eyeColor: mapEyeColor(userData.eyeColor),
            height: userData.height,
            weight: userData.weight,
            gender: getGenderCode(userData.gender),
          });
          setCurrentStep('instructions');
        } else {
          setCurrentStep('genderSelection');
        }
      } else {
        setCurrentStep('genderSelection');
      }
    }
  }, [loadingUser, userData, user]);

  useEffect(() => {
    if (currentStep === 'result' && userInfo && cappedRating !== null) {
      const saveRatingToFirestore = async () => {
        try {
          const ratingData = {
            name: userInfo.name,
            uid: user?.uid || 'anonymous',
            ethnicity: userInfo.ethnicity,
            eyeColor: userInfo.eyeColor,
            height: userInfo.height,
            weight: userInfo.weight,
            gender: userInfo.gender,
            faceRating: userInfo.faceRating,
            testScores: userInfo.testScores,
            measurements: userInfo.measurements,
            finalRating: cappedRating,
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
      const { finalScore, featureAlgoAverages, avgMeasurements } = result;
      
      // Transform the test scores to match the expected format for useAttractivenessRating
      const transformedTestScores = {
        carnalTilt: featureAlgoAverages['Carnal Tilt']?.average || 0,
        facialThirds: featureAlgoAverages['Facial Thirds']?.average || 0,
        cheekbone: featureAlgoAverages['Cheekbone Location']?.average || 0,
        interocular: featureAlgoAverages['Interocular Distance']?.average || 0,
        jawline: featureAlgoAverages['Jawline']?.average || 0,
        chin: featureAlgoAverages['Chin']?.average || 0,
        nose: featureAlgoAverages['Nose']?.average || 0
      };

      const faceRating = Object.values(featureAlgoAverages).reduce((sum, scores) => sum + scores.average, 0) / Object.keys(featureAlgoAverages).length;

      if (user) {
        const updatedUserInfo = {
          ...userInfo,
          ...transformedTestScores,  // Spread average scores into userInfo for useAttractivenessRating
          measurements: avgMeasurements,
          faceRating: faceRating,
        };
        setUserInfo(updatedUserInfo);
        setTestScores(featureAlgoAverages); // Store detailed scores separately
        setCurrentStep('result');
      } else {
        setFaceScore(finalScore + 7);
        setTestScores(featureAlgoAverages); // Store detailed scores
        setMeasurements(avgMeasurements);
        setUserInfo(prev => ({ ...prev, measurements: avgMeasurements }));
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
    const transformedTestScores = {
      carnalTilt: testScores['Carnal Tilt']?.average || 0,
      facialThirds: testScores['Facial Thirds']?.average || 0,
      cheekbone: testScores['Cheekbone Location']?.average || 0,
      interocular: testScores['Interocular Distance']?.average || 0,
      jawline: testScores['Jawline']?.average || 0,
      chin: testScores['Chin']?.average || 0,
      nose: testScores['Nose']?.average || 0
    };

    const faceRating = Object.values(testScores).reduce((sum, scores) => sum + scores.average, 0) / Object.keys(testScores).length;

    const updatedUserInfo = {
      name: info.name,
      ...transformedTestScores,  // Spread average scores into userInfo for useAttractivenessRating
      measurements: measurements,
      ethnicity: info.ethnicity,
      eyeColor: info.eyeColor,
      height: info.height,
      weight: info.weight,
      gender: gender,
      faceRating: faceRating,
    };
    setUserInfo(updatedUserInfo);
    // testScores is already set to featureAlgoAverages
    setCurrentStep('result');
  };

  const currentFaceRating = userInfo && userInfo.faceRating
    ? userInfo.faceRating
    : null;

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
      <TopBar />
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
        {currentStep === 'genderSelection' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Select Gender
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {genderOptions.map((option) => (
                <Grid item xs={12} sm={6} md={3} key={option.value}>
                  <GlassCard
                    onClick={() => handleGenderSelection(option.value)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="h4" sx={{ mb: 2 }}>
                      {option.icon} {option.label}
                    </Typography>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
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
                mb: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Face Scan
            </Typography>
            <StyledWebcamContainer>
              <WebcamTiltDetector
                startScanning={currentStep === 'scanning'}
                onScanningComplete={handleScanningComplete}
                onFaceDetected={handleFaceDetected}
                gender={userInfo?.gender || gender}
                onReadyToScanChange={setReadyToScan}
                currentStep={currentStep}
              />
            </StyledWebcamContainer>
          </Box>
        )}

        {currentStep === 'form' && !user && (
          <Box sx={{ py: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Enter Your Info
            </Typography>
            <UserInfoForm onSubmit={handleFormSubmit} gender={gender} />
          </Box>
        )}

        {currentStep === 'result' && cappedRating !== null && (
          <Box sx={{ py: 8 }}>
            <DetailedResultDisplay
              overallRating={cappedRating}
              faceRating={currentFaceRating}
              testScores={testScores} // Pass detailed scores
              measurements={userInfo.measurements}
              userInfo={userInfo}
              setUserInfo={setUserInfo}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default SusMeter;