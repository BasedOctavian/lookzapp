import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import {
  Container,
  Box,
  Button,
  Text,
  VStack,
  Heading,
} from '@chakra-ui/react';
import { useAttractivenessRating } from '../hooks/faceRating/useAttractivenessRating'; // Adjust path as needed
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
} from '@mui/material';

// Define tests and weights
const tests = [
  'Cardinal Tilt',
  'Facial Thirds',
  'Cheekbone Location',
  'Interocular Distance',
  'Undereyes',
  'Jawline',
  'Chin',
  'Nose',
  'Overall',
];

const weights = {
  'Cardinal Tilt': 3.3,
  'Facial Thirds': 1.3,
  'Cheekbone Location': 0.4,
  'Interocular Distance': 1,
  'Undereyes': 0,
  'Jawline': 0,
  'Chin': 0,
  'Nose': 0,
};

const testParams = {
  'Cardinal Tilt': 10,
  'Facial Thirds': 100,
  'Cheekbone Location': 0.5,
  'Interocular Distance': 200,
  'Undereyes': 50,
  'Jawline': 200,
  'Chin': 300,
  'Nose': 400,
};

// FaceScanner Component
const FaceScanner = ({ startScanning, onScanningComplete, onFaceDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const scoresRef = useRef([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [score, setScore] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        ]);
        if (isMounted) setModelsLoaded(true);
      } catch (err) {
        if (isMounted) setWebcamError('Failed to load face detection models');
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            if (isMounted) setVideoReady(true);
          });
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        if (isMounted) setWebcamError('Webcam access denied or unavailable');
      }
    };

    loadModels().then(startVideo);
    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const detectFaceAndRunTest = async () => {
      if (!videoRef.current || !canvasRef.current || !videoReady) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        setFaceDetected(true);
        onFaceDetected(true);
        const landmarks = detection.landmarks;
        const videoTestScores = {};
        tests.forEach((test) => {
          if (test !== 'Overall') {
            videoTestScores[test] = runTest(test, landmarks, testParams);
          }
        });
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        const currentScore =
          totalWeight > 0
            ? Object.entries(videoTestScores).reduce(
                (sum, [test, score]) => sum + score * weights[test],
                0
              ) / totalWeight
            : 0;
        setScore(currentScore);
        if (isCollecting) scoresRef.current.push(currentScore);

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetection);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setScore(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 500);
    return () => clearInterval(intervalRef.current);
  }, [videoReady, isCollecting, onFaceDetected]);

  useEffect(() => {
    if (startScanning && !isCollecting) {
      setIsCollecting(true);
      setCountdown(5);
      scoresRef.current = [];
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 5 - Math.floor(elapsed / 1000));
        setCountdown(remaining);
      }, 1000);
      const timer = setTimeout(() => {
        clearInterval(interval);
        setIsCollecting(false);
        setCountdown(null);
        if (scoresRef.current.length > 0) {
          const sortedScores = [...scoresRef.current].sort((a, b) => a - b);
          const n = sortedScores.length;
          const k = Math.ceil(n / 4);
          const lowerQuartileScores = sortedScores.slice(0, k);
          const average = lowerQuartileScores.reduce((sum, val) => sum + val, 0) / k;
          onScanningComplete(average);
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
    <Box position="relative" w="100%" h="100%">
      {!modelsLoaded && !webcamError && (
        <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" fontSize="lg">
          Loading models...
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
      {countdown !== null && (
        <Text
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          color="white"
          fontSize="2xl"
          fontWeight="bold"
          bg="rgba(0,0,0,0.5)"
          px={4}
          py={2}
          borderRadius="md"
        >
          Scanning: {countdown}
        </Text>
      )}
    </Box>
  );
};

// UserInfoForm Component with Material-UI
const UserInfoForm = ({ onSubmit }) => {
  const [unitSystem, setUnitSystem] = useState('imperial');
  const [ethnicity, setEthnicity] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [gender, setGender] = useState('');
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

  const genderMap = {
    'Male': 'M',
    'Female': 'W',
    'Non-binary': 'M', // Default mapping; adjust hook if needed
    'Other': 'W',      // Default mapping; adjust hook if needed
    'Prefer not to say': 'M',
  };

  // Clear inputs when unit system changes
  useEffect(() => {
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
  }, [unitSystem]);

  const handleSubmit = () => {
    // Check required fields
    if (!ethnicity || !eyeColor || !gender) {
      setSnackbar({ open: true, message: 'All fields are required', severity: 'error' });
      return;
    }

    if (unitSystem === 'imperial') {
      if (!heightFeet || !heightInches || !weightValue) {
        setSnackbar({ open: true, message: 'Height and weight are required', severity: 'error' });
        return;
      }
    } else {
      if (!heightCm || !weightValue) {
        setSnackbar({ open: true, message: 'Height and weight are required', severity: 'error' });
        return;
      }
    }

    let totalHeightInches;
    let totalWeightPounds;

    // Convert height and weight based on unit system
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

    // Submit data with height in inches and weight in pounds
    onSubmit({
      ethnicity: ethnicityMap[ethnicity],
      eyeColor: eyeColorMap[eyeColor],
      height: totalHeightInches,
      weight: totalWeightPounds,
      gender: genderMap[gender],
    });
  };

  return (
    <>
      <Stack direction="column" spacing={2} alignItems="stretch">
        <MuiFormControl>
          <MuiFormLabel>Unit System</MuiFormLabel>
          <MuiSelect
            value={unitSystem}
            onChange={(e) => setUnitSystem(e.target.value)}
            fullWidth
          >
            <MenuItem value="imperial">Imperial (feet, inches, pounds)</MenuItem>
            <MenuItem value="metric">Metric (cm, kg)</MenuItem>
          </MuiSelect>
        </MuiFormControl>
        <MuiFormControl>
          <MuiFormLabel>Ethnicity</MuiFormLabel>
          <MuiSelect
            value={ethnicity}
            onChange={(e) => setEthnicity(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select ethnicity</MenuItem>
            {Object.keys(ethnicityMap).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </MuiSelect>
        </MuiFormControl>
        <MuiFormControl>
          <MuiFormLabel>Eye Color</MuiFormLabel>
          <MuiSelect
            value={eyeColor}
            onChange={(e) => setEyeColor(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select eye color</MenuItem>
            {Object.keys(eyeColorMap).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </MuiSelect>
        </MuiFormControl>
        {unitSystem === 'imperial' ? (
          <>
            <MuiFormControl>
              <MuiFormLabel>Height (feet)</MuiFormLabel>
              <TextField
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                fullWidth
              />
            </MuiFormControl>
            <MuiFormControl>
              <MuiFormLabel>Height (inches)</MuiFormLabel>
              <TextField
                type="number"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                fullWidth
              />
            </MuiFormControl>
          </>
        ) : (
          <MuiFormControl>
            <MuiFormLabel>Height (cm)</MuiFormLabel>
            <TextField
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              fullWidth
            />
          </MuiFormControl>
        )}
        <MuiFormControl>
          <MuiFormLabel>Weight ({unitSystem === 'imperial' ? 'pounds' : 'kg'})</MuiFormLabel>
          <TextField
            type="number"
            value={weightValue}
            onChange={(e) => setWeightValue(e.target.value)}
            fullWidth
          />
        </MuiFormControl>
        <MuiFormControl>
          <MuiFormLabel>Gender</MuiFormLabel>
          <MuiSelect
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select gender</MenuItem>
            {Object.keys(genderMap).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </MuiSelect>
        </MuiFormControl>
        <MuiButton variant="contained" color="primary" onClick={handleSubmit}>
          Submit
        </MuiButton>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// ResultDisplay Component
const ResultDisplay = ({ rating }) => {
  return (
    <MuiBox position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={rating} size={100} thickness={4} />
      <MuiBox
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h5" component="div" color="textSecondary">
          {rating.toFixed(2)}
        </Typography>
      </MuiBox>
    </MuiBox>
  );
};

// Main Component
const AttractivenessRatingProcess = () => {
  const [currentStep, setCurrentStep] = useState('instructions');
  const [faceScore, setFaceScore] = useState(null);
  const [doc, setDoc] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const { rating } = useAttractivenessRating(doc);
  const toast = useToast();

  const handleStartScanning = () => {
    setCurrentStep('scanning');
  };

  const handleScanningComplete = (score) => {
    if (score !== null) {
      setFaceScore(score);
      setCurrentStep('form');
    } else {
      toast({ title: 'Error', description: 'No face detected during scan. Please try again.', status: 'error', duration: 3000 });
      setCurrentStep('instructions');
    }
  };

  const handleFaceDetected = (detected) => {
    setFaceDetected(detected);
  };

  const handleFormSubmit = (info) => {
    setDoc({
      faceRating: faceScore,
      ethnicity: info.ethnicity,
      eyeColor: info.eyeColor,
      height: info.height,
      weight: info.weight,
      gender: info.gender,
    });
    setCurrentStep('result');
  };

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }} bg="gray.50">
      <VStack spacing={6} align="stretch">
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
            />
          </Box>
        )}
        {currentStep === 'instructions' && (
          <VStack spacing={4} align="center">
            <Heading size="lg">Face Scan</Heading>
            <Text fontSize="lg" textAlign="center">
              Please position your face in front of the camera. The scan will begin once a face is detected.
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
        {currentStep === 'form' && (
          <VStack spacing={6} align="stretch">
            <Heading size="lg">Tell Us About Yourself</Heading>
            <UserInfoForm onSubmit={handleFormSubmit} />
          </VStack>
        )}
        {currentStep === 'result' && rating !== null && (
          <VStack spacing={4} align="center">
            <Heading size="lg">Your Attractiveness Rating</Heading>
            <ResultDisplay rating={rating} />
          </VStack>
        )}
      </VStack>
    </Container>
  );
};

// Helper Functions
const getCenter = (points) => {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
};

const runTest = (test, landmarks, params) => {
  switch (test) {
    case 'Cardinal Tilt': return calculateTiltScore(landmarks, params['Cardinal Tilt']);
    case 'Facial Thirds': return calculateFacialThirdsScore(landmarks, params['Facial Thirds']);
    case 'Cheekbone Location': return calculateCheekboneScore(landmarks, params['Cheekbone Location']);
    case 'Interocular Distance': return calculateInterocularDistanceScore(landmarks, params['Interocular Distance']);
    case 'Undereyes': return calculateUndereyesScore(landmarks, params['Undereyes']);
    case 'Jawline': return calculateJawlineScore(landmarks, params['Jawline']);
    case 'Chin': return calculateChinScore(landmarks, params['Chin']);
    case 'Nose': return calculateNoseScore(landmarks, params['Nose']);
    default: return 0;
  }
};

// Score Calculation Functions
const calculateTiltScore = (landmarks, multiplier) => {
  const leftEye = getCenter(landmarks.getLeftEye());
  const rightEye = getCenter(landmarks.getRightEye());
  const dy = rightEye.y - leftEye.y;
  const dx = rightEye.x - leftEye.x;
  const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  return Math.max(0, 100 - angle * multiplier);
};

const calculateFacialThirdsScore = (landmarks, multiplier) => {
  const forehead = landmarks.positions[19].y;
  const noseBase = landmarks.positions[33].y;
  const chin = landmarks.positions[8].y;
  const third1 = noseBase - forehead;
  const third2 = chin - noseBase;
  const idealRatio = third1 / third2;
  const deviation = Math.abs(1 - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateCheekboneScore = (landmarks, multiplier) => {
  const cheekLeft = landmarks.positions[1].y;
  const cheekRight = landmarks.positions[15].y;
  const diff = Math.abs(cheekLeft - cheekRight);
  return Math.max(0, 100 - diff * multiplier);
};

const calculateInterocularDistanceScore = (landmarks, multiplier) => {
  const leftEye = getCenter(landmarks.getLeftEye());
  const rightEye = getCenter(landmarks.getRightEye());
  const distance = Math.sqrt((rightEye.x - leftEye.x) ** 2 + (rightEye.y - leftEye.y) ** 2);
  const faceWidth = landmarks.positions[16].x - landmarks.positions[0].x;
  const ratio = distance / faceWidth;
  const idealRatio = 0.45;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateUndereyesScore = (landmarks, value) => value;

const calculateJawlineScore = (landmarks, multiplier) => {
  const jawWidth = landmarks.positions[15].x - landmarks.positions[1].x;
  const faceWidth = landmarks.positions[16].x - landmarks.positions[0].x;
  const ratio = jawWidth / faceWidth;
  const idealRatio = 0.8;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateChinScore = (landmarks, multiplier) => {
  const noseTip = landmarks.positions[33].y;
  const chin = landmarks.positions[8].y;
  const mouth = landmarks.positions[57].y;
  const chinLength = chin - mouth;
  const faceHeight = chin - noseTip;
  const ratio = chinLength / faceHeight;
  const idealRatio = 0.33;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateNoseScore = (landmarks, multiplier) => {
  const noseWidth = landmarks.positions[35].x - landmarks.positions[31].x;
  const faceWidth = landmarks.positions[16].x - landmarks.positions[0].x;
  const ratio = noseWidth / faceWidth;
  const idealRatio = 0.25;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export default AttractivenessRatingProcess;