import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';
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
  FormControl as MuiFormControl,
  FormLabel as MuiFormLabel,
  Select as MuiSelect,
  MenuItem,
  TextField,
  Button as MuiButton,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Box as MuiBox,
  LinearProgress,
} from '@mui/material';
import useVideoStream from '../hooks/useVideoStream';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import { generateAutismRatingName } from '../utils/autsimRatingNameGenerator';

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

// FaceScanner Component
const FaceScanner = ({ startScanning, onScanningComplete, onFaceDetected, gender }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const scoresRef = useRef([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [score, setScore] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [model, setModel] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [faceDetectedTime, setFaceDetectedTime] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [currentTestScores, setCurrentTestScores] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const toast = useToast();

  // Use the video stream hook
  const stream = useVideoStream();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        const loadedModel = await facemesh.load();
        if (isMounted) setModel(loadedModel);
      } catch (err) {
        if (isMounted) setWebcamError('Failed to load FaceMesh model');
      }
    };

    loadModel();
    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Set up video stream when it's available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        setVideoReady(true);
        videoRef.current.play().catch((err) => {
          console.error('Error playing video:', err);
          setWebcamError('Failed to play video');
        });
      };
    }
  }, [stream]);

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

      context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(canvas.width / 2, 0);
      context.lineTo(canvas.width / 2, canvas.height);
      context.moveTo(0, canvas.height / 2);
      context.lineTo(canvas.width, canvas.height / 2);
      if (!isMobile) {
        context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 6, canvas.height / 4, 0, 0, 2 * Math.PI);
      }
      context.stroke();

      if (predictions.length > 0) {
        setFaceDetected(true);
        onFaceDetected(true);
        setFaceDetectedTime(prev => prev + 0.5);
        
        const face = predictions[0];
        const landmarks = face.scaledMesh;
        const boundingBox = face.boundingBox;

        const testScores = {};
        tests.forEach((test) => {
          testScores[test] = runTest(test, landmarks, boundingBox);
        });
        setCurrentTestScores(testScores);
        
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        const currentScore =
          totalWeight > 0
            ? Object.entries(testScores).reduce(
                (sum, [test, score]) => sum + score * weights[test],
                0
              ) / totalWeight
            : 0;
        setScore(currentScore);
        if (isCollecting) {
          scoresRef.current.push(testScores);
          console.log('Test scores collected:', testScores);
        }

        landmarks.forEach(([x, y]) => {
          context.beginPath();
          context.arc(x, y, 1, 0, 2 * Math.PI);
          context.fillStyle = 'rgba(0, 255, 255, 0.5)';
          context.fill();
        });
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setScore(0);
        setFaceDetectedTime(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 500);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected, gender, isMobile]);

  useEffect(() => {
    if (faceDetectedTime >= 3 && !isCollecting && !startScanning) {
      handleStartScanning();
    }
  }, [faceDetectedTime]);

  useEffect(() => {
    if (countdown === 0) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 500);
    }
  }, [countdown]);

  const handleStartScanning = () => {
    if (faceDetected) {
      setIsCollecting(true);
      setCountdown(5);
      scoresRef.current = [];
      console.log('Countdown started');

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
    }
  };

  if (webcamError) {
    toast({ title: 'Error', description: webcamError, status: 'error', duration: 5000, isClosable: true });
  }

  return (
    <Box position="relative" w="100%" h="100%">
      {!model && !webcamError && (
        <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" fontSize="lg">
          Loading model...
        </Text>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
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
      {faceDetected && !isCollecting && (
        <MuiBox
          sx={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            p: 2,
            borderRadius: '8px',
            color: 'white',
            maxWidth: '300px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Real-time Analysis</Typography>
            {Object.entries(currentTestScores).map(([test, score]) => (
              <Box key={test}>
                <Typography variant="body2">{test}</Typography>
                <Box sx={{ position: 'relative', height: '4px', bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', mt: 1 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${score}%`,
                      bgcolor: '#00BCD4',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease-out'
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ mt: 1 }}>{score.toFixed(1)}%</Typography>
              </Box>
            ))}
          </Box>
        </MuiBox>
      )}
      {countdown !== null && (
        <MuiBox
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: '6rem',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              animation: countdown === 0 ? 'pulse 0.5s ease-out' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.2)' },
                '100%': { transform: 'scale(1)' }
              }
            }}
          >
            {countdown}
          </Typography>
        </MuiBox>
      )}
      {!isCollecting && faceDetected && (
        <MuiBox
          sx={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            width: '90%',
            maxWidth: '400px'
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleStartScanning}
            disabled={faceDetectedTime >= 3}
            sx={{
              opacity: faceDetectedTime >= 3 ? 0.5 : 1,
              '&:hover': {
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s'
            }}
          >
            {faceDetectedTime >= 3 ? "Starting..." : "Start Scanning"}
          </Button>
        </MuiBox>
      )}
    </Box>
  );
};

