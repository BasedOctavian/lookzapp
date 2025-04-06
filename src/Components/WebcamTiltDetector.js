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
} from '@mui/material';

// Define tests, weights, and params
const tests = [
  'Carnal Tilt',
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
  'Carnal Tilt': 3.3,
  'Facial Thirds': 1.3,
  'Cheekbone Location': 0.4,
  'Interocular Distance': 1,
  'Undereyes': 0,
  'Jawline': 0,
  'Chin': 0,
  'Nose': 0,
};

const testParams = {
  'Carnal Tilt': 10,
  'Facial Thirds': 100,
  'Cheekbone Location': 0.5,
  'Interocular Distance': 200,
  'Undereyes': 50,
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
  const toast = useToast();

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
        const face = predictions[0];
        const landmarks = face.scaledMesh;
        const boundingBox = face.boundingBox;

        const testScores = {};
        tests.forEach((test) => {
          if (test !== 'Overall') {
            testScores[test] = runTest(test, landmarks, boundingBox, testParams, gender);
          }
        });
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
          context.fillStyle = 'red';
          context.fill();
        });
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setScore(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 500);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected, gender]);

  useEffect(() => {
    if (!startScanning || isCollecting) return;

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
            const lowerQuartile = sortedTestScores.slice(0, k);
            const average = lowerQuartile.reduce((sum, val) => sum + val, 0) / k;
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
  }, [startScanning, onScanningComplete]);

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
      {isCollecting && faceDetected && (
        <Text
          position="absolute"
          top="60%"
          left="50%"
          transform="translate(-50%, -50%)"
          color="white"
          fontSize="xl"
          fontWeight="bold"
          bg="rgba(0,0,0,0.5)"
          px={4}
          py={2}
          borderRadius="md"
        >
          Current Score: {score.toFixed(2)}
        </Text>
      )}
    </Box>
  );
};

// Updated UserInfoForm Component with Name Field
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
const ResultDisplay = ({ rating }) => {
  const cappedRating = Math.min(Math.max(rating, 15.69), 99);
  return (
    <MuiBox position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={cappedRating} size={100} thickness={4} />
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
          {cappedRating.toFixed(2)}
        </Typography>
      </MuiBox>
    </MuiBox>
  );
};

