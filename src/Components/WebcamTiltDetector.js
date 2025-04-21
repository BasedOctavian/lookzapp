import React, { useState, useRef, useEffect } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Slider,
  Divider,
  ButtonGroup as MuiButtonGroup,
} from '@mui/material';
import { RestartAlt as RestartAltIcon, ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon, Check as CheckIcon } from '@mui/icons-material';
import { generateRatingName } from '../utils/ratingNameGenerator';

// Define tests, weights, and params (Undereyes removed)
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

const weights = {
  'Carnal Tilt': 3.0,
  'Facial Thirds': 1.5,
  'Cheekbone Location': 2.0,
  'Interocular Distance': 1.0,
  'Jawline': 1.5,
  'Chin': 1.5,
  'Nose': 1.0,
};

const testParams = {
  'Carnal Tilt': 10,
  'Facial Thirds': 100,
  'Cheekbone Location': 11,
  'Interocular Distance': 200,
  'Jawline': 200,
  'Chin': 300,
  'Nose': 400,
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

// Helper functions for physical scores
const minHeight = { M: 60, W: 55 };
const maxHeight = { M: 80, W: 75 };

const calculateHeightPhysicalScore = (height, gender) => {
  const minH = minHeight[gender] || 60;
  const maxH = maxHeight[gender] || 80;
  return Math.min(100, Math.max(0, ((height - minH) / (maxH - minH)) * 100));
};

const calculateWeightPhysicalScore = (height, weight, gender) => {
  let idealWeight, deviation, weightScore;
  if (gender === 'M') {
    idealWeight = (height - 60) * 7 + 110;
    deviation = Math.abs(weight - idealWeight);
    weightScore = Math.max(0, 20 - 0.5 * deviation);
  } else if (gender === 'W') {
    idealWeight = 100 + 5 * (height - 60);
    deviation = Math.abs(weight - idealWeight);
    weightScore = Math.max(0, 20 - 0.4 * deviation);
  } else {
    return 50;
  }
  return (weightScore / 20) * 100;
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

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isMounted) {
              setVideoReady(true);
              videoRef.current.play().catch((err) => {
                console.error('Error playing video:', err);
                if (isMounted) setWebcamError('Failed to play video');
              });
            }
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        if (isMounted) setWebcamError('Webcam access denied or unavailable');
      }
    };

    loadModel().then(startVideo);
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

        const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
        const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
        const dy = rightEyeCenter[1] - leftEyeCenter[1];
        const dx = rightEyeCenter[0] - leftEyeCenter[0];
        const carnalTiltAngle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

        const forehead = landmarks[10][1];
        const noseBase = landmarks[1][1];
        const chin = landmarks[152][1];
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
          noseRatio
        };

        const testScores = {};
        tests.forEach((test) => {
          if (test !== 'Overall') {
            testScores[test] = runTest(test, landmarks, boundingBox, testParams, gender);
          }
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
          scoresRef.current.push({ ...testScores, measurements });
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
          const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
          const finalScore =
            totalWeight > 0
              ? Object.entries(testAverages).reduce(
                  (sum, [test, score]) => sum + score * weights[test],
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
        <Box
          position="absolute"
          top="20px"
          right="20px"
          bg="rgba(0, 0, 0, 0.7)"
          p={4}
          borderRadius="lg"
          color="white"
          maxW="300px"
          backdropFilter="blur(8px)"
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        >
          <VStack align="stretch" spacing={2}>
            <Text fontSize="lg" fontWeight="bold">Real-time Analysis</Text>
            {Object.entries(currentTestScores).map(([test, score]) => (
              <Box key={test}>
                <Text fontSize="sm">{test}</Text>
                <Box position="relative" h="4px" bg="rgba(255, 255, 255, 0.2)" borderRadius="full" mt={1}>
                  <Box
                    position="absolute"
                    left={0}
                    top={0}
                    h="100%"
                    w={`${score}%`}
                    bg="cyan.400"
                    borderRadius="full"
                    transition="width 0.3s ease-out"
                  />
                </Box>
                <Text fontSize="xs" mt={1}>{score.toFixed(1)}%</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
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
            fontSize="6xl"
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
      {!isCollecting && faceDetected && (
        <Box
          position="absolute"
          bottom="20px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={3}
          w="90%"
          maxW="400px"
        >
          <Button
            colorScheme="cyan"
            size="lg"
            w="100%"
            onClick={handleStartScanning}
            opacity={faceDetectedTime >= 3 ? 0.5 : 1}
            isDisabled={faceDetectedTime >= 3}
            _hover={{ transform: "translateY(-2px)" }}
            transition="all 0.2s"
          >
            {faceDetectedTime >= 3 ? "Starting..." : "Start Scanning"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

// UserInfoForm Component
const UserInfoForm = ({ onSubmit, gender }) => {
  const [unitSystem, setUnitSystem] = useState('imperial');
  const [name, setName] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [currentStep, setCurrentStep] = useState(1);

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
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
  }, [unitSystem]);

  const handleNext = () => {
    if (currentStep === 1 && !name) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'error' });
      return;
    }
    if (currentStep === 2 && !ethnicity) {
      setSnackbar({ open: true, message: 'Please select an ethnicity', severity: 'error' });
      return;
    }
    if (currentStep === 3 && !eyeColor) {
      setSnackbar({ open: true, message: 'Please select an eye color', severity: 'error' });
      return;
    }
    if (currentStep === 4) {
      if (unitSystem === 'imperial' && (!heightFeet || !heightInches || !weightValue)) {
        setSnackbar({ open: true, message: 'Please fill in all height and weight fields', severity: 'error' });
        return;
      }
      if (unitSystem === 'metric' && (!heightCm || !weightValue)) {
        setSnackbar({ open: true, message: 'Please fill in all height and weight fields', severity: 'error' });
        return;
      }
      handleSubmit();
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = () => {
    let totalHeightInches, totalWeightPounds;
    if (unitSystem === 'imperial') {
      const feet = parseFloat(heightFeet);
      const inches = parseFloat(heightInches);
      const weight = parseFloat(weightValue);
      if (isNaN(feet) || isNaN(inches) || isNaN(weight)) {
        setSnackbar({ open: true, message: 'Height and weight must be numbers', severity: 'error' });
        return;
      }
      totalHeightInches = feet * 12 + inches;
      totalWeightPounds = weight;
    } else {
      const cm = parseFloat(heightCm);
      const kg = parseFloat(weightValue);
      if (isNaN(cm) || isNaN(kg)) {
        setSnackbar({ open: true, message: 'Height and weight must be numbers', severity: 'error' });
        return;
      }
      totalHeightInches = cm / 2.54;
      totalWeightPounds = kg * 2.20462;
    }

    onSubmit({
      name,
      ethnicity: ethnicityMap[ethnicity],
      eyeColor: eyeColorMap[eyeColor],
      height: totalHeightInches,
      weight: totalWeightPounds,
      gender,
    });
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
    setCurrentStep(1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MuiBox sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              What's their name?
            </Typography>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Enter their name"
              sx={{ mt: 2 }}
              autoFocus
            />
          </MuiBox>
        );
      case 2:
        return (
          <MuiBox sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              What's their ethnicity?
            </Typography>
            <MuiBox sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mt: 2 }}>
              {Object.keys(ethnicityMap).map((option) => (
                <MuiButton
                  key={option}
                  variant={ethnicity === option ? 'contained' : 'outlined'}
                  onClick={() => setEthnicity(option)}
                  sx={{ py: 2, borderRadius: 2, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 } }}
                >
                  {option}
                </MuiButton>
              ))}
            </MuiBox>
          </MuiBox>
        );
      case 3:
        return (
          <MuiBox sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              What color are their eyes?
            </Typography>
            <MuiBox sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mt: 2 }}>
              {Object.keys(eyeColorMap).map((option) => (
                <MuiButton
                  key={option}
                  variant={eyeColor === option ? 'contained' : 'outlined'}
                  onClick={() => setEyeColor(option)}
                  sx={{ py: 2, borderRadius: 2, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 } }}
                >
                  {option}
                </MuiButton>
              ))}
            </MuiBox>
          </MuiBox>
        );
      case 4:
        return (
          <MuiBox sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              How tall and heavy are they?
            </Typography>
            <MuiBox sx={{ mt: 2 }}>
              <MuiButtonGroup variant="outlined" value={unitSystem} onChange={(e) => setUnitSystem(e.target.value)} sx={{ mb: 3 }}>
                <MuiButton value="imperial" onClick={() => setUnitSystem('imperial')} variant={unitSystem === 'imperial' ? 'contained' : 'outlined'}>Imperial</MuiButton>
                <MuiButton value="metric" onClick={() => setUnitSystem('metric')} variant={unitSystem === 'metric' ? 'contained' : 'outlined'}>Metric</MuiButton>
              </MuiButtonGroup>
              {unitSystem === 'imperial' ? (
                <MuiBox sx={{ display: 'grid', gap: 2 }}>
                  <MuiBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField label="Height (feet)" type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} fullWidth inputProps={{ min: 0, max: 8 }} />
                    <TextField label="Height (inches)" type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} fullWidth inputProps={{ min: 0, max: 11 }} />
                  </MuiBox>
                  <TextField label="Weight (pounds)" type="number" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} fullWidth />
                </MuiBox>
              ) : (
                <MuiBox sx={{ display: 'grid', gap: 2 }}>
                  <TextField label="Height (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} fullWidth />
                  <TextField label="Weight (kg)" type="number" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} fullWidth />
                </MuiBox>
              )}
            </MuiBox>
          </MuiBox>
        );
      default:
        return null;
    }
  };

  return (
    <MuiBox sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <MuiBox sx={{ mb: 4 }}>
          <LinearProgress variant="determinate" value={(currentStep / 4) * 100} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
          <Typography variant="body2" color="textSecondary" align="center">Step {currentStep} of 4</Typography>
        </MuiBox>
        {renderStep()}
        <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <MuiButton variant="outlined" onClick={handleBack} disabled={currentStep === 1} startIcon={<ArrowBackIcon />}>Back</MuiButton>
          <MuiButton variant="contained" onClick={handleNext} endIcon={currentStep === 4 ? <CheckIcon /> : <ArrowForwardIcon />}>{currentStep === 4 ? 'Submit' : 'Next'}</MuiButton>
        </MuiBox>
        <MuiBox sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <MuiButton variant="text" color="secondary" onClick={handleRevert} startIcon={<RestartAltIcon />}>Start Over</MuiButton>
        </MuiBox>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </MuiBox>
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
            sx={{ color: '#4CAF50', '& .MuiCircularProgress-circle': { transition: 'stroke-dashoffset 1s ease-in-out' } }}
          />
          <MuiBox top={0} left={0} bottom={0} right={0} position="absolute" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Typography variant="h4" component="div" color="textSecondary" fontWeight="bold">{cappedRating.toFixed(2)}</Typography>
            <Typography variant="body2" component="div" color="textPrimary">Overall</Typography>
          </MuiBox>
        </MuiBox>
        {cappedFaceRating !== null && (
          <MuiBox position="relative" display="inline-flex">
            <CircularProgress
              variant="determinate"
              value={cappedFaceRating}
              size={120}
              thickness={4}
              sx={{ color: '#2196F3', '& .MuiCircularProgress-circle': { transition: 'stroke-dashoffset 1s ease-in-out' } }}
            />
            <MuiBox top={0} left={0} bottom={0} right={0} position="absolute" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <Typography variant="h4" component="div" color="textSecondary" fontWeight="bold">{cappedFaceRating.toFixed(2)}</Typography>
              <Typography variant="body2" component="div" color="textPrimary">Face</Typography>
            </MuiBox>
          </MuiBox>
        )}
      </MuiBox>
      <Typography variant="h6" component="div" color="textPrimary" mt={2}>{tierLabel}</Typography>
    </MuiBox>
  );
};

