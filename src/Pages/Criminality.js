import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import {
  Box,
  Button,
  Typography,
  Grid,
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
  InputLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useToast } from '@chakra-ui/toast';
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
  Face3,
  ErrorOutline,
  WarningAmber,
  CheckCircleOutline,
} from '@mui/icons-material';
import LoadingIndicator from '../Components/LoadingIndicator';
import { 
  crimeCategories, 
  getDominantCategory, 
  calculateSkinDarknessScore 
} from '../config/crimeCategories';
import { crimeFinder } from '../config/crimeFinder';
import { 
  getCrimePredictions,
  getCrimeExamples 
} from '../config/crimePrediction';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// Styled components remain unchanged for brevity
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const LoadingAnimation = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '50vh',
  animation: `${fadeIn} 0.5s ease-out`,
}));

const AnalyzingText = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontSize: '1.5rem',
  fontWeight: 600,
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  '&::after': {
    content: '"..."',
    display: 'inline-block',
    width: '1.2em',
    textAlign: 'left',
    animation: `${pulse} 1.5s infinite`,
  },
}));

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  animation: `${gradientFlow} 6s ease infinite`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  },
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
  animation: `${fadeIn} 0.5s ease-out`
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
  gap: theme.spacing(2)
}));

const StyledFlashOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(8px)',
  zIndex: 6,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: 300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
    '& .feature-icon': {
      filter: 'drop-shadow(0 0 12px rgba(9, 194, 247, 0.4))'
    }
  }
}));

// Tests and weights remain unchanged except for Skin Color focus
const tests = [
  'Skin Color',
  'Eyebrow Position',
  'Mouth Shape',
  'Eye Spacing',
  'Forehead Ratio',
  'Nasal Bridge',
  'Facial Symmetry',
  'Eye Shape',
  'Lip Thickness',
  'Cheekbone Prominence',
  'Brow Ridge',
  'Facial Width',
  'Chin Prominence',
  'Nostril Width',
  'Facial Proportions',
  'Temple Width',
  'Upper Lip Shape',
  'Eye Alignment',
  'Facial Harmony',
  'Cheek Structure'
];

const weights = {
  'Skin Color': 1,
  'Eyebrow Position': 1,
  'Mouth Shape': 1,
  'Eye Spacing': 1,
  'Forehead Ratio': 1,
  'Nasal Bridge': 1,
  'Facial Symmetry': 1,
  'Eye Shape': 1,
  'Lip Thickness': 1,
  'Cheekbone Prominence': 1,
  'Brow Ridge': 1,
  'Facial Width': 1,
  'Chin Prominence': 1,
  'Nostril Width': 1,
  'Facial Proportions': 1,
  'Temple Width': 1,
  'Upper Lip Shape': 1,
  'Eye Alignment': 1,
  'Facial Harmony': 1,
  'Cheek Structure': 1
};

// Helper function to convert RGB string to array
const rgbToArray = (rgbString) => {
  const matches = rgbString.match(/\d+/g);
  if (matches && matches.length === 3) {
    return matches.map(Number);
  }
  return [0, 0, 0];
};

// Helper function to convert RGB array to string
const arrayToRgb = (rgbArray) => {
  const [r, g, b] = rgbArray.map(Math.round);
  return `rgb(${r}, ${g}, ${b})`;
};

// Helper function to convert RGB to HSL (from HTML solution)
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
};

// Helper function to categorize skin color
const categorizeColor = (r, g, b) => {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l > 0.65) {  // Changed from 0.8 to be more generous for very light skin
    return 'very light';
  } else if (l > 0.45) {  // Changed from 0.6 to be more generous for light skin
    return 'light';
  } else if (l > 0.35) {  // Changed from 0.4 to be more generous for medium skin
    return 'medium';
  } else if (l > 0.15) {  // Kept the same for dark skin
    return 'dark';
  } else {
    return 'very dark';
  }
};

// Compliments from HTML solution
const compliments = {
  'very light': [
    "Your porcelain skin is absolutely stunning!",
    "Your fair complexion glows with elegance."
  ],
  'light': [
    "Your skin has a beautiful, radiant glow!",
    "Your complexion is as luminous as the morning sun."
  ],
  'medium': [
    "Your warm, golden skin tone is captivating!",
    "Your skin has a lovely, sun-kissed quality."
  ],
  'dark': [
    "Your rich, deep skin tone is truly beautiful!",
    "Your complexion is as striking as a starry night."
  ],
  'very dark': [
    "Your skin has a gorgeous, velvety depth!",
    "Your complexion is powerfully beautiful."
  ]
};