// DetailedResultDisplay Component
const DetailedResultDisplay = ({ overallRating, faceRating, testScores }) => {
  const navigate = useNavigate();

  return (
    <MuiBox>
      <Typography variant="h4" gutterBottom>
        Your Attractiveness Rating
      </Typography>
      <MuiBox display="flex" justifyContent="center" mb={4}>
        <ResultDisplay rating={overallRating} />
      </MuiBox>
      <Typography variant="h5" gutterBottom>
        Face Rating: {faceRating.toFixed(2)}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Test</TableCell>
              <TableCell align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(testScores).map(([test, score]) => (
              <TableRow key={test}>
                <TableCell component="th" scope="row">
                  {test}
                </TableCell>
                <TableCell align="right">{score.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <MuiBox mt={4}>
        <MuiButton variant="contained" color="primary" onClick={() => navigate('/')}>
          Next
        </MuiButton>
      </MuiBox>
    </MuiBox>
  );
};

// Mapping Functions for User Data
const mapEyeColor = (eyeColor) => {
  const lowerEyeColor = eyeColor.toLowerCase();
  if (lowerEyeColor === 'blue') return 'blue';
  if (lowerEyeColor === 'green') return 'green';
  if (lowerEyeColor === 'brown') return 'brown';
  if (lowerEyeColor === 'hazel') return 'brown';
  if (lowerEyeColor === 'gray') return 'blue';
  return 'brown'; // default
};

const getGenderCode = (gender) => {
  const lowerGender = gender.toLowerCase();
  if (lowerGender === 'male') return 'M';
  if (lowerGender === 'female') return 'W';
  return 'M'; // default
};

// Main Component with Firestore Integration
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

  useEffect(() => {
    if (!loadingUser && userData) {
      if (userData.timesRanked === 0) {
        setScanFor('myself');
        setUserInfo({
          name: userData.name || 'Self', // Assuming userData has a name field, fallback to 'Self'
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
          console.log('User document updated:', { ranking: dividedRating, timesRanked: 1 });
        } catch (error) {
          console.error('Error updating user document:', error);
          toast({
            title: 'Error',
            description: 'Failed to save your rating. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      updateUserRating();
    }
  }, [loadingUser, userData, cappedRating, updated, toast, scanFor]);

  // Save rating to Firestore when currentStep is 'result'
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

  const handleScanForSelection = (choice) => {
    if (choice === 'myself') {
      setScanFor('myself');
      setUserInfo({
        name: userData.name || 'Self', // Assuming userData has a name field
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
      setTestScores(testAverages);
      if (scanFor === 'myself') {
        setUserInfo((prev) => ({ ...prev, faceRating: finalScore, testScores: testAverages }));
        setCurrentStep('result');
      } else {
        setFaceScore(finalScore);
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
    const updatedUserInfo = {
      name: info.name,
      faceRating: faceScore,
      testScores: testScores,
      ethnicity: info.ethnicity,
      eyeColor: info.eyeColor,
      height: info.height,
      weight: info.weight,
      gender: gender,
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
            <Heading size="lg">Let’s Scan the Face!</Heading>
            <Text fontSize="lg" textAlign="center">
              Put the face in front of the camera. Make sure there is good lighting and keep the face straight. Results can
              vary slightly if not. The scan starts when we see the face!
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
            <Heading size="lg">Here’s the Score!</Heading>
            <DetailedResultDisplay
              overallRating={cappedRating}
              faceRating={userInfo.faceRating}
              testScores={userInfo.testScores}
            />
          </VStack>
        )}
      </VStack>
    </Container>
  );
};

// Helper Functions for Scoring
const runTest = (test, landmarks, boundingBox, params, gender) => {
  switch (test) {
    case 'Carnal Tilt':
      return calculateTiltScore(landmarks, params['Carnal Tilt'], gender);
    case 'Facial Thirds':
      return calculateFacialThirdsScore(landmarks, params['Facial Thirds'], gender);
    case 'Cheekbone Location':
      return calculateCheekboneScore(landmarks, params['Cheekbone Location'], gender);
    case 'Interocular Distance':
      return calculateInterocularDistanceScore(landmarks, boundingBox, params['Interocular Distance'], gender);
    case 'Undereyes':
      return calculateUndereyesScore(landmarks, params['Undereyes'], gender);
    case 'Jawline':
      return calculateJawlineScore(landmarks, boundingBox, params['Jawline'], gender);
    case 'Chin':
      return calculateChinScore(landmarks, params['Chin'], gender);
    case 'Nose':
      return calculateNoseScore(landmarks, boundingBox, params['Nose'], gender);
    default:
      return 0;
  }
};

const calculateTiltScore = (landmarks, multiplier, gender) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const dy = rightEyeCenter[1] - leftEyeCenter[1];
  const dx = rightEyeCenter[0] - leftEyeCenter[0];
  const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
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
  const deviation = Math.abs(1 - (third1 / third2) / idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateCheekboneScore = (landmarks, multiplier, gender) => {
  const cheekLeft = landmarks[116][1];
  const cheekRight = landmarks[345][1];
  const diff = Math.abs(cheekLeft - cheekRight);
  const adjustedMultiplier = gender === 'W' ? multiplier * 1.2 : multiplier;
  return Math.max(0, 100 - diff * adjustedMultiplier);
};

const calculateInterocularDistanceScore = (landmarks, boundingBox, multiplier, gender) => {
  const leftEyeCenter = calculateEyeCenter(landmarks, [33, 133, 159, 145]);
  const rightEyeCenter = calculateEyeCenter(landmarks, [362, 263, 386, 374]);
  const distance = Math.sqrt((rightEyeCenter[0] - leftEyeCenter[0]) ** 2 + (rightEyeCenter[1] - leftEyeCenter[1]) ** 2);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = distance / faceWidth;
  const idealRatio = gender === 'M' ? 0.45 : 0.47;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateUndereyesScore = (landmarks, value, gender) => {
  return value;
};

const calculateJawlineScore = (landmarks, boundingBox, multiplier, gender) => {
  const jawWidth = Math.abs(landmarks[123][0] - landmarks[352][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = jawWidth / faceWidth;
  const idealRatio = gender === 'M' ? 0.8 : 0.7;
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
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

const calculateNoseScore = (landmarks, boundingBox, multiplier, gender) => {
  const noseWidth = Math.abs(landmarks[129][0] - landmarks[358][0]);
  const faceWidth = boundingBox.bottomRight[0] - boundingBox.topLeft[0];
  const ratio = noseWidth / faceWidth;
  const idealRatio = gender === 'M' ? 0.25 : 0.23;
  const deviation = Math.abs(ratio - idealRatio);
  return Math.max(0, 100 - deviation * multiplier);
};

export default AttractivenessRatingProcess;