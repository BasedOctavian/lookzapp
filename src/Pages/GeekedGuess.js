import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { doc, setDoc, addDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
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
  Grid,
  Chip,
} from '@mui/material';
import useVideoStream from '../hooks/useVideoStream';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';

// Define eye openness thresholds
const EYE_OPENNESS_THRESHOLDS = {
  CLOSED: 0.2,
  HALF_OPEN: 0.4,
  MOSTLY_OPEN: 0.6,
  FULLY_OPEN: 0.8,
};

// Helper function to calculate eye openness
const calculateEyeOpenness = (landmarks, eyeIndices) => {
  const topPoint = landmarks[eyeIndices.top];
  const bottomPoint = landmarks[eyeIndices.bottom];
  const eyeHeight = Math.abs(topPoint[1] - bottomPoint[1]);
  const leftPoint = landmarks[eyeIndices.left];
  const rightPoint = landmarks[eyeIndices.right];
  const eyeWidth = Math.abs(rightPoint[0] - leftPoint[0]);
  const opennessRatio = eyeHeight / eyeWidth;
  return Math.min(100, Math.max(0, opennessRatio * 100));
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
  const [model, setModel] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const toast = useToast();
  const stream = useVideoStream();

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

        const leftEyeIndices = { top: 159, bottom: 145, left: 33, right: 133 };
        const rightEyeIndices = { top: 386, bottom: 374, left: 362, right: 263 };

        const leftEyeOpenness = calculateEyeOpenness(landmarks, leftEyeIndices);
        const rightEyeOpenness = calculateEyeOpenness(landmarks, rightEyeIndices);
        const averageEyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;

        let eyeState;
        if (averageEyeOpenness < EYE_OPENNESS_THRESHOLDS.CLOSED * 100) {
          eyeState = 'CLOSED';
        } else if (averageEyeOpenness < EYE_OPENNESS_THRESHOLDS.HALF_OPEN * 100) {
          eyeState = 'HALF_OPEN';
        } else if (averageEyeOpenness < EYE_OPENNESS_THRESHOLDS.MOSTLY_OPEN * 100) {
          eyeState = 'MOSTLY_OPEN';
        } else if (averageEyeOpenness < EYE_OPENNESS_THRESHOLDS.FULLY_OPEN * 100) {
          eyeState = 'FULLY_OPEN';
        } else {
          eyeState = 'WIDE_OPEN';
        }

        const testScores = {
          'Left Eye Openness': leftEyeOpenness,
          'Right Eye Openness': rightEyeOpenness,
          'Average Eye Openness': averageEyeOpenness,
          'Eye State': eyeState,
        };

        setScore(averageEyeOpenness);

        if (isCollecting) {
          scoresRef.current.push(testScores);
          console.log('Eye openness scores collected:', testScores);
        }

        landmarks.forEach(([x, y]) => {
          context.beginPath();
          context.arc(x, y, 1, 0, 2 * Math.PI);
          context.fillStyle = 'red';
          context.fill();
        });

        context.beginPath();
        context.moveTo(landmarks[leftEyeIndices.left][0], landmarks[leftEyeIndices.left][1]);
        context.lineTo(landmarks[leftEyeIndices.top][0], landmarks[leftEyeIndices.top][1]);
        context.lineTo(landmarks[leftEyeIndices.right][0], landmarks[leftEyeIndices.right][1]);
        context.lineTo(landmarks[leftEyeIndices.bottom][0], landmarks[leftEyeIndices.bottom][1]);
        context.closePath();
        context.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        context.lineWidth = 2;
        context.stroke();

        context.beginPath();
        context.moveTo(landmarks[rightEyeIndices.left][0], landmarks[rightEyeIndices.left][1]);
        context.lineTo(landmarks[rightEyeIndices.top][0], landmarks[rightEyeIndices.top][1]);
        context.lineTo(landmarks[rightEyeIndices.right][0], landmarks[rightEyeIndices.right][1]);
        context.lineTo(landmarks[rightEyeIndices.bottom][0], landmarks[rightEyeIndices.bottom][1]);
        context.closePath();
        context.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        context.lineWidth = 2;
        context.stroke();
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setScore(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 500);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected]);

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
        ['Left Eye Openness', 'Right Eye Openness', 'Average Eye Openness'].forEach((test) => {
          const testScores = collectedScores.map((scores) => scores[test]);
          const average = testScores.reduce((sum, val) => sum + val, 0) / testScores.length;
          testAverages[test] = average;
        });

        const eyeStates = collectedScores.map((scores) => scores['Eye State']);
        const stateCounts = {};
        eyeStates.forEach((state) => {
          stateCounts[state] = (stateCounts[state] || 0) + 1;
        });
        const mostCommonState = Object.entries(stateCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        testAverages['Eye State'] = mostCommonState;

        onScanningComplete({ finalScore: testAverages['Average Eye Openness'], testAverages });
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
          Eye Openness: {score.toFixed(2)}%
        </Text>
      )}
    </Box>
  );
};