const getCompliment = (category) => {
  const categoryCompliments = compliments[category];
  if (categoryCompliments) {
    const randomIndex = Math.floor(Math.random() * categoryCompliments.length);
    return categoryCompliments[randomIndex];
  } else {
    return "Your skin is beautiful!";
  }
};

const calculateSkinColorScore = (video, landmarks, userData) => {
  if (!video || !video.videoWidth || !video.videoHeight) {
    return { category: 'Unknown', color: 'rgb(0,0,0)', compliment: 'Unable to detect skin color' };
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Define cheekbone and jaw points based on FaceMesh landmarks
  const targetPoints = {
    leftCheek: [123, 50, 36, 137], // Left cheekbone points
    rightCheek: [352, 280, 266, 366], // Right cheekbone points
    jaw: [152, 175, 199, 200, 201, 202, 203, 204, 205, 206] // Jaw points
  };

  let totalR = 0, totalG = 0, totalB = 0;
  let totalSamples = 0;

  Object.values(targetPoints).forEach(points => {
    points.forEach(pointIndex => {
      if (!landmarks[pointIndex]) return;
      const [x, y] = landmarks[pointIndex];
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

      const size = 5;
      const halfSize = Math.floor(size / 2);
      const startX = Math.max(0, Math.floor(x - halfSize));
      const startY = Math.max(0, Math.floor(y - halfSize));
      const endX = Math.min(canvas.width, Math.floor(x + halfSize + 1));
      const endY = Math.min(canvas.height, Math.floor(y + halfSize + 1));
      const width = endX - startX;
      const height = endY - startY;

      if (width <= 0 || height <= 0) return;

      const imageData = context.getImageData(startX, startY, width, height);
      const data = imageData.data;

      let r = 0, g = 0, b = 0;
      const numPixels = width * height;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.round(r / numPixels);
      g = Math.round(g / numPixels);
      b = Math.round(b / numPixels);

      totalR += r;
      totalG += g;
      totalB += b;
      totalSamples++;
    });
  });

  if (totalSamples === 0) {
    return { category: 'Unknown', color: 'rgb(0,0,0)', compliment: 'Unable to detect skin color' };
  }

  const avgR = Math.round(totalR / totalSamples);
  const avgG = Math.round(totalG / totalSamples);
  const avgB = Math.round(totalB / totalSamples);
  const color = `rgb(${avgR}, ${avgG}, ${avgB})`;
  const category = categorizeColor(avgR, avgG, avgB);
  const compliment = getCompliment(category);

  // Calculate darkness score for crime analysis
  const darknessScore = calculateSkinDarknessScore([avgR, avgG, avgB]);
  
  let crimeTendency = '';
  let crimeScore = 0;
  
  // Base crime tendency on skin darkness and category
  if (category === 'dark' || category === 'very dark') {
    crimeTendency = 'violent';
    crimeScore = userData?.gender === 'female' ? 40 : 70; // Lower base violent score for females
  } else if (category === 'medium') {
    crimeTendency = 'sexual';
    crimeScore = userData?.gender === 'female' ? 35 : 60; // Lower base sexual crime score for females
  } else if (category === 'light' || category === 'very light') {
    crimeTendency = 'whiteCollar';
    crimeScore = userData?.gender === 'female' ? 45 : 30; // Higher white collar score for females
  }

  // Adjust based on gender if available
  if (userData) {
    const { ethnicity, height, weight, gender } = userData;
    
    // Gender-based adjustments
    if (gender === 'female') {
      if (crimeTendency === 'violent') {
        crimeScore = Math.max(20, crimeScore - 25); // Significant reduction for violent crimes
        if (height > 68) { // Taller women
          crimeScore += 5;
        }
      } else if (crimeTendency === 'whiteCollar') {
        crimeScore = Math.min(100, crimeScore + 15); // Increase for white collar crimes
        if (ethnicity === 'euro') {
          crimeScore += 5;
        }
      } else if (crimeTendency === 'sexual') {
        crimeScore = Math.max(15, crimeScore - 20); // Reduction for sexual crimes
      }
    } else if (gender === 'male') {
      if (crimeTendency === 'violent') {
        crimeScore = Math.min(100, crimeScore + 10);
        if (height > 72) { // Taller men
          crimeScore += 10;
        }
      } else if (crimeTendency === 'sexual') {
        crimeScore = Math.min(100, crimeScore + 15);
      }
    }

    // Existing ethnicity-based adjustments
    switch (ethnicity) {
      case 'euro':
        if (crimeTendency === 'violent') {
          crimeScore = Math.max(20, crimeScore - 20);
        } else if (crimeTendency === 'whiteCollar') {
          crimeScore = Math.min(100, crimeScore + 15);
        }
        break;
      case 'african':
        if (crimeTendency === 'violent' && gender === 'male') {
          crimeScore = Math.min(100, crimeScore + 5);
        }
        break;
      case 'asian':
        if (crimeTendency === 'whiteCollar') {
          crimeScore = Math.min(100, crimeScore + 10);
        }
        break;
      case 'indian':
        if (crimeTendency === 'sexual' && gender === 'male') {
          crimeScore = Math.min(100, crimeScore + 5);
        }
        break;
    }

    // Height and weight adjustments based on gender
    if (gender === 'female') {
      if (height < 63) { // Short women
        if (crimeTendency === 'violent') {
          crimeScore = Math.max(15, crimeScore - 20);
        }
      }
      if (weight < 120) { // Lighter women
        if (crimeTendency === 'violent') {
          crimeScore = Math.max(15, crimeScore - 15);
        }
      }
    } else { // male
      if (height < 68) { // Short men
        if (crimeTendency === 'violent') {
          crimeScore = Math.max(25, crimeScore - 15);
        }
      }
      if (weight > 220) { // Heavier men
        if (crimeTendency === 'violent') {
          crimeScore = Math.min(100, crimeScore + 10);
        }
      }
    }
  }

  return { 
    score: crimeScore, 
    category, 
    color, 
    compliment,
    darknessScore,
    crimeTendency,
    userData
  };
};

// Placeholder scoring functions remain unchanged for brevity
const calculateEyebrowPositionScore = (landmarks) => Math.random() * 100;
const calculateMouthShapeScore = (landmarks) => Math.random() * 100;
const calculateEyeSpacingScore = (landmarks, boundingBox) => Math.random() * 100;
const calculateForeheadRatioScore = (landmarks) => Math.random() * 100;
const calculateNasalBridgeScore = (landmarks) => Math.random() * 100;
const calculateFacialSymmetryScore = (landmarks) => Math.random() * 100;
const calculateEyeShapeScore = (landmarks) => Math.random() * 100;
const calculateLipThicknessScore = (landmarks) => Math.random() * 100;
const calculateCheekboneProminenceScore = (landmarks) => Math.random() * 100;
const calculateBrowRidgeScore = (landmarks) => Math.random() * 100;
const calculateFacialWidthScore = (landmarks) => Math.random() * 100;
const calculateChinProminenceScore = (landmarks) => Math.random() * 100;
const calculateNostrilWidthScore = (landmarks) => Math.random() * 100;
const calculateFacialProportionsScore = (landmarks) => Math.random() * 100;
const calculateTempleWidthScore = (landmarks) => Math.random() * 100;
const calculateUpperLipShapeScore = (landmarks) => Math.random() * 100;
const calculateEyeAlignmentScore = (landmarks) => Math.random() * 100;
const calculateFacialHarmonyScore = (landmarks) => Math.random() * 100;
const calculateCheekStructureScore = (landmarks) => Math.random() * 100;

const runTest = (test, video, landmarks, boundingBox) => {
  switch (test) {
    case 'Skin Color':
      return calculateSkinColorScore(video, landmarks, null);
    case 'Eyebrow Position':
      return calculateEyebrowPositionScore(landmarks);
    case 'Mouth Shape':
      return calculateMouthShapeScore(landmarks);
    case 'Eye Spacing':
      return calculateEyeSpacingScore(landmarks, boundingBox);
    case 'Forehead Ratio':
      return calculateForeheadRatioScore(landmarks);
    case 'Nasal Bridge':
      return calculateNasalBridgeScore(landmarks);
    case 'Facial Symmetry':
      return calculateFacialSymmetryScore(landmarks);
    case 'Eye Shape':
      return calculateEyeShapeScore(landmarks);
    case 'Lip Thickness':
      return calculateLipThicknessScore(landmarks);
    case 'Cheekbone Prominence':
      return calculateCheekboneProminenceScore(landmarks);
    case 'Brow Ridge':
      return calculateBrowRidgeScore(landmarks);
    case 'Facial Width':
      return calculateFacialWidthScore(landmarks);
    case 'Chin Prominence':
      return calculateChinProminenceScore(landmarks);
    case 'Nostril Width':
      return calculateNostrilWidthScore(landmarks);
    case 'Facial Proportions':
      return calculateFacialProportionsScore(landmarks);
    case 'Temple Width':
      return calculateTempleWidthScore(landmarks);
    case 'Upper Lip Shape':
      return calculateUpperLipShapeScore(landmarks);
    case 'Eye Alignment':
      return calculateEyeAlignmentScore(landmarks);
    case 'Facial Harmony':
      return calculateFacialHarmonyScore(landmarks);
    case 'Cheek Structure':
      return calculateCheekStructureScore(landmarks);
    default:
      return 0;
  }
};

// StatsDisplay updated to include compliment
const StatsDisplay = ({ testScores }) => {
  const skinColorData = testScores['Skin Color'] || {};
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(13, 17, 44, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: 2,
        borderRadius: 2,
        border: '1px solid rgba(250, 14, 164, 0.2)',
        maxWidth: '300px',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology /> Live Analysis
      </Typography>
      <Stack spacing={1}>
        {Object.entries(testScores).map(([test, score]) => {
          const value = typeof score === 'object' ? score.score : score;
          return (
            <Box key={test} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {test}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={value}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#09c2f7',
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#fff', minWidth: '40px', textAlign: 'right' }}>
                {Math.round(value)}%
              </Typography>
            </Box>
          );
        })}
        {skinColorData.compliment && (
          <Typography variant="body2" sx={{ color: '#09c2f7', mt: 2 }}>
            {skinColorData.compliment}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

// FaceScanner Component
const FaceScanner = ({ startScanning, onScanningComplete, onFaceDetected, userData, currentStep }) => {
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
  const [videoLoaded, setVideoLoaded] = useState(false);
  const toast = useToast();

  const loadModel = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    try {
      await tf.setBackend('webgl');
      setLoadingProgress(30);
      const loadedModel = await facemesh.load({ maxFaces: 1, refineLandmarks: true });
      setLoadingProgress(100);
      setModel(loadedModel);
    } catch (error) {
      console.error('Error loading model:', error);
      toast({
        title: 'Error',
        description: 'Failed to load face detection model',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) {
            resolve();
          } else {
            videoRef.current.addEventListener('loadeddata', resolve, { once: true });
          }
        });
        setVideoReady(true);
        setVideoLoaded(true);
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setWebcamError('Webcam access denied');
      toast({
        title: 'Error',
        description: 'Failed to access webcam',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadModel();
      await startVideo();
    };
    initialize();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!model || !videoReady || !videoLoaded) return;

    const detectFaceAndRunTest = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Ensure video is playing and has valid dimensions
        if (video.paused || video.ended || !video.videoWidth || !video.videoHeight) {
          return;
        }

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
          setFaceDetected(true);
          onFaceDetected(true);
          setFaceDetectedTime((prev) => prev + 0.1);

          const face = predictions[0];
          const landmarks = face.scaledMesh;
          const boundingBox = face.boundingBox;

          landmarks.forEach(([x, y]) => {
            context.beginPath();
            context.arc(x, y, 1, 0, 2 * Math.PI);
            context.fillStyle = 'rgba(0, 255, 255, 0.5)';
            context.fill();
          });

          if (isCollecting) {
            const testScores = {};
            tests.forEach((test) => {
              if (test === 'Skin Color') {
                testScores[test] = calculateSkinColorScore(video, landmarks, userData);
              } else {
                testScores[test] = runTest(test, video, landmarks, boundingBox);
              }
            });
            scoresRef.current.push(testScores);
          }
        } else {
          setFaceDetected(false);
          onFaceDetected(false);
          setFaceDetectedTime(0);
        }
      } catch (error) {
        console.error('Error in face detection:', error);
        // Don't stop the interval, just log the error and continue
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 100);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, videoLoaded, isCollecting, onFaceDetected, userData]);

  useEffect(() => {
    if (startScanning && !isCollecting) {
      setIsCollecting(true);
      scoresRef.current = [];
      setCountdown(5);

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
            if (test === 'Skin Color') {
              const skinScores = collectedScores.map((scores) => scores[test].category);
              const skinColors = collectedScores.map((scores) => rgbToArray(scores[test].color));
              
              // Get most frequent category
              const categoryCounts = {};
              skinScores.forEach(category => {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
              });
              const mostFrequentCategory = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
              
              // Calculate average color
              let totalR = 0, totalG = 0, totalB = 0;
              skinColors.forEach(([r, g, b]) => {
                totalR += r;
                totalG += g;
                totalB += b;
              });
              const avgR = totalR / skinColors.length;
              const avgG = totalG / skinColors.length;
              const avgB = totalB / skinColors.length;
              
              testAverages[test] = { 
                category: mostFrequentCategory,
                color: arrayToRgb([avgR, avgG, avgB])
              };
            } else {
              const testScores = collectedScores.map((scores) => scores[test]);
              const sortedTestScores = [...testScores].sort((a, b) => a - b);
              const n = sortedTestScores.length;
              const k = Math.ceil(n / 4);
              const lowerQuartile = sortedTestScores.slice(0, k);
              const average = lowerQuartile.reduce((sum, val) => sum + val, 0) / k;
              testAverages[test] = average;
            }
          });
          const finalScore = 0; // Always set to 0%
          onScanningComplete({ finalScore, testAverages });
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
  }, [startScanning, onScanningComplete]);

  if (webcamError) {
    toast({ title: 'Error', description: webcamError, status: 'error', duration: 5000, isClosable: true });
  }

  return (
    <StyledWebcamContainer>
      {isLoading && (
        <LoadingIndicator
          progress={loadingProgress}
          message="Loading Face Detection..."
          subMessage={
            loadingProgress < 30 ? 'Initializing...' : 
            loadingProgress < 100 ? 'Loading Model...' : 
            'Almost Ready...'
          }
        />
      )}
      {!model && !webcamError && !isLoading && (
        <LoadingIndicator progress={0} message="Preparing Camera..." subMessage="" />
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
          <ErrorOutline
            sx={{ fontSize: 48, color: 'error.main', mb: 2, filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.3))' }}
          />
          <Typography variant="h6" color="error" mb={2} sx={{ fontSize: { base: '1rem', md: '1.25rem' } }}>
            <WarningAmber sx={{ fontSize: 24, mr: 1 }} /> Camera Error
          </Typography>
          <Typography variant="body1" color="error" mb={3} sx={{ fontSize: { base: '0.875rem', md: '1rem' } }}>
            {webcamError}
          </Typography>
          <GradientButton onClick={() => { setWebcamError(null); setIsLoading(true); loadModel().then(startVideo); }}>
            Retry
          </GradientButton>
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
          visibility: videoLoaded ? 'visible' : 'hidden'
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
          visibility: videoLoaded ? 'visible' : 'hidden'
        }}
      />
      {countdown !== null && (
        <StyledCountdownContainer>
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
            <CheckCircleOutline 
              sx={{ 
                fontSize: 48, 
                color: '#4CAF50',
                filter: 'drop-shadow(0 0 8px rgba(76, 175, 80, 0.3))',
                animation: `${fadeIn} 0.5s ease-out`
              }} 
            />
          )}
        </StyledCountdownContainer>
      )}
      {showFlash && <StyledFlashOverlay sx={{ opacity: 0.8 }} />}
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
            <Face />
            Please position your face in the frame
          </Typography>
        </StyledFaceDetectedOverlay>
      )}
      <StyledInstructionText>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#fff',
            fontSize: { base: '1rem', md: '1.25rem' },
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {isCollecting ? 'Hold still for a moment...' : 'Look at the camera'}
        </Typography>
      </StyledInstructionText>
    </StyledWebcamContainer>
  );
};