// ResultDisplay Component with Tier Label
const ResultDisplay = ({ percentage, tierLabel }) => {
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
      <CircularProgress 
        variant="determinate" 
        value={percentage} 
        size={120} 
        thickness={4}
        sx={{
          color: percentage >= 90 ? '#FF6B6B' : percentage >= 60 ? '#FFD93D' : '#6BCB77',
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
          {percentage.toFixed(0)}%
        </Typography>
        <Typography variant="h6" component="div" color="textPrimary" mt={1}>
          {tierLabel}
        </Typography>
      </MuiBox>
    </MuiBox>
  );
};

// DetailedResultDisplay Component with Progress Bars and Humorous Description
const DetailedResultDisplay = ({ overallPercentage, testScores }) => {
  const navigate = useNavigate();

  let tierLabel, tierDescription;
  if (overallPercentage >= 90) {
    tierLabel = 'Tier 1: High Likelihood';
    tierDescription = 'Several facial features align with common autism spectrum characteristics. This suggests a higher likelihood of autism-related traits.';
  } else if (overallPercentage >= 60) {
    tierLabel = 'Tier 2: Moderate Likelihood';
    tierDescription = 'Some facial features show potential autism spectrum characteristics. This indicates a moderate likelihood of autism-related traits.';
  } else {
    tierLabel = 'Tier 3: Low Likelihood';
    tierDescription = 'Few facial features align with autism spectrum characteristics. This suggests a lower likelihood of autism-related traits.';
  }

  const featureIcons = {
    'Face Width Ratio': '👤',
    'Eye Spacing': '👀',
    'Nasal Bridge': '👃',
    'Forehead Ratio': '🧠'
  };

  const featureDescriptions = {
    'Face Width Ratio': 'Measures the proportion of facial width to height',
    'Eye Spacing': 'Analyzes the distance between the eyes',
    'Nasal Bridge': 'Evaluates the structure of the nose bridge',
    'Forehead Ratio': 'Assesses the proportion of forehead to total face height'
  };

  // Generate humorous description if testScores are available
  const funnyDescription = testScores ? generateAutismRatingName(overallPercentage, testScores) : '';

  if (!testScores) {
    return (
      <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
          Estimated Autism Likelihood
        </Typography>
        <MuiBox display="flex" justifyContent="center" mb={4}>
          <ResultDisplay percentage={overallPercentage} tierLabel={tierLabel} />
        </MuiBox>
        <Typography variant="body1" color="textSecondary" align="center">
          *Note: This is an experimental estimation based on facial features and not a medical diagnosis. Consult a professional for accurate assessment.*
        </Typography>
      </MuiBox>
    );
  }

  // Sort features by score to show most significant ones first
  const sortedFeatures = Object.entries(testScores)
    .sort(([, a], [, b]) => b - a)
    .map(([test, score]) => ({
      test,
      score,
      impact: score >= 75 ? 'high' : score >= 50 ? 'moderate' : 'low'
    }));

  return (
    <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      {/* Vibe Section - Now more prominent */}
      {funnyDescription && (
        <MuiBox 
          sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #6B46C1 0%, #4299E1 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.5s ease-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(-20px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Typography variant="h5" gutterBottom align="center" fontWeight="bold">
            Your Autism Vibe
          </Typography>
          <Typography 
            variant="h6" 
            align="center"
            sx={{ 
              fontStyle: 'italic',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              mb: 2
            }}
          >
            {funnyDescription}
          </Typography>
          
        </MuiBox>
      )}

      {/* Main Score Display */}
      <MuiBox 
        sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          animation: 'slideUp 0.5s ease-out',
          '@keyframes slideUp': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
          Estimated Autism Likelihood
        </Typography>
        <MuiBox display="flex" justifyContent="center" mb={2}>
          <ResultDisplay percentage={overallPercentage} tierLabel={tierLabel} />
        </MuiBox>
        <Typography variant="body1" color="textSecondary" align="center">
          {tierDescription}
        </Typography>
      </MuiBox>

      {/* Features Analysis */}
      <MuiBox 
        sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          animation: 'slideUp 0.5s ease-out 0.2s both',
          '@keyframes slideUp': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Key Features Analysis
        </Typography>
        <Stack spacing={3}>
          {sortedFeatures.map(({ test, score, impact }, index) => {
            const color = impact === 'high' ? '#FF6B6B' : impact === 'moderate' ? '#FFD93D' : '#6BCB77';
            const impactText = impact === 'high' ? 'Strong Indicator' : impact === 'moderate' ? 'Moderate Indicator' : 'Neutral';

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
                  border: `1px solid ${color}20`,
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(5px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }
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
                    {impactText}
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
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Non-Autistic
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Autistic
                    </Typography>
                  </MuiBox>
                </MuiBox>
              </MuiBox>
            );
          })}
        </Stack>
      </MuiBox>

      {/* Disclaimer Section */}
      <MuiBox 
        sx={{ 
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          animation: 'slideUp 0.5s ease-out 0.4s both',
          '@keyframes slideUp': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Important Note
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center">
          This analysis is based on facial features and is for entertainment purposes only. It is not a medical diagnosis and should not be used as such. If you have concerns about autism spectrum traits, please consult with a qualified healthcare professional.
        </Typography>
      </MuiBox>

      {/* Navigation Button */}
      <MuiBox mt={4} display="flex" justifyContent="center">
        <MuiButton
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' }
            },
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontSize: '1.1rem'
          }}
        >
          Back to Home
        </MuiButton>
      </MuiBox>
    </MuiBox>
  );
};

