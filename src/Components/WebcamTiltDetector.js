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
  LinearProgress,
  Slider,
} from '@mui/material';
import { maleConfig } from '../hooks/faceRating/maleConfig';
import { femaleConfig } from '../hooks/faceRating/femaleConfig';

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
  const toast = useToast();

  const config = gender === 'M' ? maleConfig : femaleConfig;

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
                if (isMounted) setWebcamError('Failed to play video');
              });
            }
          };
        }
      } catch (err) {
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
        setFaceDetected(true);
        onFaceDetected(true);
        setFaceDetectedTime(prev => prev + 0.5);

        const face = predictions[0];
        const landmarks = face.scaledMesh;
        const boundingBox = face.boundingBox;

        landmarks.forEach(([x, y]) => {
          context.beginPath();
          context.arc(x, y, 1, 0, 2 * Math.PI);
          context.fillStyle = 'rgba(0, 255, 255, 0.5)';
          context.fill();
        });

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

    intervalRef.current = setInterval(detectFaceAndRunTest, 500);
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
    const savedData = JSON.parse(localStorage.getItem('userInfoForm'));
    if (savedData) {
      setUnitSystem(savedData.unitSystem || 'imperial');
      setName(savedData.name || '');
      setEthnicity(savedData.ethnicity || '');
      setEyeColor(savedData.eyeColor || '');
      setHeightFeet(savedData.heightFeet || '');
      setHeightInches(savedData.heightInches || '');
      setHeightCm(savedData.heightCm || '');
      setWeightValue(savedData.weightValue || '');
    }
  }, []);

  useEffect(() => {
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
  }, [unitSystem]);

  const handleSubmit = () => {
    if (!name || !ethnicity || !eyeColor) {
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

    const savedData = {
      unitSystem,
      name,
      ethnicity,
      eyeColor,
      heightFeet,
      heightInches,
      heightCm,
      weightValue,
    };
    localStorage.setItem('userInfoForm', JSON.stringify(savedData));

    onSubmit({
      name,
      ethnicity: ethnicityMap[ethnicity],
      eyeColor: eyeColorMap[eyeColor],
      height: totalHeightInches,
      weight: totalWeightPounds,
      gender: gender,
    });
  };

  const handleRevert = () => {
    localStorage.removeItem('userInfoForm');
    setUnitSystem('imperial');
    setName('');
    setEthnicity('');
    setEyeColor('');
    setHeightFeet('');
    setHeightInches('');
    setHeightCm('');
    setWeightValue('');
  };

  return (
    <>
      <Stack direction="column" spacing={2} alignItems="stretch">
        <MuiFormControl>
          <MuiFormLabel>Name</MuiFormLabel>
          <TextField value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        </MuiFormControl>
        <MuiFormControl>
          <MuiFormLabel>Unit System</MuiFormLabel>
          <MuiSelect value={unitSystem} onChange={(e) => setUnitSystem(e.target.value)} fullWidth>
            <MenuItem value="imperial">Imperial</MenuItem>
            <MenuItem value="metric">Metric</MenuItem>
          </MuiSelect>
        </MuiFormControl>
        <MuiFormControl>
          <MuiFormLabel>Ethnicity</MuiFormLabel>
          <MuiSelect value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} displayEmpty fullWidth>
            <MenuItem value="" disabled>Select ethnicity</MenuItem>
            {Object.keys(ethnicityMap).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </MuiSelect>
        </MuiFormControl>
        <MuiFormControl>
          <MuiFormLabel>Eye Color</MuiFormLabel>
          <MuiSelect value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} displayEmpty fullWidth>
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
              <TextField type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} fullWidth />
            </MuiFormControl>
            <MuiFormControl>
              <MuiFormLabel>Height (inches)</MuiFormLabel>
              <TextField type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} fullWidth />
            </MuiFormControl>
          </>
        ) : (
          <MuiFormControl>
            <MuiFormLabel>Height (cm)</MuiFormLabel>
            <TextField type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} fullWidth />
          </MuiFormControl>
        )}
        <MuiFormControl>
          <MuiFormLabel>Weight ({unitSystem === 'imperial' ? 'pounds' : 'kg'})</MuiFormLabel>
          <TextField type="number" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} fullWidth />
        </MuiFormControl>
        <Stack direction="row" spacing={2} justifyContent="center">
          <MuiButton variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </MuiButton>
          <MuiButton variant="contained" color="secondary" onClick={handleRevert}>
            Revert
          </MuiButton>
        </Stack>
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