// DetailedResultDisplay updated to show more details
const DetailedResultDisplay = ({ overallPercentage, testScores }) => {
  const navigate = useNavigate();
  const dominantCategory = getDominantCategory(testScores);
  const { category, details } = dominantCategory;

  // Get skin tone and gender from test scores
  const skinTone = testScores['Skin Color']?.category || 'medium';
  const userData = testScores['Skin Color']?.userData;
  
  // Get gender from userData
  const gender = userData?.gender?.toLowerCase() || 'male';

  // Get one random crime from the category based on gender and skin tone
  const getRandomCrime = (category, gender, skinTone) => {
    const skinToneMapping = {
      'very light': 'light',
      'light': 'light',
      'medium': 'medium',
      'dark': 'dark',
      'very dark': 'dark'
    };
    const mappedSkinTone = skinToneMapping[skinTone] || 'medium';
    const crimes = crimeFinder[category]?.crimes[gender]?.[mappedSkinTone] || [];
    if (crimes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * crimes.length);
    return crimes[randomIndex];
  };

  const randomCrime = getRandomCrime(category, gender, skinTone);
  const predictions = getCrimePredictions(category, overallPercentage || 50, gender, skinTone);

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Box sx={{ 
        p: 4, 
        borderRadius: 2, 
        bgcolor: 'rgba(13, 17, 44, 0.7)', 
        border: `1px solid ${details.color}40`, 
        mb: 4, 
        textAlign: 'center' 
      }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: details.color }}>
          {details.name}
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
          {details.description}
        </Typography>

        {/* Primary Crime Prediction */}
        {randomCrime && (
          <Box 
            sx={{ 
              mt: 4,
              p: 3, 
              bgcolor: 'rgba(0,0,0,0.2)', 
              borderRadius: 1,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 20px ${details.color}40`
              }
            }}
          >
            <Typography variant="h6" sx={{ color: details.color, mb: 2 }}>
              {randomCrime.name}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              {randomCrime.description}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Jail Term: {randomCrime.jailTerm}
            </Typography>
            {randomCrime.examples && randomCrime.examples.length > 0 && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                Notable Example: {randomCrime.examples[0]}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
              Severity: {randomCrime.severity}
            </Typography>
          </Box>
        )}

        {/* Additional Predictions */}
        {predictions && predictions.length > 1 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
              Additional Criminal Tendencies
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {predictions.slice(1, 3).map((prediction, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(0,0,0,0.2)',
                      borderRadius: 1,
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: details.color }}>
                      {prediction.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                      {prediction.description}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                      Likelihood: {prediction.likelihood}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
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
      </Box>
    </Box>
  );
};

// Add new component for scanning selection
const ScanSelection = ({ onSelect }) => {
  const cardsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    const cardElements = cardsRef.current?.querySelectorAll('.scan-card');
    cardElements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scanOptions = [
    {
      title: 'Scan Myself',
      description: 'Use your own profile data for analysis.',
      icon: Person,
      action: () => onSelect('myself')
    },
    {
      title: 'Scan Someone Else',
      description: 'Enter details manually for analysis.',
      icon: Group,
      action: () => onSelect('someoneElse')
    }
  ];

  return (
    <Box sx={{ textAlign: 'center', maxWidth: '1200px', mx: 'auto', mt: 4 }}>
      <Box
        sx={{
          marginTop: '100px',
          display: 'flex',
          justifyContent: 'center',
          mb: 4,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${neonGlow} 2s infinite`,
            boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
        >
          <img
            src="/lookzapp trans 2.png"
            alt="LookzApp"
            style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
          />
        </Box>
      </Box>
      <Typography
        variant="h4"
        component="h1"
        align="center"
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2,
        }}
      >
        Who would you like to scan?
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        sx={{
          color: 'rgba(255,255,255,0.8)',
          mb: 6,
        }}
      >
        Choose an option to proceed with the analysis.
      </Typography>
      <Grid container spacing={4} justifyContent="center" ref={cardsRef}>
        {scanOptions.map((option, index) => (
          <Grid item xs={12} sm={6} md={4} key={option.title}>
            <StyledPaper
              className="scan-card"
              sx={{
                opacity: 0,
                transform: 'translateY(20px)',
                transition: 'all 0.5s ease-out',
                transitionDelay: `${index * 0.1}s`,
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  backgroundColor: 'rgba(13, 17, 44, 0.85)',
                  boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
                  '& .feature-icon': {
                    filter: 'drop-shadow(0 0 12px rgba(9, 194, 247, 0.4))'
                  }
                }
              }}
              onClick={option.action}
            >
              <option.icon
                className="feature-icon"
                sx={{
                  fontSize: 48,
                  color: '#09c2f7',
                  mb: 3,
                  filter: 'drop-shadow(0 0 8px rgba(9, 194, 247, 0.3))',
                }}
              />
              <Typography variant="h5" sx={{ 
                mb: 2, 
                fontWeight: 600,
                color: '#6ce9ff',
                textShadow: '0 0 10px rgba(9, 194, 247, 0.3)'
              }}>
                {option.title}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255,255,255,0.7)',
                textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
              }}>
                {option.description}
              </Typography>
            </StyledPaper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Add height conversion utilities
const convertToInches = (feet, inches) => (feet * 12) + inches;
const convertToCentimeters = (inches) => inches * 2.54;
const convertToFeetInches = (centimeters) => {
  const totalInches = Math.round(centimeters / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
};

// Update SomeoneElseForm to include height measurement system
const SomeoneElseForm = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    gender: 'male',
    measurementSystem: 'imperial' // 'imperial' or 'metric'
  });
  const [heightImperial, setHeightImperial] = useState({ feet: '', inches: '' });
  const [heightMetric, setHeightMetric] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Validate height based on measurement system
    if (formData.measurementSystem === 'imperial') {
      const feet = Number(heightImperial.feet);
      const inches = Number(heightImperial.inches);
      if (!feet || feet < 3 || feet > 8) {
        newErrors.height = 'Feet must be between 3 and 8';
      }
      if (inches === undefined || inches < 0 || inches > 11) {
        newErrors.height = 'Inches must be between 0 and 11';
      }
      // Convert to total inches for storage
      formData.height = convertToInches(feet, inches);
    } else {
      const cm = Number(heightMetric);
      if (!cm || cm < 91 || cm > 244) { // 3ft to 8ft in cm
        newErrors.height = 'Height must be between 91 and 244 cm';
      }
      // Convert to inches for storage
      formData.height = Math.round(cm / 2.54);
    }

    if (!formData.weight || formData.weight < 50 || formData.weight > 400) {
      newErrors.weight = 'Weight must be between 50 and 400 pounds';
    }
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleMeasurementSystemChange = (system) => {
    setFormData({ ...formData, measurementSystem: system });
    // Convert height when switching systems
    if (system === 'metric') {
      const totalInches = convertToInches(Number(heightImperial.feet), Number(heightImperial.inches));
      setHeightMetric(Math.round(convertToCentimeters(totalInches)));
    } else {
      const { feet, inches } = convertToFeetInches(Number(heightMetric));
      setHeightImperial({ feet: feet.toString(), inches: inches.toString() });
    }
  };

  return (
    <Box sx={{ maxWidth: '400px', mx: 'auto', mt: 4, p: 3, bgcolor: 'rgba(13, 17, 44, 0.7)', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
        Enter Subject's Details
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormControl error={!!errors.gender}>
            <FormLabel sx={{ color: '#fff' }}>Gender</FormLabel>
            <RadioGroup
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              row
            >
              <FormControlLabel
                value="male"
                control={<Radio sx={{ color: '#09c2f7' }} />}
                label={<Typography sx={{ color: '#fff' }}>Male</Typography>}
              />
              <FormControlLabel
                value="female"
                control={<Radio sx={{ color: '#09c2f7' }} />}
                label={<Typography sx={{ color: '#fff' }}>Female</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel sx={{ color: '#fff' }}>Measurement System</FormLabel>
            <RadioGroup
              value={formData.measurementSystem}
              onChange={(e) => handleMeasurementSystemChange(e.target.value)}
              row
            >
              <FormControlLabel
                value="imperial"
                control={<Radio sx={{ color: '#09c2f7' }} />}
                label={<Typography sx={{ color: '#fff' }}>Imperial (ft/in)</Typography>}
              />
              <FormControlLabel
                value="metric"
                control={<Radio sx={{ color: '#09c2f7' }} />}
                label={<Typography sx={{ color: '#fff' }}>Metric (cm)</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <FormControl error={!!errors.height}>
            <FormLabel sx={{ color: '#fff' }}>Height</FormLabel>
            {formData.measurementSystem === 'imperial' ? (
              <Stack direction="row" spacing={2}>
                <TextField
                  type="number"
                  label="Feet"
                  value={heightImperial.feet}
                  onChange={(e) => setHeightImperial({ ...heightImperial, feet: e.target.value })}
                  error={!!errors.height}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  }}
                />
                <TextField
                  type="number"
                  label="Inches"
                  value={heightImperial.inches}
                  onChange={(e) => setHeightImperial({ ...heightImperial, inches: e.target.value })}
                  error={!!errors.height}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  }}
                />
              </Stack>
            ) : (
              <TextField
                type="number"
                label="Centimeters"
                value={heightMetric}
                onChange={(e) => setHeightMetric(e.target.value)}
                error={!!errors.height}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />
            )}
            {errors.height && (
              <FormHelperText error>{errors.height}</FormHelperText>
            )}
          </FormControl>

          <FormControl error={!!errors.weight}>
            <FormLabel sx={{ color: '#fff' }}>Weight (pounds)</FormLabel>
            <TextField
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
              error={!!errors.weight}
              helperText={errors.weight}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                },
              }}
            />
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={onBack}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                color: '#fff',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
                },
              }}
            >
              Continue
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
};