// ResultDisplay Component
const ResultDisplay = ({ percentage, eyeState }) => {
  const getColorForEyeState = (state) => {
    switch (state) {
      case 'CLOSED': return '#FF6B6B';
      case 'HALF_OPEN': return '#FFD93D';
      case 'MOSTLY_OPEN': return '#6BCB77';
      case 'FULLY_OPEN': return '#4D96FF';
      case 'WIDE_OPEN': return '#9B72AA';
      default: return '#6BCB77';
    }
  };

  const color = getColorForEyeState(eyeState);

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
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      }}
    >
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={120}
        thickness={4}
        sx={{
          color: color,
          '& .MuiCircularProgress-circle': { transition: 'stroke-dashoffset 1s ease-in-out' },
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
          {eyeState.replace('_', ' ')}
        </Typography>
      </MuiBox>
    </MuiBox>
  );
};

// Adjusted Drug Profiles
const drugProfiles = [
  {
    name: 'Stimulants',
    description: 'Stimulants like Adderall often cause pupil dilation and alertness.',
    eyeStates: ['MOSTLY_OPEN', 'FULLY_OPEN', 'WIDE_OPEN'],
    opennessRange: [60, 100],
  },
  {
    name: 'Depressants',
    description: 'Depressants such as alcohol can cause a relaxed or sleepy appearance.',
    eyeStates: ['HALF_OPEN', 'MOSTLY_OPEN'],
    opennessRange: [30, 60],
  },
  {
    name: 'Cannabis',
    description: 'Cannabis often causes bloodshot eyes and can affect eye openness variably.',
    eyeStates: ['CLOSED', 'HALF_OPEN'],
    opennessRange: [0, 40],
  },
  {
    name: 'Stimulant + Depressant',
    description: 'Combination of stimulants and depressants can lead to mixed effects on eye openness.',
    eyeStates: ['HALF_OPEN', 'MOSTLY_OPEN'],
    opennessRange: [30, 50],
  },
  {
    name: 'Geeked',
    description: 'A state of high alertness or excitement, often with wide-open eyes.',
    eyeStates: ['FULLY_OPEN', 'WIDE_OPEN'],
    opennessRange: [80, 100],
  },
];

// Improved Predict Drug Influence Function
const predictDrugInfluence = (eyeState, averageOpenness, algorithmParams) => {
  // If algorithm parameters are not loaded yet, use default drug profiles
  const profiles = algorithmParams?.drugProfiles || drugProfiles;
  
  return profiles.map((drug) => {
    let likelihood = 0;
    if (drug.eyeStates.includes(eyeState)) {
      likelihood += 50;
    }
    const rangeCenter = (drug.opennessRange[0] + drug.opennessRange[1]) / 2;
    const rangeWidth = drug.opennessRange[1] - drug.opennessRange[0];
    const distance = Math.abs(averageOpenness - rangeCenter);
    const maxDistance = rangeWidth / 2;
    if (distance <= maxDistance) {
      likelihood += 50 * (1 - distance / maxDistance);
    }
    return { ...drug, likelihood };
  }).sort((a, b) => b.likelihood - a.likelihood).slice(0, 3);
};