// PhysicalAttributesAdjuster Component
const PhysicalAttributesAdjuster = ({ userInfo, onAttributesChange }) => {
  const [attributes, setAttributes] = useState({
    height: userInfo?.height || 70,
    weight: userInfo?.weight || 150,
    eyeColor: userInfo?.eyeColor || 'brown',
    gender: userInfo?.gender || 'M'
  });

  useEffect(() => {
    if (userInfo) {
      setAttributes({
        height: userInfo.height || 70,
        weight: userInfo.weight || 150,
        eyeColor: userInfo.eyeColor || 'brown',
        gender: userInfo.gender || 'M'
      });
    }
  }, [userInfo]);

  const handleChange = (field, value) => {
    const newAttributes = { ...attributes, [field]: value };
    setAttributes(newAttributes);
    onAttributesChange(newAttributes);
  };

  const handleReset = () => {
    if (userInfo) {
      setAttributes({
        height: userInfo.height || 70,
        weight: userInfo.weight || 150,
        eyeColor: userInfo.eyeColor || 'brown',
        gender: userInfo.gender || 'M'
      });
      onAttributesChange({
        height: userInfo.height || 70,
        weight: userInfo.weight || 150,
        eyeColor: userInfo.eyeColor || 'brown',
        gender: userInfo.gender || 'M'
      });
    }
  };

  const isFromUserData = userInfo?.name === 'Self';

  return (
    <MuiBox sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" align="center">Physical Attributes</Typography>
      <Typography variant="body2" color="textSecondary" align="center" mb={3}>
        {isFromUserData ? "These attributes are pulled from your profile" : "These attributes were provided in the form"}
      </Typography>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3}>
          <MuiFormControl>
            <MuiFormLabel>Gender</MuiFormLabel>
            <MuiSelect value={attributes.gender} onChange={(e) => handleChange('gender', e.target.value)} fullWidth disabled={isFromUserData}>
              <MenuItem value="M">Male</MenuItem>
              <MenuItem value="W">Female</MenuItem>
            </MuiSelect>
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Height (inches)</MuiFormLabel>
            <Slider
              value={attributes.height}
              onChange={(e, value) => handleChange('height', value)}
              min={50}
              max={90}
              step={0.5}
              marks={[{ value: 50, label: '4\'2"' }, { value: 60, label: '5\'0"' }, { value: 70, label: '5\'10"' }, { value: 80, label: '6\'8"' }]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.floor(value / 12)}'${value % 12}"`}
              disabled={isFromUserData}
            />
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Weight (pounds)</MuiFormLabel>
            <Slider
              value={attributes.weight}
              onChange={(e, value) => handleChange('weight', value)}
              min={80}
              max={300}
              step={1}
              marks={[{ value: 80, label: '80' }, { value: 150, label: '150' }, { value: 220, label: '220' }, { value: 300, label: '300' }]}
              valueLabelDisplay="auto"
              disabled={isFromUserData}
            />
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Eye Color</MuiFormLabel>
            <MuiSelect value={attributes.eyeColor} onChange={(e) => handleChange('eyeColor', e.target.value)} fullWidth disabled={isFromUserData}>
              <MenuItem value="blue">Blue</MenuItem>
              <MenuItem value="green">Green</MenuItem>
              <MenuItem value="brown">Brown</MenuItem>
            </MuiSelect>
          </MuiFormControl>
          {!isFromUserData && (
            <MuiBox display="flex" justifyContent="center" mt={2}>
              <MuiButton variant="outlined" color="secondary" onClick={handleReset} startIcon={<RestartAltIcon />}>Reset to Original Values</MuiButton>
            </MuiBox>
          )}
        </Stack>
      </Paper>
    </MuiBox>
  );
};

