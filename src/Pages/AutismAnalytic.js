import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
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
  styled,
  keyframes,
  InputLabel,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useToast } from '@chakra-ui/toast';
import { generateAutismRatingName } from '../utils/autsimRatingNameGenerator';
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
} from '@mui/icons-material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIndicator from '../Components/LoadingIndicator';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

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

// Define tests and weights for autism likelihood estimation
const tests = [
  'Face Width Ratio',
  'Eye Spacing',
  'Nasal Bridge',
  'Forehead Ratio',
];

const weights = {
  'Face Width Ratio': 5,
  'Eye Spacing': 3,
  'Nasal Bridge': 1,
  'Forehead Ratio': 1,
};

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

// StatsDisplay Component
const StatsDisplay = ({ testScores }) => {
  if (!testScores) return null;

  const stats = [
    { label: 'Face Width', value: testScores['Face Width Ratio'] || 0, icon: <Straighten /> },
    { label: 'Eye Spacing', value: testScores['Eye Spacing'] || 0, icon: <RemoveRedEye /> },
    { label: 'Nasal Bridge', value: testScores['Nasal Bridge'] || 0, icon: <Psychology /> },
    { label: 'Forehead', value: testScores['Forehead Ratio'] || 0, icon: <Person /> },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: 1,
        background: 'rgba(13, 17, 44, 0.85)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(250, 14, 164, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        zIndex: 3,
        animation: `${fadeIn} 0.5s ease-out`,
        maxHeight: '120px',
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={0.5}>
        {stats.map((stat, index) => (
          <Grid item xs={6} key={index}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                p: 0.5,
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
                  width: 16,
                  height: 16,
                  '& .MuiSvgIcon-root': { fontSize: 14 },
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
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {stat.label}
                </Typography>
                <Box
                  sx={{
                    height: 3,
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

// FaceScanner Component
const FaceScanner = ({ startScanning, onScanningComplete, onFaceDetected }) => {
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
  const [currentTestScores, setCurrentTestScores] = useState({});
  const toast = useToast();

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
        maxContinuousChecks: 5,
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
          frameRate: { ideal: 30 },
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
      if (isMounted) await startVideo();
    };
    initialize();
    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!model || !videoReady) return;

    const detectFaceAndRunTest = async () => {
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

        const testScores = {};
        tests.forEach((test) => {
          testScores[test] = runTest(test, landmarks, boundingBox);
        });
        setCurrentTestScores(testScores);

        if (isCollecting) {
          scoresRef.current.push(testScores);
        }
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setFaceDetectedTime(0);
        setCurrentTestScores({});
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 100);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected]);

  useEffect(() => {
    if (startScanning && !isCollecting) {
      setIsCollecting(true);
      
      // Add 5 second delay before countdown starts
      setTimeout(() => {
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
              const testScores = collectedScores.map((scores) => scores[test]);
              const sortedTestScores = [...testScores].sort((a, b) => a - b);
              const n = sortedTestScores.length;
              const k = Math.ceil(n / 4);
              const lowerQuartile = sortedTestScores.slice(0, k);
              const average = lowerQuartile.reduce((sum, val) => sum + val, 0) / k;
              testAverages[test] = average;
            });
            const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
            const finalScore =
              totalWeight > 0
                ? Object.entries(testAverages).reduce(
                    (sum, [test, score]) => sum + score * weights[test],
                    0
                  ) / totalWeight
                : 0;
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
      }, 5000);
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
            loadingProgress < 30 ? 'Initializing...' : loadingProgress < 100 ? 'Loading Model...' : 'Almost Ready...'
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
          <ErrorOutlineIcon
            sx={{ fontSize: 48, color: 'error.main', mb: 2, filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.3))' }}
          />
          <Typography variant="h6" color="error" mb={2} sx={{ fontSize: { base: '1rem', md: '1.25rem' } }}>
            <WarningAmberIcon sx={{ fontSize: 24, mr: 1 }} /> Camera Error
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
            <Face /> Please position your face in the frame
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

// ResultDisplay Component
const ResultDisplay = ({ percentage, tierLabel }) => {
  return (
    <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={120}
        thickness={4}
        sx={{ color: '#09c2f7', '& .MuiCircularProgress-circle': { transition: 'stroke-dashoffset 1s ease-in-out' } }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {percentage.toFixed(0)}%
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Likelihood
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{
          mt: 2,
          background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
        }}
      >
        {tierLabel}
      </Typography>
    </Box>
  );
};

// DetailedResultDisplay Component
const DetailedResultDisplay = ({ overallPercentage, testScores }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [funnyDescription, setFunnyDescription] = useState(null);

  useEffect(() => {
    if (testScores) {
      setFunnyDescription(generateAutismRatingName(overallPercentage, testScores));
    }
  }, [overallPercentage, testScores]);

  let tierLabel, tierDescription, tierEmoji;
  if (overallPercentage >= 90) {
    tierLabel = 'High Likelihood';
    tierDescription = 'Several facial features align with autism spectrum traits.';
    tierEmoji = <SentimentDissatisfied />;
  } else if (overallPercentage >= 60) {
    tierLabel = 'Moderate Likelihood';
    tierDescription = 'Some facial features suggest potential autism traits.';
    tierEmoji = <SentimentNeutral />;
  } else {
    tierLabel = 'Low Likelihood';
    tierDescription = 'Few facial features align with autism traits.';
    tierEmoji = <SentimentSatisfied />;
  }

  const featureIcons = {
    'Face Width Ratio': <Straighten />,
    'Eye Spacing': <RemoveRedEye />,
    'Nasal Bridge': <Psychology />,
    'Forehead Ratio': <Person />,
  };

  const featureDescriptions = {
    'Face Width Ratio': 'Measures the proportion of facial width to height.',
    'Eye Spacing': 'Analyzes the distance between the eyes.',
    'Nasal Bridge': 'Evaluates the structure of the nasal bridge.',
    'Forehead Ratio': 'Assesses the forehead proportion to face height.',
  };

  const sortedFeatures = Object.entries(testScores)
    .sort(([, a], [, b]) => b - a)
    .map(([test, score]) => ({
      test,
      score,
      impact: score >= 75 ? 'High' : score >= 50 ? 'Moderate' : 'Low',
    }));

  const bestFeature = sortedFeatures[0];
  const worstFeature = sortedFeatures[sortedFeatures.length - 1];

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
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
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {funnyDescription?.overall}
        </Typography>

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
                Most Indicative
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
              {bestFeature?.test}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {funnyDescription?.bestFeature}
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
                Least Indicative
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
              {worstFeature?.test}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {funnyDescription?.worstFeature}
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
              const color = impact === 'High' ? '#ff6b6b' : impact === 'Moderate' ? '#ffd93d' : '#6bcb77';
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
                    <Typography variant="h4" mr={2} sx={{ color }}>
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
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          *This is an experimental estimation based on facial features, not a medical diagnosis. Consult a professional for
          accurate assessment.*
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
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
      title: 'Criminality Analysis',
      description: 'Evaluate behavioral patterns and risk factors',
      path: '/scan/crime',
      icon: <WarningAmberIcon />,
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
const AutismAnalytic = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('instructions');
  const [likelihoodScore, setLikelihoodScore] = useState(null);
  const [testScores, setTestScores] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const toast = useToast();

  const testToPropMap = {
    'Face Width Ratio': 'faceWidthRatio',
    'Eye Spacing': 'eyeSpacing',
    'Nasal Bridge': 'nasalBridge',
    'Forehead Ratio': 'foreheadRatio',
  };

  const handleScanningComplete = (result) => {
    if (result) {
      setIsLoadingResults(true);
      setLoadingProgress(0);
      
      // Simulate loading progress
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            const { finalScore, testAverages } = result;
            setLikelihoodScore(finalScore);
            setTestScores(testAverages);
            setCurrentStep('result');
            setIsLoadingResults(false);
            return 100;
          }
          return prev + 1;
        });
      }, 20);
    } else {
      toast({ title: 'Error', description: 'No face detected during scan', status: 'error', duration: 3000 });
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
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 'xl', mx: 'auto' }}>
        {isLoadingResults ? (
          <>
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
          </>
        ) : (currentStep === 'instructions' || currentStep === 'scanning') ? (
          <>
            <Box sx={{ my: 8 }}>
              <StyledWebcamContainer>
                <FaceScanner
                  startScanning={currentStep === 'scanning'}
                  onScanningComplete={handleScanningComplete}
                  onFaceDetected={handleFaceDetected}
                />
              </StyledWebcamContainer>
              {currentStep === 'instructions' && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="h5" sx={{ color: '#fff' }}>
                    Position your face in the frame
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Ensure good lighting and keep your face straight
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        ) : currentStep === 'result' ? (
          <>
            <Box sx={{ py: 8 }}>
              <DetailedResultDisplay
                overallPercentage={likelihoodScore}
                testScores={testScores}
              />
              <ExploreOtherTests />
            </Box>
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
          </>
        ) : null}
      </Box>
    </Box>
  );
};