// DetailedResultDisplay Component
const DetailedResultDisplay = ({ overallPercentage, testScores, algorithmParams, onUpdateAlgorithmParams }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userSubstances, setUserSubstances] = useState([]);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [selectedSubstance, setSelectedSubstance] = useState('');
  const [calibrationData, setCalibrationData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  let eyeState = testScores['Eye State'];
  const predictedSubstances = predictDrugInfluence(eyeState, testScores['Average Eye Openness'], algorithmParams);

  // Function to handle adding a substance the user is actually on
  const handleAddSubstance = () => {
    if (selectedSubstance && !userSubstances.includes(selectedSubstance)) {
      setUserSubstances([...userSubstances, selectedSubstance]);
      setSelectedSubstance('');
    }
  };

  // Function to remove a substance
  const handleRemoveSubstance = (substance) => {
    setUserSubstances(userSubstances.filter(s => s !== substance));
  };

  // Function to toggle calibration mode
  const toggleCalibrationMode = () => {
    setCalibrationMode(!calibrationMode);
  };

  // Function to save calibration data to Firestore
  const saveCalibrationData = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save calibration data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create calibration data object
      const calibrationEntry = {
        uid: user.uid,
        eyeState: eyeState,
        averageOpenness: testScores['Average Eye Openness'],
        substances: userSubstances,
        timestamp: new Date(),
      };
      
      // Save to Firestore
      await addDoc(collection(db, 'eyeOpennessCalibration'), calibrationEntry);
      
      // Update local state
      const newCalibrationData = {
        ...calibrationData,
        [eyeState]: {
          averageOpenness: testScores['Average Eye Openness'],
          substances: userSubstances
        }
      };
      setCalibrationData(newCalibrationData);
      localStorage.setItem('eyeOpennessCalibration', JSON.stringify(newCalibrationData));
      
      // Update algorithm parameters
      await onUpdateAlgorithmParams(eyeState, testScores['Average Eye Openness'], userSubstances);
      
      toast({
        title: 'Success',
        description: 'Calibration data saved and algorithm updated!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving calibration data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save calibration data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load calibration data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('eyeOpennessCalibration');
    if (savedData) {
      setCalibrationData(JSON.parse(savedData));
    }
  }, []);

  if (!testScores) {
    return (
      <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
          Eye Openness Analysis
        </Typography>
        <MuiBox display="flex" justifyContent="center" mb={4}>
          <ResultDisplay percentage={overallPercentage} eyeState={eyeState} />
        </MuiBox>
        <Typography variant="body1" color="textSecondary" align="center">
          *Note: This is an experimental estimation based on facial features and not a medical diagnosis.*
        </Typography>
      </MuiBox>
    );
  }

  return (
    <MuiBox sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
        Potential Substance Analysis
      </Typography>
      <MuiBox display="flex" justifyContent="center" mb={4}>
        <ResultDisplay percentage={overallPercentage} eyeState={eyeState} />
      </MuiBox>

      {/* Parameters Section */}
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Analysis Parameters
        </Typography>
        <MuiBox sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.1)' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Eye State: {eyeState}</Typography>
              <Typography variant="body2" color="textSecondary">
                Thresholds: {Object.entries(EYE_OPENNESS_THRESHOLDS).map(([state, value]) => 
                  `${state}: ${(value * 100).toFixed(0)}%`
                ).join(', ')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Eye Openness: {testScores['Average Eye Openness'].toFixed(1)}%</Typography>
              <Typography variant="body2" color="textSecondary">
                Left Eye: {testScores['Left Eye Openness'].toFixed(1)}%, 
                Right Eye: {testScores['Right Eye Openness'].toFixed(1)}%
              </Typography>
            </Grid>
          </Grid>
        </MuiBox>
      </MuiBox>

      {/* Calibration Section */}
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Calibration
        </Typography>
        <MuiBox sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.1)' }}>
          <Typography variant="body1" paragraph>
            Help improve the accuracy by telling us what substances you're actually on:
          </Typography>
          
          <MuiBox display="flex" alignItems="center" mb={2}>
            <MuiFormControl fullWidth sx={{ mr: 1 }}>
              <MuiSelect
                value={selectedSubstance}
                onChange={(e) => setSelectedSubstance(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>Select a substance</MenuItem>
                {(algorithmParams?.drugProfiles || drugProfiles).map((drug) => (
                  <MenuItem key={drug.name} value={drug.name}>{drug.name}</MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>
            <MuiButton 
              variant="contained" 
              onClick={handleAddSubstance}
              disabled={!selectedSubstance}
            >
              Add
            </MuiButton>
          </MuiBox>
          
          {userSubstances.length > 0 && (
            <MuiBox mb={3}>
              <Typography variant="body1" gutterBottom>Your substances:</Typography>
              <MuiBox display="flex" flexWrap="wrap" gap={1}>
                {userSubstances.map((substance) => (
                  <Chip 
                    key={substance} 
                    label={substance} 
                    onDelete={() => handleRemoveSubstance(substance)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </MuiBox>
            </MuiBox>
          )}
          
          <MuiBox display="flex" justifyContent="space-between" mt={2}>
            <MuiButton 
              variant="outlined" 
              onClick={toggleCalibrationMode}
              color={calibrationMode ? "secondary" : "primary"}
            >
              {calibrationMode ? "Cancel Calibration" : "Calibrate Algorithm"}
            </MuiButton>
            
            {calibrationMode && (
              <MuiButton 
                variant="contained" 
                color="primary"
                onClick={saveCalibrationData}
                disabled={userSubstances.length === 0 || isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Calibration'}
              </MuiButton>
            )}
          </MuiBox>
          
          {calibrationMode && (
            <MuiBox mt={2}>
              <Typography variant="body2" color="textSecondary">
                Current eye state: {eyeState} with {testScores['Average Eye Openness'].toFixed(1)}% openness
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This data will be used to improve future predictions for these substances.
              </Typography>
            </MuiBox>
          )}
        </MuiBox>
      </MuiBox>

      {/* Results Section */}
      <MuiBox sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
          Based on Your Eye Patterns
        </Typography>
        <MuiBox sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.1)' }}>
          {isLoading ? (
            <MuiBox display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </MuiBox>
          ) : (
            <>
              {predictedSubstances.map((substance, index) => {
                // Determine color based on likelihood
                let color;
                if (substance.likelihood >= 80) {
                  color = '#FF6B6B'; // High likelihood - red
                } else if (substance.likelihood >= 50) {
                  color = '#FFD93D'; // Medium likelihood - yellow
                } else {
                  color = '#6BCB77'; // Low likelihood - green
                }
                
                // Determine likelihood text
                let likelihoodText;
                if (substance.likelihood >= 80) {
                  likelihoodText = 'Very Likely';
                } else if (substance.likelihood >= 50) {
                  likelihoodText = 'Moderately Likely';
                } else {
                  likelihoodText = 'Less Likely';
                }
                
                return (
                  <MuiBox
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                      '@keyframes slideIn': {
                        '0%': { transform: 'translateX(-20px)', opacity: 0 },
                        '100%': { transform: 'translateX(0)', opacity: 1 },
                      },
                    }}
                  >
                    <MuiBox display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold" flex={1}>
                        {substance.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={color}
                        fontWeight="bold"
                        sx={{ bgcolor: `${color}20`, px: 1.5, py: 0.5, borderRadius: 1 }}
                      >
                        {likelihoodText}
                      </Typography>
                    </MuiBox>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      {substance.description}
                    </Typography>
                    <MuiBox sx={{ position: 'relative', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={substance.likelihood}
                        sx={{
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                            borderRadius: 3,
                            transition: 'width 1s ease-in-out',
                          },
                        }}
                      />
                    </MuiBox>
                  </MuiBox>
                );
              })}
              <Typography variant="body1" color="textSecondary" mt={2}>
                *Note: This analysis is for educational purposes only and should not be used for medical diagnosis or legal purposes. Eye patterns can vary due to fatigue, medical conditions, or environmental factors.*
              </Typography>
            </>
          )}
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
              '100%': { transform: 'scale(1)' },
            },
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontSize: '1.1rem',
          }}
        >
          Back to Home
        </MuiButton>
      </MuiBox>
    </MuiBox>
  );
};

// Main Component
const GeekedGuess = () => {
  const { userData, loading: loadingUser } = useUserData();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(null);
  const [scanFor, setScanFor] = useState(null);
  const [likelihoodScore, setLikelihoodScore] = useState(null);
  const [testScores, setTestScores] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [algorithmParams, setAlgorithmParams] = useState(null);
  const [isLoadingParams, setIsLoadingParams] = useState(false);
  const toast = useToast();

  // Function to fetch algorithm parameters from Firestore
  const fetchAlgorithmParameters = async () => {
    try {
      setIsLoadingParams(true);
      const paramsRef = collection(db, 'algorithmParameters');
      const paramsSnapshot = await getDocs(paramsRef);
      
      if (!paramsSnapshot.empty) {
        // Get the most recent parameters
        const latestParams = paramsSnapshot.docs.reduce((latest, doc) => {
          const data = doc.data();
          if (!latest || data.timestamp > latest.timestamp) {
            return { ...data, id: doc.id };
          }
          return latest;
        }, null);
        
        setAlgorithmParams(latestParams);
        console.log('Algorithm parameters loaded:', latestParams);
      } else {
        // If no parameters exist, use default values
        const defaultParams = {
          drugProfiles: drugProfiles,
          eyeOpennessThresholds: EYE_OPENNESS_THRESHOLDS,
          timestamp: new Date(),
        };
        setAlgorithmParams(defaultParams);
        console.log('Using default algorithm parameters');
      }
    } catch (error) {
      console.error('Error fetching algorithm parameters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load algorithm parameters.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingParams(false);
    }
  };

  // Fetch algorithm parameters on component mount
  useEffect(() => {
    fetchAlgorithmParameters();
    
    // Listen for algorithm parameter updates
    const handleAlgorithmParamsUpdated = () => {
      console.log('Algorithm parameters update event received');
      fetchAlgorithmParameters();
    };
    
    window.addEventListener('algorithmParamsUpdated', handleAlgorithmParamsUpdated);
    
    return () => {
      window.removeEventListener('algorithmParamsUpdated', handleAlgorithmParamsUpdated);
    };
  }, []);

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
          await addDoc(collection(db, 'eyeOpennessResults'), likelihoodData);
          console.log('Eye openness results saved to Firestore:', likelihoodData);
        } catch (error) {
          console.error('Error saving eye openness results to Firestore:', error);
          toast({
            title: 'Error',
            description: 'Failed to save results to Firestore.',
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
      setCurrentStep('instructions');
    }
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
      if (scanFor === 'myself') {
        setUserInfo((prev) => ({
          ...prev,
          testScores: testAverages,
          likelihoodScore: finalScore,
        }));
        setLikelihoodScore(finalScore);
        setTestScores(testAverages);
        setCurrentStep('result');
      } else {
        setLikelihoodScore(finalScore);
        setTestScores(testAverages);
        setCurrentStep('result');
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

  // Function to update algorithm parameters based on calibration data
  const updateAlgorithmParameters = async (eyeState, averageOpenness, substances) => {
    try {
      setIsLoadingParams(true);
      
      // Get current algorithm parameters
      const paramsRef = collection(db, 'algorithmParameters');
      const paramsSnapshot = await getDocs(paramsRef);
      
      let currentParams;
      if (!paramsSnapshot.empty) {
        // Get the most recent parameters
        currentParams = paramsSnapshot.docs.reduce((latest, doc) => {
          const data = doc.data();
          if (!latest || data.timestamp > latest.timestamp) {
            return { ...data, id: doc.id };
          }
          return latest;
        }, null);
      } else {
        // If no parameters exist, use default values
        currentParams = {
          drugProfiles: drugProfiles,
          eyeOpennessThresholds: EYE_OPENNESS_THRESHOLDS,
          timestamp: new Date(),
        };
      }
      
      // Update drug profiles based on calibration data
      const updatedDrugProfiles = [...currentParams.drugProfiles];
      
      // For each substance the user is on, update its profile
      substances.forEach(substanceName => {
        const substanceIndex = updatedDrugProfiles.findIndex(drug => drug.name === substanceName);
        if (substanceIndex !== -1) {
          // Update the eye states for this substance
          if (!updatedDrugProfiles[substanceIndex].eyeStates.includes(eyeState)) {
            updatedDrugProfiles[substanceIndex].eyeStates.push(eyeState);
          }
          
          // Update the openness range for this substance
          const currentRange = updatedDrugProfiles[substanceIndex].opennessRange;
          const newMin = Math.min(currentRange[0], averageOpenness - 10);
          const newMax = Math.max(currentRange[1], averageOpenness + 10);
          updatedDrugProfiles[substanceIndex].opennessRange = [newMin, newMax];
        }
      });
      
      // Create updated parameters
      const updatedParams = {
        ...currentParams,
        drugProfiles: updatedDrugProfiles,
        timestamp: new Date(),
      };
      
      // Save to Firestore
      if (currentParams.id) {
        // Update existing document
        await updateDoc(doc(db, 'algorithmParameters', currentParams.id), updatedParams);
      } else {
        // Create new document
        await addDoc(collection(db, 'algorithmParameters'), updatedParams);
      }
      
      // Update local state
      setAlgorithmParams(updatedParams);
      
      console.log('Algorithm parameters updated:', updatedParams);
    } catch (error) {
      console.error('Error updating algorithm parameters:', error);
      toast({
        title: 'Error',
        description: 'Failed to update algorithm parameters.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingParams(false);
    }
  };

  return (
    <>
      <TopBar />
      <Container maxW="container.xl" py={{ base: 4, md: 6 }} bg="gray.50">
        <VStack spacing={6} align="stretch">
          {isLoadingParams && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          {!isLoadingParams && (
            <>
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
                  <Heading size="lg">Let's Analyze Your Eye Openness!</Heading>
                  <Text fontSize="lg" textAlign="center">
                    Position your face in front of the camera with good lighting and keep it straight. 
                    The scan will measure how open your eyes are and provide insights about your alertness and potential substance influence.
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
                  <Heading size="lg">Eye Openness Analysis</Heading>
                  <DetailedResultDisplay 
                    overallPercentage={likelihoodScore} 
                    testScores={testScores} 
                    algorithmParams={algorithmParams}
                    onUpdateAlgorithmParams={updateAlgorithmParameters}
                  />
                </VStack>
              )}
            </>
          )}
        </VStack>
      </Container>
      <Footer />
    </>
  );
};

// Helper Functions
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

export default GeekedGuess;