// Main Component
const AutismAnalytic = () => {
  const { userData, loading: loadingUser } = useUserData();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(null);
  const [scanFor, setScanFor] = useState(null);
  const [gender, setGender] = useState('');
  const [likelihoodScore, setLikelihoodScore] = useState(null);
  const [testScores, setTestScores] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const toast = useToast();

  const testToPropMap = {
    'Face Width Ratio': 'faceWidthRatio',
    'Eye Spacing': 'eyeSpacing',
    'Nasal Bridge': 'nasalBridge',
    'Forehead Ratio': 'foreheadRatio',
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
    if (currentStep === 'result' && userInfo && likelihoodScore !== null) {
      const saveLikelihoodToFirestore = async () => {
        try {
          const likelihoodData = {
            name: userInfo.name,
            uid: user.uid,
            ethnicity: userInfo.ethnicity,
            eyeColor: userInfo.eyeColor,
            height: userInfo.height,
            weight: userInfo.weight,
            gender: userInfo.gender,
            testScores: userInfo.testScores,
            likelihoodPercentage: likelihoodScore,
            timestamp: new Date(),
          };
          await addDoc(collection(db, 'autismLikelihoods'), likelihoodData);
          console.log('Likelihood saved to Firestore:', likelihoodData);
        } catch (error) {
          console.error('Error saving likelihood to Firestore:', error);
          toast({
            title: 'Error',
            description: 'Failed to save likelihood to Firestore.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      saveLikelihoodToFirestore();
    }
  }, [currentStep, userInfo, likelihoodScore, user, toast]);

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
    setGender(genderMap[selectedGender]);
    setCurrentStep('instructions');
  };

  const handleStartScanning = () => {
    if (faceDetected) {
      setCurrentStep('scanning');
      console.log('Starting scanning');
    } else {
      toast({
        title: 'Error',
        description: 'Face not detected. Please adjust your position.',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const handleScanningComplete = (result) => {
    if (result !== null) {
      const { finalScore, testAverages } = result;
      const transformedTestScores = {};
      for (const [test, score] of Object.entries(testAverages)) {
        const propName = testToPropMap[test];
        if (propName) {
          transformedTestScores[propName] = score;
        }
      }
      if (scanFor === 'myself') {
        setUserInfo((prev) => ({
          ...prev,
          ...transformedTestScores,
          testScores: testAverages,
          likelihoodScore: finalScore,
        }));
        setLikelihoodScore(finalScore);
        setTestScores(testAverages);
        setCurrentStep('result');
      } else {
        setLikelihoodScore(finalScore);
        setTestScores(testAverages);
        setCurrentStep('form');
      }
    } else {
      toast({
        title: 'Error',
        description: 'No face detected during scan. Please try again.',
        status: 'error',
        duration: 3000,
      });
      setCurrentStep('instructions');
    }
  };

  const handleFaceDetected = (detected) => {
    setFaceDetected(detected);
    console.log('Face detected:', detected);
  };

  const handleFormSubmit = (info) => {
    const transformedTestScores = {};
    for (const [test, score] of Object.entries(testScores)) {
      const propName = testToPropMap[test];
      if (propName) {
        transformedTestScores[propName] = score;
      }
    }
    const updatedUserInfo = {
      name: info.name,
      ...transformedTestScores,
      testScores: testScores,
      ethnicity: info.ethnicity,
      eyeColor: info.eyeColor,
      height: info.height,
      weight: info.weight,
      gender: gender,
      likelihoodScore: likelihoodScore,
    };
    setUserInfo(updatedUserInfo);
    console.log('Form submitted, userInfo:', updatedUserInfo);
    setCurrentStep('result');
  };

  const genderMap = {
    'Male': 'M',
    'Female': 'W',
    'Non-binary': 'M',
    'Other': 'W',
    'Prefer not to say': 'M',
  };

  return (
    <>
      <TopBar />
      <Container maxW="container.xl" py={{ base: 4, md: 6 }} bg="gray.50">
        <VStack spacing={6} align="stretch">
          {currentStep === 'scanForSelection' && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Who are you scanning for?</Heading>
              <Button
                style={{ backgroundColor: 'black', color: 'white', width: '30%' }}
                onClick={() => handleScanForSelection('myself')}
              >
                For Myself
              </Button>
              <Button
                style={{ backgroundColor: 'black', color: 'white', width: '30%' }}
                onClick={() => handleScanForSelection('someoneElse')}
              >
                For Someone Else
              </Button>
            </VStack>
          )}
          {currentStep === 'genderSelection' && scanFor === 'someoneElse' && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Select Gender for Someone Else</Heading>
              <MuiFormControl>
                <MuiFormLabel>Pick One</MuiFormLabel>
                <MuiSelect
                  value={gender}
                  onChange={(e) => handleGenderSelection(e.target.value)}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Choose here
                  </MenuItem>
                  {Object.keys(genderMap).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </MuiFormControl>
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
              bg="gray.200"
            >
              <FaceScanner
                startScanning={currentStep === 'scanning'}
                onScanningComplete={handleScanningComplete}
                onFaceDetected={handleFaceDetected}
                gender={userInfo?.gender || gender}
              />
            </Box>
          )}
          {currentStep === 'instructions' && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Let's Scan the Face!</Heading>
              <Text fontSize="lg" textAlign="center">
                Position the face in front of the camera with good lighting and keep it straight. Results may vary if not aligned properly. The scan starts when a face is detected!
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
          {currentStep === 'result' && likelihoodScore !== null && (
            <VStack spacing={4} align="center">
              <Heading size="lg">Estimated Autism Likelihood</Heading>
              <DetailedResultDisplay
                overallPercentage={likelihoodScore}
                testScores={testScores}
              />
            </VStack>
          )}
        </VStack>
      </Container>
      <Footer />
    </>
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
  
  console.log('Face Measurements:');
  console.log('Width:', faceWidth);
  console.log('Height:', faceHeight);
  console.log('Width/Height Ratio:', ratio);
  
  if (ratio < 0.75) return 100;
  return 0;
};

const calculateEyeSpacingScore = (landmarks, boundingBox) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const eyeDistance = Math.abs(rightEyeCenter[0] - leftEyeCenter[0]);
  const ratio = eyeDistance / faceWidth;
  
  console.log('Eye Measurements:');
  console.log('Left Eye Center:', leftEyeCenter);
  console.log('Right Eye Center:', rightEyeCenter);
  console.log('Eye Distance:', eyeDistance);
  console.log('Face Width:', faceWidth);
  console.log('Eye Distance/Face Width Ratio:', ratio);
  
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
  
  console.log('Nose Measurements:');
  console.log('Nose Height:', noseHeight);
  console.log('Nose Width:', noseWidth);
  console.log('Nose Height/Width Ratio:', ratio);
  
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
  
  console.log('Forehead Measurements:');
  console.log('Forehead Height:', foreheadHeight);
  console.log('Face Height:', faceHeight);
  console.log('Forehead/Face Height Ratio:', ratio);
  
  if (ratio > 0.56) return 100;
  return 50;
};

export default AutismAnalytic;