// DetailedResultDisplay Component with Sliders
const DetailedResultDisplay = ({ overallRating, faceRating, testScores, userInfo, setUserInfo }) => {
  const navigate = useNavigate();
  const [params, setParams] = useState(userInfo.gender === 'M' ? maleConfig : femaleConfig);

  let tierLabel, tierDescription;
  if (overallRating >= 80) {
    tierLabel = 'Very Attractive';
    tierDescription = 'Your features align closely with conventional standards of attractiveness.';
  } else if (overallRating >= 60) {
    tierLabel = 'Attractive';
    tierDescription = 'Your features are generally appealing and well-proportioned.';
  } else if (overallRating >= 40) {
    tierLabel = 'Average';
    tierDescription = 'Your features are typical and neither particularly striking nor unattractive.';
  } else {
    tierLabel = 'Below Average';
    tierDescription = 'Some features may benefit from enhancement or styling to improve overall attractiveness.';
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
    if (userInfo?.measurements) {
      const measurements = userInfo.measurements;
      const newTestScores = calculateTestScores(measurements, params);
      const totalWeight = Object.values(params.weights).reduce((sum, w) => sum + w, 0);
      const newFaceRating = totalWeight > 0
        ? Object.entries(newTestScores).reduce(
            (sum, [test, score]) => sum + score * params.weights[test],
            0
          ) / totalWeight
        : 0;
      setUserInfo(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(newTestScores).map(([test, score]) => [testToPropMap[test], score])),
        testScores: newTestScores,
        faceRating: newFaceRating,
        params: params // Store adjusted parameters
      }));
    }
  }, [params, userInfo?.measurements, setUserInfo]);

  // Simplified rendering to ensure all sections are visible
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
      <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
        Your Attractiveness Rating
      </Typography>
      <MuiBox display="flex" justifyContent="center" mb={4}>
        <ResultDisplay 
          rating={overallRating} 
          tierLabel={tierLabel} 
          faceRating={faceRating} 
        />
      </MuiBox>
      {testScores && (
        <MuiBox sx={{ mt: 4, mb: 6 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
            Key Features Analysis
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
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Adjust Attributes
        </Typography>
        <Stack spacing={3}>
          <MuiFormControl>
            <MuiFormLabel>Height (inches)</MuiFormLabel>
            <TextField
              type="number"
              value={userInfo.height || ''}
              onChange={(e) => setUserInfo(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
            />
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Weight (pounds)</MuiFormLabel>
            <TextField
              type="number"
              value={userInfo.weight || ''}
              onChange={(e) => setUserInfo(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
            />
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Eye Color</MuiFormLabel>
            <MuiSelect
              value={userInfo.eyeColor || ''}
              onChange={(e) => setUserInfo(prev => ({ ...prev, eyeColor: e.target.value }))}
            >
              {eyeColorOptions.map(option => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </MuiFormControl>
          <MuiFormControl>
            <MuiFormLabel>Gender</MuiFormLabel>
            <MuiSelect
              value={userInfo.gender || ''}
              onChange={(e) => setUserInfo(prev => ({ ...prev, gender: e.target.value }))}
            >
              {genderOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </MuiFormControl>
        </Stack>
        <Typography variant="body2" color="textSecondary" mt={2}>
          *Note: Changing gender affects the overall rating but not facial feature scores.*
        </Typography>
      </MuiBox>
      {testScores && (
        <MuiBox sx={{ mt: 4, mb: 6, border: '2px solid blue' }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
            Adjust Parameters
          </Typography>
          <Stack spacing={3}>
            {tests.filter(test => test !== 'Overall').map(test => (
              <MuiBox key={test}>
                <Typography variant="h6">{test}</Typography>
                <Stack spacing={2}>
                  <MuiFormControl>
                    <MuiFormLabel>Weight</MuiFormLabel>
                    <Slider
                      value={params.weights[test]}
                      onChange={(e, value) => setParams(prev => ({
                        ...prev,
                        weights: { ...prev.weights, [test]: value }
                      }))}
                      min={0}
                      max={5}
                      step={0.1}
                      valueLabelDisplay="auto"
                    />
                  </MuiFormControl>
                  <MuiFormControl>
                    <MuiFormLabel>Param (Multiplier)</MuiFormLabel>
                    <Slider
                      value={params.params[test]}
                      onChange={(e, value) => setParams(prev => ({
                        ...prev,
                        params: { ...prev.params, [test]: value }
                      }))}
                      min={0}
                      max={500}
                      step={10}
                      valueLabelDisplay="auto"
                    />
                  </MuiFormControl>
                  {testsWithIdealRatios.has(test) && (
                    <MuiFormControl>
                      <MuiFormLabel>Ideal Ratio</MuiFormLabel>
                      <Slider
                        value={params.idealRatios[test]}
                        onChange={(e, value) => setParams(prev => ({
                          ...prev,
                          idealRatios: { ...prev.idealRatios, [test]: value }
                        }))}
                        min={0}
                        max={2}
                        step={0.01}
                        valueLabelDisplay="auto"
                      />
                    </MuiFormControl>
                  )}
                  {test === 'Carnal Tilt' && (
                    <MuiFormControl>
                      <MuiFormLabel>Multiplier Factor</MuiFormLabel>
                      <Slider
                        value={params.carnalTiltMultiplierFactor}
                        onChange={(e, value) => setParams(prev => ({
                          ...prev,
                          carnalTiltMultiplierFactor: value
                        }))}
                        min={0}
                        max={2}
                        step={0.1}
                        valueLabelDisplay="auto"
                      />
                    </MuiFormControl>
                  )}
                </Stack>
              </MuiBox>
            ))}
          </Stack>
        </MuiBox>
      )}
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          What This Means
        </Typography>
        <MuiBox
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body1" paragraph>
            {tierDescription}
          </Typography>
          <Typography variant="body1" paragraph>
            This analysis evaluates facial features against adjustable standards. The overall rating is a weighted average of feature scores, modified by the sliders above.
          </Typography>
          <Typography variant="body1" color="textSecondary" mt={2}>
            *Note: This is an experimental estimation. Beauty is subjective.*
          </Typography>
        </MuiBox>
      </MuiBox>
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
            params: userInfo.params, // Save adjusted parameters
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
    setGender(genderMap[selectedGender]);
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
            <Heading size="lg">Select Gender</Heading>
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
            <Text fontSize="lg" textAlign="center">
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
          <VStack spacing={6} align="stretch">
            <Heading size="lg">Tell Us About Them</Heading>
            <UserInfoForm onSubmit={handleFormSubmit} gender={gender} />
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
  );
};

export default AttractivenessRatingProcess;