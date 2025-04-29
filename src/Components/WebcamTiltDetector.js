import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';
import { useAttractivenessRating } from '../hooks/faceRating/useAttractivenessRating';
import { useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
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
import LoadingIndicator from './LoadingIndicator';
import ShareRatingCard from './ShareRatingCard';
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

// Add this new component before the WebcamTiltDetector component
const StatsDisplay = ({ measurements, testScores, isMobile }) => {
  if (!measurements || !testScores) return null;

  const stats = [
    { label: 'Face Alignment', value: testScores['Carnal Tilt'] || 0, icon: <Straighten /> },
    { label: 'Facial Balance', value: testScores['Facial Thirds'] || 0, icon: <FaceRetouchingNatural /> },
    { label: 'Eye Symmetry', value: testScores['Interocular Distance'] || 0, icon: <RemoveRedEye /> },
    { label: 'Jaw Definition', value: testScores['Jawline'] || 0, icon: <Face3 /> },
    { label: 'Chin Proportion', value: testScores['Chin'] || 0, icon: <Person /> },
    { label: 'Nose Harmony', value: testScores['Nose'] || 0, icon: <Psychology /> },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: isMobile ? 0.5 : 1,
        background: 'rgba(13, 17, 44, 0.85)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(250, 14, 164, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 0.25 : 0.5,
        zIndex: 3,
        animation: `${fadeIn} 0.5s ease-out`,
        maxHeight: isMobile ? '100px' : '120px',
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={isMobile ? 0.25 : 0.5}>
        {stats.map((stat, index) => (
          <Grid item xs={6} key={index}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0.25 : 0.5,
                p: isMobile ? 0.25 : 0.5,
                borderRadius: 0.5,
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box
                sx={{
                  color: '#09c2f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? 12 : 16,
                  height: isMobile ? 12 : 16,
                  '& .MuiSvgIcon-root': {
                    fontSize: isMobile ? 12 : 14,
                  }
                }}
              >
                {stat.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'block',
                    mb: 0.25,
                    fontSize: isMobile ? '0.6rem' : '0.65rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {stat.label}
                </Typography>
                <Box
                  sx={{
                    height: isMobile ? 2 : 3,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${stat.value}%`,
                      background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
                      transition: 'width 0.3s ease-out',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
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
  const [testScores, setTestScores] = useState(null);
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

        setMeasurements(measurements);
        setTestScores(testScores);

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
      {faceDetected && measurements && testScores && (
        <StatsDisplay measurements={measurements} testScores={testScores} isMobile={isMobile} />
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

// Add this new component before DetailedResultDisplay
const FeatureCircularProgress = ({ testScores }) => {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const totalScore = Object.values(testScores).reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / Object.keys(testScores).length;

  const featureColors = {
    'Carnal Tilt': '#09c2f7',
    'Facial Thirds': '#6ce9ff',
    'Cheekbone Location': '#4dabf7',
    'Interocular Distance': '#339af0',
    'Jawline': '#228be6',
    'Chin': '#1c7ed6',
    'Nose': '#1971c2'
  };

  const sortedFeatures = Object.entries(testScores)
    .filter(([test]) => test !== 'Overall')
    .sort(([, a], [, b]) => b - a);

  const totalAngle = 360;
  let currentAngle = 0;

  return (
    <Box sx={{ position: 'relative', width: 200, height: 200, mx: 'auto' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={200}
        thickness={4}
        sx={{
          color: 'rgba(255,255,255,0.1)',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      {sortedFeatures.map(([feature, score], index) => {
        const angle = (score / totalScore) * totalAngle;
        const startAngle = currentAngle;
        currentAngle += angle;

        return (
          <Tooltip
            key={feature}
            title={
              <Box>
                <Typography variant="subtitle2">{feature}</Typography>
                <Typography variant="body2">{score.toFixed(1)}%</Typography>
              </Box>
            }
            placement="top"
            arrow
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startAngle * Math.PI / 180)}% ${50 + 50 * Math.sin(startAngle * Math.PI / 180)}%, ${50 + 50 * Math.cos((startAngle + angle) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle + angle) * Math.PI / 180)}%)`,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                opacity: hoveredFeature === null || hoveredFeature === feature ? 1 : 0.3,
                '&:hover': {
                  opacity: 1
                }
              }}
              onMouseEnter={() => setHoveredFeature(feature)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CircularProgress
                variant="determinate"
                value={100}
                size={200}
                thickness={4}
                sx={{
                  color: featureColors[feature],
                  transform: `rotate(${startAngle}deg)`,
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round'
                  }
                }}
              />
            </Box>
          </Tooltip>
        );
      })}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {averageScore.toFixed(1)}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Overall
        </Typography>
      </Box>
    </Box>
  );
};

// Modify the DetailedResultDisplay component to include the new circular progress
const DetailedResultDisplay = ({ overallRating, faceRating, testScores, userInfo, setUserInfo }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
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

  const bestFeature = sortedFeatures[0];
  const worstFeature = sortedFeatures[sortedFeatures.length - 1];

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

            {/* Add the new circular progress component */}
            <Box sx={{ my: 4 }}>
              <FeatureCircularProgress testScores={testScores} />
            </Box>

            {/* Feature Highlights */}
            <Box
              sx={{
                mt: 4,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                justifyContent: 'center'
              }}
            >
              {/* Best Feature */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(9, 194, 247, 0.1)',
                  border: '1px solid rgba(9, 194, 247, 0.3)',
                  flex: 1,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: '#09c2f7' }}>{featureIcons[bestFeature?.test]}</Box>
                  <Typography variant="h6" sx={{ color: '#09c2f7' }}>
                    Best Feature
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                  {bestFeature?.test}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {ratingName?.split('. ')[0]}
                </Typography>
              </Box>

              {/* Worst Feature */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(250, 14, 164, 0.1)',
                  border: '1px solid rgba(250, 14, 164, 0.3)',
                  flex: 1,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: '#fa0ea4' }}>{featureIcons[worstFeature?.test]}</Box>
                  <Typography variant="h6" sx={{ color: '#fa0ea4' }}>
                    Area for Improvement
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                  {worstFeature?.test}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {ratingName?.split('. ')[1]}
                </Typography>
              </Box>
            </Box>

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
                {sortedFeatures.map(({ test, score, impact }, index) => {
                  const color = impact === 'Excellent' ? '#09c2f7' : impact === 'Good' ? '#6ce9ff' : impact === 'Average' ? '#fa0ea4' : '#ff6b6b';
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
                            sx={{
                              color: '#fff',
                              textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
                            }}
                          >
                            {test}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
                            }}
                          >
                            {featureDescriptions[test]}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            bgcolor: `${color}20`,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            color: '#fff',
                            textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
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
                            backgroundColor: 'rgba(255,255,255,0.1)',
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
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)',
                              textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
                              fontWeight: 'medium'
                            }}
                          >
                            Low
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)',
                              textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
                              fontWeight: 'medium'
                            }}
                          >
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
                startIcon={<Share />}
                onClick={() => setShowShareCard(true)}
                sx={{
                  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                    opacity: 0.9
                  }
                }}
              >
                Share Card
              </Button>
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
            </Stack>
          </Box>

          <ShareRatingCard
            open={showShareCard}
            onClose={() => setShowShareCard(false)}
            userInfo={userInfo}
            rating={overallRating}
            testScores={testScores}
          />

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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(null);
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

  // Add scan counter state
  const [scanCount, setScanCount] = useState(() => {
    const savedCount = localStorage.getItem('scanCount');
    return savedCount ? parseInt(savedCount) : 0;
  });

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
        // For unauthenticated users, start with gender selection
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
      // Increment scan count for non-logged in users
      /*if (!user) {
        const newScanCount = scanCount + 1;
        setScanCount(newScanCount);
        localStorage.setItem('scanCount', newScanCount.toString());

        // Redirect to scan limit page if more than 2 scans
        if (newScanCount > 2) {
          toast({
            title: 'Scan Limit Reached',
            description: 'Please create a free account to continue scanning.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          navigate('/scan-limit');
          return;
        }
      }*/

      const { finalScore, testAverages, measurements } = result;
      const transformedTestScores = {};
      for (const [test, score] of Object.entries(testAverages)) {
        const propName = testToPropMap[test];
        if (propName) {
          transformedTestScores[propName] = score;
        }
      }

      const faceRating = Object.values(testAverages).reduce((sum, score) => sum + score, 0) / Object.keys(testAverages).length;

      if (user) {
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
      <TopBar />
      {/* Animated grid background */}
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
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Who are you scanning?
            </Typography>
            
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <GlassCard
                  onClick={() => handleGenderSelection('M')}
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    p: 4,
                    '&:hover .optionTitle': {
                      background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                  }}
                >
                  <Typography 
                    variant="h4" 
                    className="optionTitle"
                    sx={{ 
                      mb: 2,
                      fontSize: '1.8rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
                      justifyContent: 'center',
                      width: '100%'
                    }}
                  >
                    <Face /> For Myself
                  </Typography>
                  <Typography 
                    color="rgba(255,255,255,0.7)" 
                    sx={{ 
                      fontSize: '1.1rem', 
                      textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
                      textAlign: 'center',
                      maxWidth: '80%'
                    }}
                  >
                    Analyze your own facial features with AI-powered insights
                  </Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <GlassCard
                  onClick={() => handleGenderSelection('W')}
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    p: 4,
                    '&:hover .optionTitle': {
                      background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                  }}
                >
                  <Typography 
                    variant="h4" 
                    className="optionTitle"
                    sx={{ 
                      mb: 2,
                      fontSize: '1.8rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
                      justifyContent: 'center',
                      width: '100%'
                    }}
                  >
                    <Group /> For Someone Else
                  </Typography>
                  <Typography 
                    color="rgba(255,255,255,0.7)" 
                    sx={{ 
                      fontSize: '1.1rem', 
                      textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
                      textAlign: 'center',
                      maxWidth: '80%'
                    }}
                  >
                    Analyze another person's features with privacy-focused technology
                  </Typography>
                </GlassCard>
              </Grid>
            </Grid>
          </Box>
        )}

        {currentStep === 'genderSelection' && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            px: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
          }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                fontSize: { xs: '2rem', md: '2.5rem' },
                textAlign: 'center',
                width: '100%',
                marginTop: '-40px'
              }}
            >
              Select Analysis Profile
            </Typography>
            
            <Grid 
              container 
              spacing={3} 
              justifyContent="center" 
              sx={{ 
                maxWidth: '800px',
                width: '100%',
                mx: 'auto',
                px: { xs: 1, sm: 2, md: 3 }
              
              }}
            >
              {genderOptions.map((option) => (
                <Grid item xs={12} sm={6} md={4} key={option.value}>
                  <GlassCard
                    onClick={() => handleGenderSelection(option.value)}
                    sx={{ 
                      cursor: 'pointer',
                      p: 3,
                      marginRight: '20px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: gender === option.value ? '2px solid #09c2f7' : '1px solid rgba(250, 14, 164, 0.2)',
                      boxShadow: gender === option.value ? '0 0 20px rgba(9, 194, 247, 0.3)' : 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
                        border: '2px solid #09c2f7'
                      }
                    }}
                  >
                    <Box
                      sx={{ 
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        
                        animation: `${neonGlow} 2s infinite`,
                        '& .MuiSvgIcon-root': {
                          fontSize: 32,
                          color: '#fff'
                        }
                      }}
                    >
                      {option.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#fff',
                        fontWeight: 600,
                        textAlign: 'center',
                        mb: 1,
                        width: '100%'
                      }}
                    >
                      {option.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        width: '100%'
                      }}
                    >
                      {option.label === 'Male' ? 'Masculine facial analysis' :
                       option.label === 'Female' ? 'Feminine facial analysis' :
                       option.label === 'Non-binary' ? 'Neutral facial analysis' :
                       option.label === 'Other' ? 'Custom facial analysis' :
                       'Anonymous facial analysis'}
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
          <Box sx={{ 
            py: 8,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 3, md: 4 }
          }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                fontSize: { xs: '2rem', md: '2.5rem' },
                width: '100%'
              }}
            >
              Subject Profile Setup
            </Typography>
            
            <Box sx={{ 
              width: '100%',
              maxWidth: '800px',
              mx: 'auto',
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 2,
              background: 'rgba(13, 17, 44, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(250, 14, 164, 0.2)',
              boxShadow: '0 8px 32px rgba(11, 43, 77, 0.2)',
            }}>
              <UserInfoForm onSubmit={handleFormSubmit} gender={gender} />
            </Box>
          </Box>
        )}

        {currentStep === 'result' && cappedRating !== null && (
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
            <DetailedResultDisplay
              overallRating={cappedRating}
              faceRating={currentFaceRating}
              testScores={userInfo.testScores}
              userInfo={userInfo}
              setUserInfo={setUserInfo}
            />
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
              <Typography variant="body2">
                © 2025 Octavian Ideas. All rights reserved.
              </Typography>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );

};

export default AttractivenessRatingProcess;