// Add ExploreOtherTests component before DetailedResultDisplay
const ExploreOtherTests = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const tests = [
    {
      title: 'Attractiveness Analysis',
      description: 'AI-powered analysis of facial features and attractiveness',
      path: '/scan/attractiveness',
      icon: <FaceRetouchingNatural />,
      color: '#09c2f7'
    },
    {
      title: 'Autism Analysis',
      description: 'Advanced AI-powered analysis of potential autism spectrum traits',
      path: '/scan/autism',
      icon: <Psychology />,
      color: '#fa0ea4'
    },
    {
      title: 'Liar Score',
      description: 'Detect deception patterns and truthfulness indicators',
      path: '/scan/lying',
      icon: <SentimentDissatisfied />,
      color: '#6ce9ff'
    }
  ];

  return (
    <Box sx={{ mt: 8, mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          mb: 4,
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 10px rgba(9, 194, 247, 0.3)'
        }}
      >
        Explore Our Other Tests
      </Typography>
      
      <Grid container spacing={3} justifyContent="center">
        {tests.map((test, index) => (
          <Grid item xs={12} sm={6} md={4} key={test.title}>
            <Card
              sx={{
                height: '100%',
                background: 'rgba(13, 17, 44, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(250, 14, 164, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 8px 32px ${test.color}40`,
                  border: `1px solid ${test.color}40`
                }
              }}
              onClick={() => navigate(test.path)}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                p: 3
              }}>
                <Box
                  sx={{
                    color: test.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `${test.color}20`,
                    mb: 2,
                    '& .MuiSvgIcon-root': {
                      fontSize: 32
                    }
                  }}
                >
                  {test.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    mb: 1
                  }}
                >
                  {test.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    mb: 2,
                    minHeight: '40px'
                  }}
                >
                  {test.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: test.color,
                    borderColor: `${test.color}40`,
                    '&:hover': {
                      borderColor: test.color,
                      backgroundColor: `${test.color}10`
                    }
                  }}
                >
                  Try Now
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Main Component
const CriminalityAnalytic = () => {
  const { user } = useAuth();
  const { userData, loading: loadingUser } = useUserData();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('selection');
  const [likelihoodScore, setLikelihoodScore] = useState(null);
  const [testScores, setTestScores] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scanSubject, setScanSubject] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!loadingUser && userData) {
      console.log('User document:', userData);
    }
  }, [loadingUser, userData]);

  const handleScanSelection = (choice) => {
    if (choice === 'myself') {
      setScanSubject(userData);
      setCurrentStep('instructions');
    } else {
      setCurrentStep('someoneElseForm');
    }
  };

  const handleSomeoneElseSubmit = (formData) => {
    setScanSubject(formData);
    setCurrentStep('instructions');
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setScanSubject(null);
  };

  const handleScanningComplete = (result) => {
    if (result) {
      setIsLoadingResults(true);
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            const { finalScore, testAverages } = result;
            setLikelihoodScore(finalScore);
            // Add scan subject data to test scores
            setTestScores({
              ...testAverages,
              'Skin Color': {
                ...testAverages['Skin Color'],
                userData: scanSubject // Pass the scan subject data
              }
            });
            setCurrentStep('result');
            setIsLoadingResults(false);
            return 100;
          }
          return prev + 1;
        });
      }, 20);
    } else {
      toast({ title: 'Error', description: 'No face detected', status: 'error', duration: 3000 });
      setCurrentStep('instructions');
    }
  };

  const handleFaceDetected = (detected) => {
    setFaceDetected(detected);
    if (detected && currentStep === 'instructions') {
      setCurrentStep('scanning');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
      <TopBar />
      <Box sx={{ position: 'relative', maxWidth: 'xl', mx: 'auto' }}>
        {isLoadingResults ? (
          <LoadingAnimation>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 4,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: `${neonGlow} 2s infinite`,
                  boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <img
                  src="/lookzapp trans 2.png"
                  alt="LookzApp"
                  style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
                />
              </Box>
            </Box>
            <Box sx={{ width: '400px', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <Box sx={{ width: `${loadingProgress}%`, height: '100%', background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)', transition: 'width 0.1s ease-out' }} />
            </Box>
            <AnalyzingText>Analyzing Results</AnalyzingText>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>{loadingProgress}%</Typography>
          </LoadingAnimation>
        ) : (
          <>
            {currentStep === 'selection' && (
              <ScanSelection onSelect={handleScanSelection} />
            )}
            {currentStep === 'someoneElseForm' && (
              <SomeoneElseForm onSubmit={handleSomeoneElseSubmit} onBack={handleBackToSelection} />
            )}
            {(currentStep === 'instructions' || currentStep === 'scanning') && (
              <Box sx={{ my: 8 }}>    
                <FaceScanner
                  startScanning={currentStep === 'scanning'}
                  onScanningComplete={handleScanningComplete}
                  onFaceDetected={handleFaceDetected}
                  userData={scanSubject}
                />
              </Box>
            )}
            {currentStep === 'result' && likelihoodScore !== null && (
              <Box sx={{ py: 8 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/')}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                      borderRadius: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: `${neonGlow} 2s infinite`,
                      boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <img
                      src="/lookzapp trans 2.png"
                      alt="LookzApp"
                      style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
                    />
                  </Box>
                </Box>
                <DetailedResultDisplay overallPercentage={likelihoodScore} testScores={testScores} />
                <ExploreOtherTests />
              </Box>
            )}
          </>
        )}
        {(isLoadingResults || currentStep === 'result') && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              py: 3,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.9rem',
              animation: `${fadeIn} 1s ease-out`,
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            <Typography variant="body2" >
              © 2025 Octavian Ideas. All rights reserved.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CriminalityAnalytic;