// WeightAdjuster Component
const WeightAdjuster = ({ weights, onWeightsChange }) => {
  const [localWeights, setLocalWeights] = useState(weights);
  const [originalWeights, setOriginalWeights] = useState(weights);
  const [physicalWeights, setPhysicalWeights] = useState({ eyeColor: 3.0, height: 16, weight: 20 });
  const [originalPhysicalWeights, setOriginalPhysicalWeights] = useState({ eyeColor: 3.0, height: 16, weight: 20 });

  useEffect(() => {
    setLocalWeights(weights);
    setOriginalWeights(weights);
  }, [weights]);

  const handleWeightChange = (feature, value) => {
    const newWeights = { ...localWeights, [feature]: value };
    setLocalWeights(newWeights);
    onWeightsChange(newWeights, physicalWeights);
  };

  const handlePhysicalWeightChange = (feature, value) => {
    const newPhysicalWeights = { ...physicalWeights, [feature]: value };
    setPhysicalWeights(newPhysicalWeights);
    onWeightsChange(localWeights, newPhysicalWeights);
  };

  const handleReset = () => {
    setLocalWeights(originalWeights);
    setPhysicalWeights(originalPhysicalWeights);
    onWeightsChange(originalWeights, originalPhysicalWeights);
  };

  return (
    <MuiBox sx={{ mt格尔: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" align="center">Adjust Feature Weights</Typography>
      <Typography variant="body2" color="textSecondary" align="center" mb={3}>Experiment with different weights to see how they affect the overall rating</Typography>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight="medium" align="center">Facial Features</Typography>
        <Stack spacing={3}>
          {Object.entries(localWeights).map(([feature, weight]) => (
            <MuiFormControl key={feature}>
              <MuiFormLabel>{feature} Weight</MuiFormLabel>
              <Slider
                value={weight}
                onChange={(e, value) => handleWeightChange(feature, value)}
                min={0.5}
                max={5}
                step={0.1}
                marks={[{ value: 0.5, label: '0.5' }, { value: 1, label: '1.0' }, { value: 2, label: '2.0' }, { value: 3, label: '3.0' }, { value: 4, label: '4.0' }, { value: 5, label: '5.0' }]}
                valueLabelDisplay="auto"
              />
            </MuiFormControl>
          ))}
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom fontWeight="medium" align="center">Physical Attributes</Typography>
        <Stack spacing={3}>
          <MuiFormControl>
            <MuiFormLabel>Eye Color Weight</MuiFormLabel>
            <Slider
              value={physicalWeights.eyeColor}
              onChange={(e, value) => handlePhysicalWeightChange('eyeColor', value)}
              min={0}
              max={30}
              step={1}
              marks={[{ value: 0, label: '0' }, { value: 3, label: '3' }, { value: 10, label: '10' }, { value: 20, label: '20' }, { value: 30, label: '30' }]}
              valueLabelDisplay="auto"
            />
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Height Weight</MuiFormLabel>
            <Slider
              value={physicalWeights.height}
              onChange={(e, value) => handlePhysicalWeightChange('height', value)}
              min={0}
              max={50}
              step={1}
              marks={[{ value: 0, label: '0' }, { value: 10, label: '10' }, { value: 16, label: '16' }, { value: 20, label: '20' }, { value: 30, label: '30' }, { value: 40, label: '40' }, { value: 50, label: '50' }]}
              valueLabelDisplay="auto"
            />
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Weight Weight</MuiFormLabel>
            <Slider
              value={physicalWeights.weight}
              onChange={(e, value) => handlePhysicalWeightChange('weight', value)}
              min={0}
              max={50}
              step={1}
              marks={[{ value: 0, label: '0' }, { value: 10, label: '10' }, { value: 20, label: '20' }, { value: 30, label: '30' }, { value: 40, label: '40' }, { value: 50, label: '50' }]}
              valueLabelDisplay="auto"
            />
          </MuiFormControl>
        </Stack>
        <MuiBox display="flex" justifyContent="center" mt={3}>
          <MuiButton variant="outlined" color="secondary" onClick={handleReset} startIcon={<RestartAltIcon />}>Reset to Original Weights</MuiButton>
        </MuiBox>
      </Paper>
    </MuiBox>
  );
};

// DetailedResultDisplay Component
const DetailedResultDisplay = ({ overallRating, faceRating, testScores, userInfo }) => {
  const navigate = useNavigate();
  const [adjustedRating, setAdjustedRating] = useState(overallRating);
  const [adjustedUserInfo, setAdjustedUserInfo] = useState(userInfo);
  const [adjustedWeights, setAdjustedWeights] = useState(weights);
  const [adjustedPhysicalWeights, setAdjustedPhysicalWeights] = useState({ eyeColor: 3.0, height: 16, weight: 20 });
  const [ratingName, setRatingName] = useState('');
  const [loadingNames, setLoadingNames] = useState([]);
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);

  let tierLabel, tierDescription;
  if (adjustedRating >= 80) {
    tierLabel = 'Very Attractive';
    tierDescription = 'Your features align closely with conventional standards of attractiveness.';
  } else if (adjustedRating >= 60) {
    tierLabel = 'Attractive';
    tierDescription = 'Your features are generally appealing and well-proportioned.';
  } else if (adjustedRating >= 40) {
    tierLabel = 'Average';
    tierDescription = 'Your features are typical and neither particularly striking nor unattractive.';
  } else {
    tierLabel = 'Below Average';
    tierDescription = 'Some features may benefit from enhancement or styling to improve overall attractiveness.';
  }

  useEffect(() => {
    if (testScores && userInfo) {
      const heightPhysicalScore = calculateHeightPhysicalScore(userInfo.height, userInfo.gender);
      const weightPhysicalScore = calculateWeightPhysicalScore(userInfo.height, userInfo.weight, userInfo.gender);
      const allScores = {
        ...testScores,
        'Height': heightPhysicalScore,
        'Weight': weightPhysicalScore
      };
      const names = [];
      for (let i = 0; i < 3; i++) {
        names.push(generateRatingName(allScores, userInfo.gender));
      }
      setLoadingNames(names);

      let index = 0;
      const interval = setInterval(() => {
        setCurrentNameIndex(index);
        index = (index + 1) % names.length;
      }, 800);

      const timer = setTimeout(() => {
        clearInterval(interval);
        setRatingName(names[0]);
        setIsLoadingNames(false);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [testScores, userInfo]);

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

  const calculateRating = (userData, featureWeights, physicalWeights) => {
    if (!userData) return overallRating;

    const { height, weight, gender, eyeColor, testScores } = userData;
    let carnalTilt, cheekbone, chin, facialThirds, interocular, jawline, nose;

    if (testScores) {
      carnalTilt = testScores['Carnal Tilt'] || 0;
      facialThirds = testScores['Facial Thirds'] || 0;
      cheekbone = testScores['Cheekbone Location'] || 0;
      interocular = testScores['Interocular Distance'] || 0;
      jawline = testScores['Jawline'] || 0;
      chin = testScores['Chin'] || 0;
      nose = testScores['Nose'] || 0;
    } else {
      carnalTilt = userData.carnalTilt || 0;
      cheekbone = userData.cheekbone || 0;
      chin = userData.chin || 0;
      facialThirds = userData.facialThirds || 0;
      interocular = userData.interocular || 0;
      jawline = userData.jawline || 0;
      nose = userData.nose || 0;
    }

    const totalWeight = Object.values(featureWeights).reduce((sum, w) => sum + w, 0);
    const faceRating = totalWeight > 0
      ? (carnalTilt * featureWeights['Carnal Tilt'] +
         facialThirds * featureWeights['Facial Thirds'] +
         cheekbone * featureWeights['Cheekbone Location'] +
         interocular * featureWeights['Interocular Distance'] +
         jawline * featureWeights['Jawline'] +
         chin * featureWeights['Chin'] +
         nose * featureWeights['Nose']) / totalWeight
      : 0;

    let eyeColorScore;
    switch (eyeColor.toLowerCase()) {
      case 'blue':
      case 'green':
        eyeColorScore = 10;
        break;
      case 'brown':
        eyeColorScore = 0;
        break;
      default:
        eyeColorScore = -5;
    }

    let heightScore;
    if (gender === 'M') {
      if (height <= 66) heightScore = 5;
      else if (height <= 72) heightScore = 5 + ((height - 66) / 6) * 15;
      else heightScore = Math.min(30, 20 + ((height - 72) / 6) * 10);
    } else if (gender === 'W') {
      if (height <= 60) heightScore = 5;
      else if (height <= 66) heightScore = 5 + ((height - 60) / 6) * 15;
      else heightScore = Math.max(5, 20 - ((height - 66) / 6) * 5);
    }

    let weightScore;
    if (gender === 'M') {
      const idealWeight = (height - 60) * 7 + 110;
      const deviation = Math.abs(weight - idealWeight);
      weightScore = Math.max(0, 20 - 0.5 * deviation);
    } else if (gender === 'W') {
      const idealWeight = 100 + 5 * (height - 60);
      const deviation = Math.abs(weight - idealWeight);
      weightScore = Math.max(0, 20 - 0.4 * deviation);
    }

    const bonus = (gender === 'M' && height > 72 && (eyeColor === 'blue' || eyeColor === 'green')) ? 5 : 0;
    const faceRatingWeight = gender === 'W' ? 0.7 : 0.65;
    const weightedEyeColorScore = eyeColorScore * (physicalWeights.eyeColor / 10);
    const weightedHeightScore = heightScore * (physicalWeights.height / 20);
    const weightedWeightScore = weightScore * (physicalWeights.weight / 20);
    const rawScore = (faceRatingWeight * faceRating) + weightedEyeColorScore + weightedHeightScore + weightedWeightScore + bonus;
    const finalRating = 100 / (1 + Math.exp(-0.1 * (rawScore - 50)));

    return Math.min(Math.max(finalRating, 15.69), 99);
  };

  const handleAttributesChange = (newAttributes) => {
    const updatedUserInfo = { ...userInfo, ...newAttributes };
    setAdjustedUserInfo(updatedUserInfo);
    const newRating = calculateRating(updatedUserInfo, adjustedWeights, adjustedPhysicalWeights);
    setAdjustedRating(newRating);
  };

  const handleWeightsChange = (newWeights, newPhysicalWeights) => {
    setAdjustedWeights(newWeights);
    setAdjustedPhysicalWeights(newPhysicalWeights);
    const newRating = calculateRating(adjustedUserInfo, newWeights, newPhysicalWeights);
    setAdjustedRating(newRating);
  };

  if (!testScores) {
    return (
      <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight="bold">Your Attractiveness Rating</Typography>
        <MuiBox display="flex" justifyContent="center" mb={4}>
          <ResultDisplay rating={overallRating} tierLabel={tierLabel} faceRating={faceRating} />
        </MuiBox>
        <Typography variant="body1" color="textSecondary" align="center">*Note: This is an experimental estimation based on facial features and not a definitive measure of attractiveness.*</Typography>
      </MuiBox>
    );
  }

  const sortedFeatures = Object.entries(testScores)
    .sort(([, a], [, b]) => b - a)
    .map(([test, score]) => ({
      test,
      score,
      impact: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement'
    }));

  return (
    <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" fontWeight="bold">Your Attractiveness Rating</Typography>
      <MuiBox display="flex" justifyContent="center" mb={4}>
        <ResultDisplay rating={adjustedRating} tierLabel={tierLabel} faceRating={faceRating} />
      </MuiBox>
      <MuiBox sx={{ textAlign: 'center', mb: 4 }}>
        {isLoadingNames ? (
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease-in-out', '@keyframes fadeIn': { '0%': { opacity: 0 }, '100%': { opacity: 1 } } }}>
            <CircularProgress size={24} sx={{ mb: 2, color: 'primary.main' }} />
            <Typography variant="h5" color="primary" fontWeight="bold" sx={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease-in-out' }}>
              {loadingNames[currentNameIndex] || 'Generating your rating name...'}
            </Typography>
          </MuiBox>
        ) : (
          <MuiBox sx={{ animation: 'slideIn 0.5s ease-out', '@keyframes slideIn': { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } } }}>
            <Typography variant="h5" color="primary" fontWeight="bold" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0px 2px 4px rgba(0,0,0,0.1)', p: 2, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
              {ratingName}
            </Typography>
          </MuiBox>
        )}
      </MuiBox>
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">Key Features Analysis</Typography>
        <Stack spacing={3}>
          {sortedFeatures.map(({ test, score, impact }, index) => {
            const color = impact === 'Excellent' ? '#4CAF50' : impact === 'Good' ? '#8BC34A' : impact === 'Average' ? '#FFC107' : '#FF5722';
            return (
              <MuiBox key={test} sx={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s both`, '@keyframes slideIn': { '0%': { transform: 'translateX(-20px)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } }, p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: `1px solid ${color}20` }}>
                <MuiBox display="flex" alignItems="center" mb={1}>
                  <Typography variant="h4" mr={2}>{featureIcons[test]}</Typography>
                  <MuiBox flex={1}>
                    <Typography variant="body1" fontWeight="medium">{test}</Typography>
                    <Typography variant="body2" color="textSecondary">{featureDescriptions[test]}</Typography>
                  </MuiBox>
                  <Typography variant="body1" color={color} fontWeight="bold" sx={{ bgcolor: `${color}20`, px: 1.5, py: 0.5, borderRadius: 1 }}>{impact}</Typography>
                </MuiBox>
                <MuiBox sx={{ position: 'relative', mt: 1 }}>
                  <LinearProgress variant="determinate" value={score} sx={{ height: 8, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3, transition: 'width 1s ease-in-out' } }} />
                  <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'medium' }}>Low Attractiveness</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'medium' }}>High Attractiveness</Typography>
                  </MuiBox>
                </MuiBox>
              </MuiBox>
            );
          })}
        </Stack>
      </MuiBox>
      <PhysicalAttributesAdjuster userInfo={userInfo} onAttributesChange={handleAttributesChange} />
      <WeightAdjuster weights={weights} onWeightsChange={handleWeightsChange} />
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">What This Means</Typography>
        <MuiBox sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.1)' }}>
          <Typography variant="body1" paragraph>{tierDescription}</Typography>
          <Typography variant="body1" paragraph>This analysis evaluates specific facial features against conventional standards of attractiveness. The overall rating is calculated as a weighted average of the following feature scores:</Typography>
          <ul>
            {Object.entries(featureDescriptions).map(([test, description]) => (
              <li key={test}><Typography variant="body1"><strong>{test}:</strong> {description} (Weight: {adjustedWeights[test]})</Typography></li>
            ))}
          </ul>
          <Typography variant="body1" paragraph mt={2}>Physical attributes also contribute to the overall rating:</Typography>
          <ul>
            <li><Typography variant="body1"><strong>Eye Color:</strong> Blue and green eyes receive a bonus (Weight: {adjustedPhysicalWeights.eyeColor})</Typography></li>
            <li><Typography variant="body1"><strong>Height:</strong> Optimal height ranges vary by gender (Weight: {adjustedPhysicalWeights.height})</Typography></li>
            <li><Typography variant="body1"><strong>Weight:</strong> Ideal weight is calculated based on height and gender (Weight: {adjustedPhysicalWeights.weight})</Typography></li>
          </ul>
          <Typography variant="body1" color="textSecondary" mt={2}>*Note: This is an experimental estimation based on facial features and not a definitive measure of attractiveness. Beauty is subjective and multifaceted.*</Typography>
        </MuiBox>
      </MuiBox>
      <MuiBox mt={4} display="flex" justifyContent="center">
        <MuiButton variant="contained" color="primary" onClick={() => navigate('/')} sx={{ animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)' } }, px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem' }}>Back to Home</MuiButton>
      </MuiBox>
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
        const physicalAttributes = {
          name: userData.name || 'Self',
          ethnicity: userData.ethnicity,
          eyeColor: mapEyeColor(userData.eyeColor),
          height: userData.height,
          weight: userData.weight,
          gender: getGenderCode(userData.gender),
        };
        setUserInfo(physicalAttributes);
        setCurrentStep('instructions');
      } else {
        setCurrentStep('scanForSelection');
      }
    }
  }, [loadingUser, userData]);

  useEffect(() => {
    if (scanFor === 'myself' && !loadingUser && userData && cappedRating !== null && !updated && userData.timesRanked === 0) {
      const updateUserRating = async () => {
        const userDocRef = doc(db, 'users', userData.id);
        const dividedRating = cappedRating / 10;
        try {
          await setDoc(userDocRef, { ranking: dividedRating, timesRanked: 1 }, { merge: true });
          setUpdated(true);
          console.log('User document updated:', { ranking: dividedRating, timesRanked: 1 });
        } catch (error) {
          console.error('Error updating user document:', error);
          toast({ title: 'Error', description: 'Failed to save your rating. Please try again.', status: 'error', duration: 5000, isClosable: true });
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
            timestamp: new Date(),
          };
          await addDoc(collection(db, 'faceRatings'), ratingData);
          console.log('Rating saved to Firestore:', ratingData);
        } catch (error) {
          console.error('Error saving rating to Firestore:', error);
          toast({ title: 'Error', description: 'Failed to save rating to Firestore.', status: 'error', duration: 5000, isClosable: true });
        }
      };
      saveRatingToFirestore();
    }
  }, [currentStep, userInfo, cappedRating, user, toast]);

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
      toast({ title: 'Error', description: 'Face not detected. Please adjust your position.', status: 'warning', duration: 3000 });
    }
  };

  const handleScanningComplete = (result) => {
    if (result !== null) {
      const { finalScore, testAverages, measurements } = result;
      const transformedTestScores = {};
      for (const [test, score] of Object.entries(testAverages)) {
        const propName = testToPropMap[test];
        if (propName) transformedTestScores[propName] = score;
      }

      const faceRating = Object.values(testAverages).reduce((sum, score) => sum + score, 0) / Object.keys(testAverages).length;

      console.log('=== Face Measurements Summary ===');
      console.log('Carnal Tilt:', { leftEyeCenter: measurements?.leftEyeCenter, rightEyeCenter: measurements?.rightEyeCenter, angleInDegrees: measurements?.carnalTiltAngle });
      console.log('Facial Thirds:', { upperThirdLength: measurements?.upperThirdLength, lowerThirdLength: measurements?.lowerThirdLength, actualRatio: measurements?.facialThirdsRatio, idealRatio: gender === 'W' ? 1.2 : 1.0 });
      console.log('Cheekbones:', { leftCheekHeight: measurements?.leftCheekHeight, rightCheekHeight: measurements?.rightCheekHeight, heightDifference: measurements?.cheekHeightDiff });
      console.log('Interocular Distance:', { eyeDistance: measurements?.eyeDistance, faceWidth: measurements?.faceWidth, actualRatio: measurements?.interocularRatio, idealRatio: gender === 'W' ? 0.47 : 0.45 });
      console.log('Jawline:', { jawWidth: measurements?.jawWidth, faceWidth: measurements?.faceWidth, actualRatio: measurements?.jawRatio, idealRatio: gender === 'W' ? 0.7 : 0.8 });
      console.log('Chin:', { chinLength: measurements?.chinLength, faceHeight: measurements?.faceHeight, actualRatio: measurements?.chinRatio, idealRatio: gender === 'W' ? 0.3 : 0.33 });
      console.log('Nose:', { noseWidth: measurements?.noseWidth, faceWidth: measurements?.faceWidth, actualRatio: measurements?.noseRatio, idealRatio: gender === 'W' ? 0.23 : 0.25 });
      console.log('=== End Measurements Summary ===');

      if (scanFor === 'myself') {
        setUserInfo((prev) => ({ ...prev, ...transformedTestScores, testScores: testAverages, faceRating }));
        setCurrentStep('result');
      } else {
        setFaceScore(finalScore + 7);
        setTestScores(testAverages);
        setCurrentStep('form');
      }
    } else {
      toast({ title: 'Error', description: 'No face detected during scan. Please try again.', status: 'error', duration: 3000 });
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
      if (propName) transformedTestScores[propName] = score;
    }
    const faceRating = Object.values(testScores).reduce((sum, score) => sum + score, 0) / Object.keys(testScores).length;
    const physicalAttributes = { name: info.name, ethnicity: info.ethnicity, eyeColor: info.eyeColor, height: info.height, weight: info.weight, gender };
    const updatedUserInfo = { ...physicalAttributes, ...transformedTestScores, testScores, faceRating };
    setUserInfo(updatedUserInfo);
    console.log('Form submitted, userInfo:', updatedUserInfo);
    setCurrentStep('result');
  };

  const genderMap = { 'Male': 'M', 'Female': 'W', 'Non-binary': 'M', 'Other': 'W', 'Prefer not to say': 'M' };

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }} bg="gray.50">
      <VStack spacing={6} align="stretch">
        {currentStep === 'scanForSelection' && (
          <VStack spacing={4} align="center">
            <Heading size="lg">Who are you scanning for?</Heading>
            <Button style={{ backgroundColor: 'black', color: 'white', width: '30%' }} onClick={() => handleScanForSelection('myself')}>For Myself</Button>
            <Button style={{ backgroundColor: 'black', color: 'white', width: '30%' }} onClick={() => handleScanForSelection('someoneElse')}>For Someone Else</Button>
          </VStack>
        )}
        {currentStep === 'genderSelection' && scanFor === 'someoneElse' && (
          <VStack spacing={4} align="center">
            <Heading size="lg">Select Gender for Someone Else</Heading>
            <MuiFormControl>
              <MuiFormLabel>Pick One</MuiFormLabel>
              <MuiSelect value={gender} onChange={(e) => handleGenderSelection(e.target.value)} displayEmpty fullWidth>
                <MenuItem value="" disabled>Choose here</MenuItem>
                {Object.keys(genderMap).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </MuiSelect>
            </MuiFormControl>
          </VStack>
        )}
        {(currentStep === 'instructions' || currentStep === 'scanning') && (
          <Box w={{ base: '100%', md: '640px' }} h="480px" mx="auto" borderWidth="2px" borderColor="gray.100" borderRadius="xl" overflow="hidden" boxShadow="lg" bg="gray.200">
            <FaceScanner startScanning={currentStep === 'scanning'} onScanningComplete={handleScanningComplete} onFaceDetected={handleFaceDetected} gender={userInfo?.gender || gender} />
          </Box>
        )}
        {currentStep === 'instructions' && (
          <VStack spacing={4} align="center">
            <Heading size="lg">Let's Scan the Face!</Heading>
            <Text fontSize="lg" textAlign="center">Put the face in front of the camera. Make sure there is good lighting and keep the face straight. Results can vary slightly if not. The scan starts when we see the face!</Text>
            <Button colorScheme="teal" size="lg" onClick={handleStartScanning} isDisabled={!faceDetected}>Start Scanning</Button>
          </VStack>
        )}
        {currentStep === 'form' && scanFor === 'someoneElse' && (
          <VStack spacing={6} align="stretch">
            <Heading size="lg">Tell Us About Them</Heading>
            <UserInfoForm onSubmit={handleFormSubmit} gender={gender} />
          </VStack>
        )}
        {currentStep === 'result' && cappedRating !== null && (
          <VStack spacing={4} align="center">
            <Heading size="lg">Here's the Score!</Heading>
            <DetailedResultDisplay overallRating={cappedRating} faceRating={userInfo.faceRating} testScores={userInfo.testScores} userInfo={userInfo} />
          </VStack>
        )}
      </VStack>
    </Container>
  );
};

// Scoring Helper Functions
const runTest = (test, landmarks, boundingBox, params, gender) => {
  switch (test) {
    case 'Carnal Tilt': return calculateTiltScore(landmarks, params['Carnal Tilt'], gender);
    case 'Facial Thirds': return calculateFacialThirdsScore(landmarks, params['Facial Thirds'], gender);
    case 'Cheekbone Location': return calculateCheekboneScore(landmarks, params['Cheekbone Location'], gender);
    case 'Interocular Distance': return calculateInterocularDistanceScore(landmarks, boundingBox, params['Interocular Distance'], gender);
    case 'Jawline': return calculateJawlineScore(landmarks, boundingBox, params['Jawline'], gender);
    case 'Chin': return calculateChinScore(landmarks, params['Chin'], gender);
    case 'Nose': return calculateNoseScore(landmarks, boundingBox, params['Nose'], gender);
    default: return 0;
  }
};

const calculateTiltScore = (landmarks, multiplier, gender) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const dy = rightEyeCenter[1] - leftEyeCenter[1];
  const dx = rightEyeCenter[0] - leftEyeCenter[0];
  const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  console.log('Face Measurements - Carnal Tilt:', { leftEyeCenter, rightEyeCenter, angleInDegrees: angle });
  const adjustedMultiplier = gender === 'W' ? multiplier * 0.8 : multiplier;
  return Math.max(0, 100 - angle * adjustedMultiplier);
};

const calculateFacialThirdsScore = (landmarks, multiplier, gender) => {
  const forehead = landmarks[10][1];
  const noseBase = landmarks[1][1];
  const chin = landmarks[152][1];
  const third1 = noseBase - forehead;
  const third2 = chin - noseBase;
  const idealRatio = gender === 'M' ? 1.0 : 1.2;
  const ratio = third1 / third2;
  console.log('Face Measurements - Facial Thirds:', { upperThirdLength: third1, lowerThirdLength: third2, actualRatio: ratio, idealRatio });
  const deviation = Math.abs(1 - ratio / idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateCheekboneScore = (landmarks, multiplier, gender) => {
  const cheekLeft = landmarks[116][1];
  const cheekRight = landmarks[345][1];
  const diff = Math.abs(cheekLeft - cheekRight);
  const forehead = landmarks[10][1];
  const chin = landmarks[152][1];
  const faceHeight = chin - forehead;
  const normalized_diff = faceHeight > 0 ? diff / faceHeight : 0;
  return 100 * Math.exp(-multiplier * normalized_diff);
};

const calculateInterocularDistanceScore = (landmarks, boundingBox, multiplier, gender) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const distance = Math.sqrt((rightEyeCenter[0] - leftEyeCenter[0]) ** 2 + (rightEyeCenter[1] - leftEyeCenter[1]) ** 2);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = distance / faceWidth;
  const idealRatio = gender === 'M' ? 0.45 : 0.47;
  console.log('Face Measurements - Interocular Distance:', { eyeDistance: distance, faceWidth, actualRatio: ratio, idealRatio });
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateJawlineScore = (landmarks, boundingBox, multiplier, gender) => {
  const jawWidth = Math.abs(landmarks[123][0] - landmarks[352][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = jawWidth / faceWidth;
  const idealRatio = gender === 'M' ? 0.8 : 0.7;
  console.log('Face Measurements - Jawline:', { jawWidth, faceWidth, actualRatio: ratio, idealRatio });
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateChinScore = (landmarks, multiplier, gender) => {
  const noseTip = landmarks[1][1];
  const chin = landmarks[152][1];
  const mouth = landmarks[17][1];
  const chinLength = chin - mouth;
  const faceHeight = chin - noseTip;
  const ratio = chinLength / faceHeight;
  const idealRatio = gender === 'M' ? 0.33 : 0.3;
  console.log('Face Measurements - Chin:', { chinLength, faceHeight, actualRatio: ratio, idealRatio });
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateNoseScore = (landmarks, boundingBox, multiplier, gender) => {
  const noseWidth = Math.abs(landmarks[129][0] - landmarks[358][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = noseWidth / faceWidth;
  const idealRatio = gender === 'M' ? 0.25 : 0.23;
  console.log('Face Measurements - Nose:', { noseWidth, faceWidth, actualRatio: ratio, idealRatio });
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export default AttractivenessRatingProcess;