// Helper functions
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

// Scoring Functions
const runTest = (test, landmarks, boundingBox) => {
  switch (test) {
    case 'Face Width Ratio':
      return calculateFaceWidthScore(landmarks, boundingBox);
    case 'Eye Spacing':
      return calculateEyeSpacingScore(landmarks, boundingBox);
    case 'Nasal Bridge':
      return calculateNasalBridgeScore(landmarks);
    case 'Forehead Ratio':
      return calculateForeheadRatioScore(landmarks);
    default:
      return 0;
  }
};

const calculateFaceWidthScore = (landmarks, boundingBox) => {
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const faceHeight = boundingBox.bottomRight[1] - boundingBox.topLeft[1];
  const ratio = faceWidth / faceHeight;
  if (ratio < 0.75) return 100;
  return 0;
};

const calculateEyeSpacingScore = (landmarks, boundingBox) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const eyeDistance = Math.abs(rightEyeCenter[0] - leftEyeCenter[0]);
  const ratio = eyeDistance / faceWidth;
  if ((ratio > 0.295 && ratio < 0.3) || ratio > 0.32) return 100;
  return 0;
};

const calculateNasalBridgeScore = (landmarks) => {
  const noseTop = landmarks[1][1];
  const noseBottom = landmarks[2][1];
  const noseLeft = landmarks[129][0];
  const noseRight = landmarks[358][0];
  const noseHeight = Math.abs(noseBottom - noseTop);
  const noseWidth = Math.abs(noseRight - noseLeft);
  const ratio = noseHeight / noseWidth;
  if (ratio > 0.16) return 100;
  return 50;
};

const calculateForeheadRatioScore = (landmarks) => {
  const foreheadTop = landmarks[10][1];
  const noseBase = landmarks[1][1];
  const chin = landmarks[152][1];
  const foreheadHeight = Math.abs(noseBase - foreheadTop);
  const faceHeight = Math.abs(chin - foreheadTop);
  const ratio = foreheadHeight / faceHeight;
  if (ratio > 0.56) return 100;
  return 50;
};

export default AutismAnalytic;