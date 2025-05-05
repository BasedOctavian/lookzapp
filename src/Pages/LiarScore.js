import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import {
  Box,
  Button,
  Typography,
  Grid,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  styled,
  keyframes,
  Paper,
} from '@mui/material';
import { useToast } from '@chakra-ui/toast';
import {
  Face,
  Straighten,
  RemoveRedEye,
  Psychology,
  Person,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
} from '@mui/icons-material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIndicator from '../Components/LoadingIndicator';

// Animations
const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

// Utility functions
const generateExplanation = (scores) => {
  const explanations = [];
  const confidenceLevels = [];
  
  // Voice analysis
  if (scores.rmsMean > 0.015) {
    const intensity = scores.rmsMean > 0.025 ? 'elevated' : 'slightly elevated';
    explanations.push(`Your voice showed ${intensity} intensity, suggesting possible stress.`);
    confidenceLevels.push(scores.rmsMean > 0.025 ? 0.4 : 0.3);
  }

  if (scores.zcrMean > 0.15) {
    const instability = scores.zcrMean > 0.2 ? 'significant' : 'some';
    explanations.push(`Your speech showed ${instability} instability, indicating mild nervousness.`);
    confidenceLevels.push(scores.zcrMean > 0.2 ? 0.4 : 0.3);
  }

  // Body language analysis
  if (scores.headMovementVariance > 1.5) {
    const movement = scores.headMovementVariance > 2.5 ? 'increased' : 'slightly increased';
    explanations.push(`Your head movements were ${movement}, suggesting some discomfort.`);
    confidenceLevels.push(scores.headMovementVariance > 2.5 ? 0.4 : 0.3);
  }

  if (scores.smileIntensityVariance > 0.007) {
    const variation = scores.smileIntensityVariance > 0.015 ? 'noticeable' : 'minor';
    explanations.push(`Your facial expressions showed ${variation} variations, possibly indicating tension.`);
    confidenceLevels.push(scores.smileIntensityVariance > 0.015 ? 0.4 : 0.3);
  }

  // Micro-expressions
  if (scores.microExpressionCount > 2) {
    const frequency = scores.microExpressionCount > 4 ? 'frequent' : 'some';
    explanations.push(`${frequency} rapid facial movements were detected, suggesting concealed emotions.`);
    confidenceLevels.push(scores.microExpressionCount > 4 ? 0.4 : 0.3);
  }

  const avgConfidence = confidenceLevels.length > 0 
    ? confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length 
    : 0;
  
  const confidenceText = avgConfidence > 0.4 ? 'with moderate confidence' : 
                        avgConfidence > 0.2 ? 'with some confidence' : 
                        'with low confidence';

  if (explanations.length === 0) {
    return 'Your responses showed natural patterns with no significant deception indicators.';
  }

  return `Our analysis found ${confidenceText}: ${explanations.join(' ')}`;
};

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

const StyledInstructionText = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: '3',
  textAlign: 'center',
  background: 'rgba(13, 17, 44, 0.95)',
  backdropFilter: 'blur(8px)',
  padding: theme.spacing(2, 3),
  borderRadius: '16px',
  border: '1px solid rgba(250, 14, 164, 0.3)',
  animation: `${fadeIn} 0.5s ease-out`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  maxWidth: '90%',
  width: 'auto',
}));

// StatsDisplay Component - Real-Time Feedback
const StatsDisplay = ({ features }) => {
  if (!features) return null;

  const stats = [
    { label: 'Pitch Change', value: features.pitchChangeRate * 100, icon: <Psychology />, max: 50, normal: 15, unit: '%' },
    { label: 'Intensity', value: features.rmsMean * 1000, icon: <Person />, max: 50, normal: 20, unit: '' },
    { label: 'Head Movement', value: features.headMovementVariance * 10, icon: <Face />, max: 100, normal: 80, unit: '' },
    { label: 'Smile Intensity', value: features.smileIntensityVariance * 100, icon: <SentimentSatisfied />, max: 50, normal: 25, unit: '%' },
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
        maxHeight: '180px',
        overflow: 'auto',
      }}
    >
      <Grid container spacing={0.5}>
        {stats.map((stat, index) => {
          const percentage = (stat.value / stat.max) * 100;
          const isHigh = stat.value > stat.normal * 1.2;
          const isLow = stat.value < stat.normal * 0.8;
          const color = isHigh ? '#F44336' : isLow ? '#FF9800' : '#4CAF50';

          return (
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
                    color: color,
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.65rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: color,
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        ml: 0.5,
                      }}
                    >
                      {stat.value.toFixed(1)}{stat.unit}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 3,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: `${(stat.normal / stat.max) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: '#fa0ea4',
                        zIndex: 1,
                      }}
                    />
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(percentage, 100)}%`,
                        background: color,
                        transition: 'width 0.3s ease-out',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// AudioWaveform Component - Visualizes Audio Input
const AudioWaveform = ({ analyser }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(13, 17, 44, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#09c2f7';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '60px',
        background: 'rgba(13, 17, 44, 0.3)',
        borderRadius: '12px',
        padding: '8px',
        border: '1px solid rgba(9, 194, 247, 0.1)',
        zIndex: 3,
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={60}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
};

// FaceScanner Component - Enhanced Lie Detection with Micro-Expression and Voice Analysis
const FaceScanner = React.forwardRef(({ startScanning, onScanningComplete, onFaceDetected, currentPrompt, showDoneButton, onReady, isComputerSpeaking }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const earHistoryRef = useRef([]);
  const audioFeaturesRef = useRef([]);
  const headMovementRef = useRef([]);
  const smileIntensityRef = useRef([]);
  const gazeHistoryRef = useRef([]);
  const microExpressionDataRef = useRef([]);
  const audioDataRef = useRef([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [model, setModel] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentFeatures, setCurrentFeatures] = useState({});
  const toast = useToast();

  const leftEyeIndices = [33, 160, 158, 133, 153, 144];
  const rightEyeIndices = [362, 385, 387, 263, 373, 390];
  const mouthIndices = [61, 291, 0, 17, 269, 405];
  const noseIndices = [1, 2, 98, 327];

  const calculateDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
  };

  const stdDev = (arr) => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  };

  const calculateEAR = (landmarks, indices) => {
    try {
      const points = indices.map((i) => {
        if (!landmarks[i]) throw new Error('Missing landmark');
        return landmarks[i];
      });
      const [p1, p2, p3, p4, p5, p6] = points;
      const A = Math.sqrt((p2[0] - p6[0]) ** 2 + (p2[1] - p6[1]) ** 2);
      const B = Math.sqrt((p3[0] - p5[0]) ** 2 + (p3[1] - p5[1]) ** 2);
      const C = Math.sqrt((p1[0] - p4[0]) ** 2 + (p1[1] - p4[1]) ** 2);
      return (A + B) / (2.0 * C);
    } catch (e) {
      console.error('Error calculating EAR:', e);
      return 0;
    }
  };

  const calculateSmileIntensity = (landmarks) => {
    try {
      const mouthPoints = mouthIndices.map(i => landmarks[i]);
      const width = Math.abs(mouthPoints[1][0] - mouthPoints[0][0]);
      const height = Math.abs(mouthPoints[2][1] - mouthPoints[3][1]);
      const leftCorner = landmarks[61];
      const rightCorner = landmarks[291];
      const leftTop = landmarks[37];
      const rightTop = landmarks[267];
      const leftLift = Math.abs(leftCorner[1] - leftTop[1]);
      const rightLift = Math.abs(rightCorner[1] - rightTop[1]);
      const cornerLift = (leftLift + rightLift) / 2;
      const baseRatio = height / width;
      
      // Enhanced smile detection
      const cheekPoints = [123, 352]; // Cheek points
      const cheekLift = Math.abs(landmarks[cheekPoints[0]][1] - landmarks[cheekPoints[1]][1]);
      const eyeSquint = Math.abs(landmarks[159][1] - landmarks[386][1]); // Eye squint measurement
      
      const smileScore = (baseRatio * 0.3) + (cornerLift * 0.3) + (cheekLift * 0.2) + (eyeSquint * 0.2);
      return Math.min(Math.max(smileScore / 40, 0), 1);
    } catch (e) {
      console.error('Error calculating smile intensity:', e);
      return 0;
    }
  };

  const detectMicroExpressions = (current, previous) => {
    if (!current || !previous) return 0;
    
    let microExpressionCount = 0;
    
    // Detect eyebrow movements (more sensitive threshold)
    const eyebrowLeftChange = Math.abs(current.eyebrowLeft - previous.eyebrowLeft);
    const eyebrowRightChange = Math.abs(current.eyebrowRight - previous.eyebrowRight);
    if (eyebrowLeftChange > 0.02 || eyebrowRightChange > 0.02) {
      microExpressionCount++;
    }
    
    // Detect mouth movements (more sensitive threshold)
    const mouthWidthChange = Math.abs(current.mouthWidth - previous.mouthWidth);
    if (mouthWidthChange > 0.02) {
      microExpressionCount++;
    }
    
    // Detect eye squinting (new)
    const eyeSquintChange = Math.abs(current.eyeSquint - previous.eyeSquint);
    if (eyeSquintChange > 0.02) {
      microExpressionCount++;
    }
    
    // Detect nose wrinkling (new)
    const noseWrinkleChange = Math.abs(current.noseWrinkle - previous.noseWrinkle);
    if (noseWrinkleChange > 0.02) {
      microExpressionCount++;
    }
    
    // Detect lip tension changes (new)
    const lipTensionChange = Math.abs(current.lipTension - previous.lipTension);
    if (lipTensionChange > 0.02) {
      microExpressionCount++;
    }
    
    return microExpressionCount;
  };

  const calculateHeadMovement = (landmarks) => {
    try {
      const nosePoints = noseIndices.map(i => landmarks[i]);
      const centerX = nosePoints.reduce((sum, p) => sum + p[0], 0) / nosePoints.length;
      const centerY = nosePoints.reduce((sum, p) => sum + p[1], 0) / nosePoints.length;
      return { x: centerX, y: centerY };
    } catch (e) {
      console.error('Error calculating head movement:', e);
      return { x: 0, y: 0 };
    }
  };

  const calculateGazeRatio = (landmarks, leftIndex, rightIndex, irisIndex) => {
    const leftCorner = landmarks[leftIndex];
    const rightCorner = landmarks[rightIndex];
    const iris = landmarks[irisIndex];
    if (!leftCorner || !rightCorner || !iris) return 0.5;
    const eyeWidth = rightCorner[0] - leftCorner[0];
    if (eyeWidth === 0) return 0.5;
    return (iris[0] - leftCorner[0]) / eyeWidth;
  };

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
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.onloadedmetadata = () => {
          setVideoReady(true);
          videoRef.current.play().catch((err) => setWebcamError('Failed to play video'));
        };
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const audioStream = new MediaStream([audioTrack]);
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;
      } else {
        setWebcamError('Microphone access denied or unavailable');
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setWebcamError('Webcam or microphone access denied or unavailable');
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
      if (audioContextRef.current) audioContextRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (startScanning && !isCollecting) {
      setIsCollecting(true);
      earHistoryRef.current = [];
      audioFeaturesRef.current = [];
      headMovementRef.current = [];
      smileIntensityRef.current = [];
      gazeHistoryRef.current = [];
      microExpressionDataRef.current = [];
      audioDataRef.current = [];
    }
  }, [startScanning]);

  useEffect(() => {
    if (model && videoReady && onReady) {
      onReady();
    }
  }, [model, videoReady, onReady]);

  const handleDoneSpeaking = () => {
    setIsCollecting(false);
    const result = calculateScore();
    onScanningComplete(result);
  };

  const calculateScore = () => {
    try {
      const microExpressionData = microExpressionDataRef.current || [];
      const audioData = audioDataRef.current || [];
      const headMovements = headMovementRef.current || [];
      const smileIntensities = smileIntensityRef.current || [];
      const gazeHistory = gazeHistoryRef.current || [];

      // Enhanced micro-expression detection
      let totalMicroExpressions = 0;
      if (microExpressionData.length > 1) {
        for (let i = 1; i < microExpressionData.length; i++) {
          totalMicroExpressions += detectMicroExpressions(microExpressionData[i], microExpressionData[i-1]);
        }
      }
      const microExpressionCount = totalMicroExpressions;

      // Compute audio features with enhanced stutter detection
      const rmsValues = audioData.map(f => f?.rms || 0);
      const zcrValues = audioData.map(f => f?.zcr || 0);
      const rmsMean = rmsValues.length > 0 ? rmsValues.reduce((sum, r) => sum + r, 0) / rmsValues.length : 0;
      const zcrMean = zcrValues.length > 0 ? zcrValues.reduce((sum, z) => sum + z, 0) / zcrValues.length : 0;
      const rmsStd = stdDev(rmsValues);
      const zcrStd = stdDev(zcrValues);

      // Detect stutters (sudden changes in audio)
      const stutterCount = rmsValues.reduce((count, rms, i) => {
        if (i === 0) return 0;
        const prevRms = rmsValues[i-1];
        const change = Math.abs(rms - prevRms);
        // More sensitive threshold for stutter detection
        return count + (change > 0.05 ? 1 : 0);
      }, 0);

      // Also detect rapid changes in zero-crossing rate as potential stutters
      const zcrStutterCount = zcrValues.reduce((count, zcr, i) => {
        if (i === 0) return 0;
        const prevZcr = zcrValues[i-1];
        const change = Math.abs(zcr - prevZcr);
        return count + (change > 0.1 ? 1 : 0);
      }, 0);

      // Combine both types of stutters
      const totalStutterCount = stutterCount + zcrStutterCount;

      const headMovementVariance = headMovements.length > 1
        ? headMovements.reduce((sum, pos, i) => {
            if (i === 0) return 0;
            const prev = headMovements[i - 1];
            return sum + Math.sqrt((pos.x - prev.x) ** 2 + (pos.y - prev.y) ** 2);
          }, 0) / (headMovements.length - 1)
        : 0;

      const smileIntensityVariance = smileIntensities.length > 1
        ? smileIntensities.reduce((sum, intensity, i) => {
            if (i === 0) return 0;
            return sum + Math.abs(intensity - smileIntensities[i - 1]);
          }, 0) / (smileIntensities.length - 1)
        : 0;

      const gazeAwayCount = gazeHistory.filter(g => g < 0.3 || g > 0.7).length;
      const gazeAwayPercentage = gazeHistory.length > 0 ? (gazeAwayCount / gazeHistory.length) * 100 : 0;

      // Calculate individual scores (0-1 range)
      const voiceIntensityScore = Math.min(rmsMean * 15, 1);
      const zcrScore = Math.min(zcrMean / 15, 1);
      const headMovementScore = Math.min(headMovementVariance / 15, 1);
      const smileScore = Math.min(smileIntensityVariance * 3, 1);
      const microExpressionScore = Math.min(microExpressionCount / 3, 1);
      const gazeScore = Math.min(gazeAwayPercentage / 100, 1);
      const stutterScore = Math.min(totalStutterCount / 5, 1);

      // Calculate weighted average with stutter detection
      const weights = {
        voiceIntensity: 0.15,
        zcr: 0.15,
        headMovement: 0.15,
        smile: 0.15,
        microExpressions: 0.15,
        gaze: 0.1,
        stutter: 0.15
      };

      const weightedScore = (
        voiceIntensityScore * weights.voiceIntensity +
        zcrScore * weights.zcr +
        headMovementScore * weights.headMovement +
        smileScore * weights.smile +
        microExpressionScore * weights.microExpressions +
        gazeScore * weights.gaze +
        stutterScore * weights.stutter
      );

      // Calculate final score with non-linear scaling
      const finalLieScore = Math.round(
        (Math.tanh((weightedScore - 0.4) * 2.5) + 1) * 50
      );

      return {
        finalLieScore,
        microExpressionCount,
        rmsMean,
        zcrMean,
        rmsStd,
        zcrStd,
        headMovementVariance,
        smileIntensityVariance,
        gazeAwayPercentage,
        stutterCount
      };
    } catch (error) {
      console.error('Error in score calculation:', error);
      return {
        finalLieScore: 0,
        microExpressionCount: 0,
        rmsMean: 0,
        zcrMean: 0,
        rmsStd: 0,
        zcrStd: 0,
        headMovementVariance: 0,
        smileIntensityVariance: 0,
        gazeAwayPercentage: 0,
        stutterCount: 0
      };
    }
  };

  useImperativeHandle(ref, () => ({
    startCollecting: () => {
      setIsCollecting(true);
      earHistoryRef.current = [];
      audioFeaturesRef.current = [];
      headMovementRef.current = [];
      smileIntensityRef.current = [];
      gazeHistoryRef.current = [];
      microExpressionDataRef.current = [];
      audioDataRef.current = [];
    },
    stopCollecting: () => {
      setIsCollecting(false);
      const result = calculateScore();
      onScanningComplete(result);
    },
  }));

  useEffect(() => {
    if (!model || !videoReady || !analyserRef.current) return;

    const detectFaceAndRunTest = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const predictions = await model.estimateFaces(video);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        setFaceDetected(true);
        onFaceDetected(true);

        const face = predictions[0];
        const landmarks = face.scaledMesh;

        try {
          const leftEAR = calculateEAR(landmarks, leftEyeIndices);
          const rightEAR = calculateEAR(landmarks, rightEyeIndices);
          const avgEAR = (leftEAR + rightEAR) / 2;

          context.strokeStyle = 'rgba(9, 194, 247, 0.5)';
          context.lineWidth = 1;
          context.beginPath();
          for (let i = 0; i < landmarks.length; i++) {
            const point = landmarks[i];
            if (!point || !Array.isArray(point) || point.length < 2) continue;
            const [x, y] = point;
            if (i === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }
          context.stroke();

          context.fillStyle = `rgba(250, 14, 164, ${1 - Math.min(avgEAR, 0.3) / 0.3})`;
          leftEyeIndices.forEach(index => {
            const point = landmarks[index];
            if (!point || !Array.isArray(point) || point.length < 2) return;
            const [x, y] = point;
            context.beginPath();
            context.arc(x, y, 2, 0, 2 * Math.PI);
            context.fill();
          });

          context.fillStyle = `rgba(250, 14, 164, ${1 - Math.min(avgEAR, 0.3) / 0.3})`;
          rightEyeIndices.forEach(index => {
            const point = landmarks[index];
            if (!point || !Array.isArray(point) || point.length < 2) return;
            const [x, y] = point;
            context.beginPath();
            context.arc(x, y, 2, 0, 2 * Math.PI);
            context.fill();
          });

          context.fillStyle = 'rgba(9, 194, 247, 0.8)';
          mouthIndices.forEach(index => {
            const point = landmarks[index];
            if (!point || !Array.isArray(point) || point.length < 2) return;
            const [x, y] = point;
            context.beginPath();
            context.arc(x, y, 2, 0, 2 * Math.PI);
            context.fill();
          });

          context.fillStyle = 'rgba(255, 255, 255, 0.8)';
          noseIndices.forEach(index => {
            const point = landmarks[index];
            if (!point || !Array.isArray(point) || point.length < 2) return;
            const [x, y] = point;
            context.beginPath();
            context.arc(x, y, 2, 0, 2 * Math.PI);
            context.fill();
          });

          context.fillStyle = 'rgba(250, 14, 164, 1)';
          [468, 473].forEach(index => {
            const point = landmarks[index];
            if (!point || !Array.isArray(point) || point.length < 2) return;
            const [x, y] = point;
            context.beginPath();
            context.arc(x, y, 3, 0, 2 * Math.PI);
            context.fill();
          });

          if (isCollecting) {
            const smileIntensity = calculateSmileIntensity(landmarks);
            smileIntensityRef.current.push(smileIntensity);

            const headPosition = calculateHeadMovement(landmarks);
            headMovementRef.current.push(headPosition);

            const leftEyeGaze = calculateGazeRatio(landmarks, 33, 133, 468);
            const rightEyeGaze = calculateGazeRatio(landmarks, 362, 263, 473);
            const avgGaze = (leftEyeGaze + rightEyeGaze) / 2;
            gazeHistoryRef.current.push(avgGaze);

            const analyser = analyserRef.current;
            const bufferLength = analyser.fftSize;
            const dataArray = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(dataArray);

            // Always collect micro-expression data
            const eyebrowLeft = calculateDistance(landmarks[19], landmarks[37]);
            const eyebrowRight = calculateDistance(landmarks[24], landmarks[44]);
            const mouthWidth = calculateDistance(landmarks[61], landmarks[291]);
            const eyeSquint = calculateDistance(landmarks[33], landmarks[133]);
            const noseWrinkle = calculateDistance(landmarks[1], landmarks[2]);
            const lipTension = calculateDistance(landmarks[61], landmarks[291]);
            
            microExpressionDataRef.current.push({
              eyebrowLeft,
              eyebrowRight,
              mouthWidth,
              eyeSquint,
              noseWrinkle,
              lipTension
            });

            // Always collect audio data
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i] ** 2;
            }
            const rms = Math.sqrt(sum / bufferLength);

            let zcr = 0;
            for (let i = 1; i < bufferLength; i++) {
              if ((dataArray[i - 1] >= 0 && dataArray[i] < 0) || (dataArray[i - 1] < 0 && dataArray[i] >= 0)) {
                zcr += 1;
              }
            }
            zcr /= bufferLength;

            audioDataRef.current.push({ rms, zcr });

            setCurrentFeatures({
              pitchChangeRate: zcr,
              rmsMean: rms,
              headMovementVariance: headMovementRef.current.length > 1
                ? headMovementRef.current.reduce((sum, pos, i) => {
                    if (i === 0) return 0;
                    const prev = headMovementRef.current[i - 1];
                    return sum + Math.sqrt((pos.x - prev.x) ** 2 + (pos.y - prev.y) ** 2);
                  }, 0) / (headMovementRef.current.length - 1)
                : 0,
              smileIntensityVariance: smileIntensity,
            });
          }
        } catch (error) {
          console.error('Error processing face data:', error);
        }
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
        setCurrentFeatures({});
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 100);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected, isComputerSpeaking]);

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
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error" mb={2}>
            <WarningAmberIcon sx={{ fontSize: 24, mr: 1 }} /> Camera Error
          </Typography>
          <Typography variant="body1" color="error" mb={3}>
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
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isLoading ? 'blur(4px)' : 'none' }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: faceDetected ? 1 : 0.5 }}
      />
      <StyledInstructionText>
        <Typography variant="h6" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
          {faceDetected 
            ? (isCollecting ? 'Hold still and speak...' : 'Look at the camera')
            : 'Please Wait...'}
        </Typography>
        {faceDetected && currentPrompt && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
              {typeof currentPrompt === 'string' ? currentPrompt : currentPrompt.prompt}
            </Typography>
            {typeof currentPrompt !== 'string' && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {currentPrompt.context}
              </Typography>
            )}
          </Box>
        )}
      </StyledInstructionText>
      {showDoneButton && isCollecting && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: '20%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 3,
          textAlign: 'center',
        }}>
          <GradientButton 
            onClick={handleDoneSpeaking}
            sx={{ 
              minWidth: '200px',
              fontSize: '1.2rem',
              py: 1.5,
            }}
          >
            Done Speaking
          </GradientButton>
        </Box>
      )}
      {faceDetected && <StatsDisplay features={currentFeatures} />}
      {faceDetected && isCollecting && !isComputerSpeaking && <AudioWaveform analyser={analyserRef.current} />}
    </StyledWebcamContainer>
  );
});

// CustomBarChart Component - Visualization
const CustomBarChart = ({ data, normalRanges }) => {
  return (
    <Box sx={{ width: '100%', height: '300px', position: 'relative' }}>
      {data.map((item, index) => {
        const value = item.value;
        const max = item.max;
        const normalRange = normalRanges[index];
        const percentage = (value / max) * 100;
        const normalPercentage = (normalRange / max) * 100;
        const isHigh = value > normalRange * 1.2;
        const isLow = value < normalRange * 0.8;
        const color = isHigh ? '#F44336' : isLow ? '#FF9800' : '#4CAF50';
        
        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              height: '40px',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                width: '150px',
                color: '#fff',
                fontSize: '0.8rem',
                textAlign: 'right',
                pr: 2,
              }}
            >
              {item.label}
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: '100%',
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${normalPercentage}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#fa0ea4',
                  zIndex: 1,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  background: color,
                  transition: 'width 0.5s ease-out',
                  borderRadius: '4px',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px rgba(0,0,0,0.5)',
                }}
              >
                {value.toFixed(1)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

// DetailedResultDisplay Component - Scenario Mode Results
const DetailedResultDisplay = ({ overallPercentage, testScores, previousScores, scenario }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const safeTestScores = {
    blinkRate: 0,
    rmsMean: 0,
    zcrMean: 0,
    headMovementVariance: 0,
    smileIntensityVariance: 0,
    gazeAwayPercentage: 0,
    microExpressionCount: 0,
    rmsStd: 0,
    zcrStd: 0,
    ...testScores
  };

  const chartData = [
    { label: 'Voice Intensity', value: (safeTestScores.rmsMean || 0) * 1000, max: 50 },
    { label: 'Zero-Crossing Rate', value: (safeTestScores.zcrMean || 0) * 100, max: 50 },
    { label: 'Head Movement', value: (safeTestScores.headMovementVariance || 0) * 10, max: 100 },
    { label: 'Smile Intensity', value: (safeTestScores.smileIntensityVariance || 0) * 100, max: 50 },
  ];

  const normalRanges = [20, 15, 80, 25];

  const getRatingExplanation = (label, value, max) => {
    let explanation = '';
    let color = '#4CAF50';

    switch (label) {
      case 'Voice Intensity':
        if (value > 30) {
          explanation = 'High intensity. Suggests overcompensation.';
          color = '#F44336';
        } else if (value > 20) {
          explanation = 'Elevated intensity. Possible stress.';
          color = '#FF9800';
        } else {
          explanation = 'Normal intensity. Natural pattern.';
        }
        break;
      case 'Zero-Crossing Rate':
        if (value > 20) {
          explanation = 'Highly unstable speech. Strong nervousness.';
          color = '#F44336';
        } else if (value > 15) {
          explanation = 'Unstable speech. Indicates nervousness.';
          color = '#FF9800';
        } else {
          explanation = 'Stable speech. Natural rhythm.';
        }
        break;
      case 'Head Movement':
        if (value > 90) {
          explanation = 'Excessive movement. High stress.';
          color = '#F44336';
        } else if (value > 80) {
          explanation = 'Increased movement. Suggests nervousness.';
          color = '#FF9800';
        } else {
          explanation = 'Normal movement. Relaxed behavior.';
        }
        break;
      case 'Smile Intensity':
        if (value > 35) {
          explanation = 'Highly unnatural. Likely forced.';
          color = '#F44336';
        } else if (value > 25) {
          explanation = 'Unnatural variation. Possible discomfort.';
          color = '#FF9800';
        } else {
          explanation = 'Natural variation. Genuine expression.';
        }
        break;
    }
    return { explanation, color };
  };

  let tierLabel, tierEmoji;
  if (overallPercentage >= 75) {
    tierLabel = 'High Likelihood of Lying';
    tierEmoji = <SentimentDissatisfied />;
  } else if (overallPercentage >= 50) {
    tierLabel = 'Moderate Likelihood of Lying';
    tierEmoji = <SentimentNeutral />;
  } else if (overallPercentage >= 25) {
    tierLabel = 'Some Signs of Deception';
    tierEmoji = <SentimentNeutral />;
  } else {
    tierLabel = 'Low Likelihood of Lying';
    tierEmoji = <SentimentSatisfied />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Box
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: 'rgba(13, 17, 44, 0.7)',
          border: '1px solid rgba(250, 14, 164, 0.2)',
          mb: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="div" gutterBottom sx={{ fontSize: '4rem' }}>
          {tierEmoji}
        </Typography>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {tierLabel}
        </Typography>
        <CircularProgress
          variant="determinate"
          value={overallPercentage || 0}
          size={120}
          thickness={4}
          sx={{ color: '#09c2f7', mt: 2 }}
        />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {(overallPercentage || 0).toFixed(0)}% Lie Likelihood
        </Typography>
        <Typography variant="body1" paragraph sx={{ mt: 3 }}>
          {generateExplanation(safeTestScores)}
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
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold" align="center" mb={4}>
            Detailed Feature Analysis
          </Typography>
          <Box sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            bgcolor: 'rgba(13, 17, 44, 0.7)',
            border: '1px solid rgba(9, 194, 247, 0.3)',
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 3 }}>
              Feature Comparison
            </Typography>
            <CustomBarChart data={chartData} normalRanges={normalRanges} />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#4CAF50', borderRadius: '2px' }} />
                <Typography variant="caption" sx={{ color: '#fff' }}>Normal</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#FF9800', borderRadius: '2px' }} />
                <Typography variant="caption" sx={{ color: '#fff' }}>Elevated</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#F44336', borderRadius: '2px' }} />
                <Typography variant="caption" sx={{ color: '#fff' }}>High</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {chartData.map((item, index) => {
              const { explanation, color } = getRatingExplanation(item.label, item.value, item.max);
              return (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(13, 17, 44, 0.7)',
                    border: `1px solid ${color}`,
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body1" fontWeight="medium" sx={{ color: '#fff' }}>
                      {item.label}: {item.value.toFixed(2)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((item.value / item.max) * 100, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': { backgroundColor: color },
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>
                    {explanation}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          *This is for entertainment purposes only and not a reliable lie detector.*
        </Typography>
      </Box>
    </Box>
  );
};

// QuestionResultsDisplay Component - Question Mode Results
const QuestionResultsDisplay = ({ questionResults }) => (
  <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
    <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>Question Results</Typography>
    {questionResults.map((result, index) => {
      const getTierColor = (score) => {
        if (score >= 70) return '#F44336';
        if (score >= 40) return '#FF9800';
        return '#4CAF50';
      };

      const chartData = [
        { label: 'Voice Intensity', value: (result.rmsMean || 0) * 1000, max: 50 },
        { label: 'Zero-Crossing Rate', value: (result.zcrMean || 0) * 100, max: 50 },
        { label: 'Head Movement', value: (result.headMovementVariance || 0) * 10, max: 100 },
        { label: 'Smile Intensity', value: (result.smileIntensityVariance || 0) * 100, max: 50 },
        { label: 'Micro-Expressions', value: (result.microExpressionCount || 0) * 20, max: 100 },
        { label: 'Gaze Away', value: (result.gazeAwayPercentage || 0), max: 100 },
        { label: 'Stutter Count', value: (result.stutterCount || 0) * 20, max: 100 }
      ];

      const normalRanges = [20, 15, 80, 25, 30, 40, 20];

      return (
        <Box 
          key={index} 
          sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: 2, 
            bgcolor: 'rgba(13, 17, 44, 0.7)',
            border: '1px solid rgba(250, 14, 164, 0.2)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Question {index + 1}: {result.question}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 3,
            gap: 2
          }}>
            <CircularProgress
              variant="determinate"
              value={result.finalLieScore || 0}
              size={80}
              thickness={4}
              sx={{ color: getTierColor(result.finalLieScore) }}
            />
            <Box>
              <Typography variant="h5" sx={{ color: getTierColor(result.finalLieScore) }}>
                {result.finalLieScore.toFixed(0)}% Lie Likelihood
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {result.finalLieScore >= 70 ? 'High Likelihood of Lying' :
                 result.finalLieScore >= 40 ? 'Moderate Likelihood of Lying' :
                 result.finalLieScore >= 25 ? 'Some Signs of Deception' :
                 'Low Likelihood of Lying'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>
              Detailed Analysis
            </Typography>
            <CustomBarChart data={chartData} normalRanges={normalRanges} />
          </Box>

          <Box sx={{ 
            p: 2, 
            borderRadius: 1, 
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {generateExplanation(result)}
            </Typography>
          </Box>

          {result.stutterCount > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon sx={{ color: '#FF9800' }} />
              <Typography variant="body2" sx={{ color: '#FF9800' }}>
                Detected {result.stutterCount} speech irregularities
              </Typography>
            </Box>
          )}

          {result.microExpressionCount > 0 && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology sx={{ color: '#09c2f7' }} />
              <Typography variant="body2" sx={{ color: '#09c2f7' }}>
                Detected {result.microExpressionCount} micro-expressions
              </Typography>
            </Box>
          )}
        </Box>
      );
    })}
  </Box>
);

// LiarScore Component - Main Application Logic
const LiarScore = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('instructions');
  const [scenario, setScenario] = useState(null);
  const [likelihoodScore, setLikelihoodScore] = useState(null);
  const [testScores, setTestScores] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [difficulty, setDifficulty] = useState(null);
  const [mode, setMode] = useState(null);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isShowingResult, setIsShowingResult] = useState(false);
  const [questionResults, setQuestionResults] = useState([]);
  const [previousScores, setPreviousScores] = useState([]);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [isComputerSpeaking, setIsComputerSpeaking] = useState(false);
  const [hasStartedCurrentQuestion, setHasStartedCurrentQuestion] = useState(false);
  const [showResultsButton, setShowResultsButton] = useState(false);
  const [resultsButtonTimer, setResultsButtonTimer] = useState(3);
  const [canShowResults, setCanShowResults] = useState(false);
  const [nextQuestionTimer, setNextQuestionTimer] = useState(0);
  const [canProceedToNext, setCanProceedToNext] = useState(false);
  const toast = useToast();
  const faceScannerRef = useRef(null);

  const scenarios = {
    easy: [
      {
        prompt: "Someone finds a Reddit account with your name and 40,000 karma in r/AmITheAsshole",
        context: "Explain why it might *not* be you",
        category: "internet"
      },
      {
        prompt: "You're caught in a McDonald's bathroom filming yourself saying 'I am the Alpha'",
        context: "Justify what the video was *actually* for",
        category: "social"
      },
      {
        prompt: "Your AirPods auto-connect to a speaker and start blasting your voice memos titled 'Unhinged Rants'",
        context: "Explain who those were *really* for",
        category: "tech fail"
      },
      {
        prompt: "Your Notes app is leaked and includes a checklist titled 'Fake Personalities I Can Pull Off'",
        context: "Defend why this is a productivity strategy",
        category: "psych"
      },
      {
        prompt: "Your Uber driver recognizes you from a very niche meme account",
        context: "Explain what the account is and how you're involved",
        category: "internet"
      },
      {
        prompt: "Someone catches you googling 'how to win a fight without touching them'",
        context: "Explain why you were researching this",
        category: "bizarre"
      },
      {
        prompt: "You're found in public pretending to be on the phone to avoid someone",
        context: "Reveal what the fake convo was about",
        category: "social"
      },
      {
        prompt: "Your YouTube history is 90% 'villain speeches' and 'interrogation room breakdowns'",
        context: "Explain the phase you're going through",
        category: "media"
      }
    ],
    medium: [
      {
        prompt: "You get exposed for running 3 anonymous Twitter accounts that reply to your main",
        context: "Defend the accounts and their purpose",
        category: "internet"
      },
      {
        prompt: "Your group chat finds your AI-generated thirst trap edits of yourself",
        context: "Explain why you made them",
        category: "AI / tech"
      },
      {
        prompt: "Your friends find out you've been carrying around a fake book just for the aesthetic",
        context: "Justify the book and the performance",
        category: "pretentious"
      },
      {
        prompt: "Someone catches you recording yourself crying and then immediately smiling",
        context: "Explain what project this was for",
        category: "unhinged"
      },
      {
        prompt: "You're exposed for editing your BeReal timestamps to make your life look cooler",
        context: "Defend why authenticity was *overrated*",
        category: "social media"
      },
      {
        prompt: "You're caught selling your old voice memos as NFTs titled 'Mental Breakdown Vol. 1–5'",
        context: "Pitch it as performance art",
        category: "grift"
      },
      {
        prompt: "Your Notes app includes a document titled 'Revenge Masterplan (Theoretical)'",
        context: "Explain why it's not about anyone real",
        category: "dark"
      },
      {
        prompt: "You're found leading a Discord server called 'Exit Plan'",
        context: "Explain what the group is *really* about",
        category: "cult-y"
      }
    ],
    hard: [
      {
        prompt: "Your search history reveals you've been researching 'how to fake your own death'",
        context: "Explain why this is actually a creative writing project",
        category: "dark"
      },
      {
        prompt: "Someone finds your detailed notes on how to manipulate people's emotions",
        context: "Defend this as a psychology experiment",
        category: "psych"
      },
      {
        prompt: "You're caught creating fake social media accounts to boost your own popularity",
        context: "Justify this as a marketing strategy",
        category: "social media"
      },
      {
        prompt: "Your browser history shows you've been researching 'how to get away with murder'",
        context: "Explain this as research for a novel",
        category: "dark"
      },
      {
        prompt: "Someone discovers you've been recording private conversations without consent",
        context: "Defend this as a documentary project",
        category: "unhinged"
      },
      {
        prompt: "You're found with a detailed plan to ruin someone's reputation",
        context: "Explain this as a revenge plot for a movie script",
        category: "dark"
      },
      {
        prompt: "Your notes include a list of people's weaknesses and how to exploit them",
        context: "Justify this as character research",
        category: "psych"
      },
      {
        prompt: "You're caught creating fake evidence to frame someone",
        context: "Explain this as part of an art installation",
        category: "unhinged"
      }
    ]
  };

  const questions = {
    easy: [
      "Have you ever lied about your age to scam someone out of money?",
      "Have you ever cheated on a test and bragged about it to humiliate others?",
      "Have you ever faked a serious illness to ruin someone's plans?",
      "Have you ever stolen something valuable and blamed it on someone else?",
      "Have you ever lied to a friend to manipulate them into doing something wrong?",
      "Have you ever googled yourself to find and delete negative reviews?",
      "Have you ever been caught talking to yourself while plotting revenge?",
      "Have you ever liked your own post from a burner account to boost engagement?",
      "Have you ever fake laughed at someone's joke while planning their downfall?",
      "Have you ever taken a selfie during someone else's serious moment?",
      "Have you ever practiced an argument in the mirror to gaslight someone?",
      "Have you ever followed someone just to gather dirt on them?",
      "Have you ever hoped someone would get canceled for your benefit?",
      "Have you ever eaten food off the floor and served it to guests?",
      "Have you ever told someone they looked good just to manipulate them?",
      "Have you ever muted a close friend to avoid helping them?",
      "Have you ever recorded someone without consent for blackmail?",
      "Have you ever stalked someone to find their weaknesses?",
      "Have you ever imagined your own funeral to guilt-trip others?",
      "Have you ever joined a cause just to scam donations?"
    ],
    medium: [
      "Have you ever fabricated entire job experiences to scam a hiring manager?",
      "Have you ever cheated in a relationship and framed your partner for it?",
      "Have you ever stolen from work and sold the goods for profit?",
      "Have you ever lied to your parents about something that could ruin them?",
      "Have you ever pretended to be someone else online to catfish?",
      "Have you ever gotten back with an ex just to destroy their new relationship?",
      "Have you ever used someone for free food or rides while mocking them?",
      "Have you ever trauma-dumped to manipulate someone's emotions?",
      "Have you ever posted something just to make someone feel inferior?",
      "Have you ever ghosted someone you were still manipulating?",
      "Have you ever intentionally caused a scene to humiliate someone?",
      "Have you ever convinced someone they were wrong just to control them?",
      "Have you ever let someone take the blame for your serious mistake?",
      "Have you ever threatened to leak something to destroy someone?",
      "Have you ever lied about a mental illness to avoid consequences?",
      "Have you ever kept receipts just to blackmail someone later?",
      "Have you ever encouraged someone to do something dangerous for content?",
      "Have you ever secretly hoped a couple would break up for your gain?",
      "Have you ever faked being into someone to manipulate their friends?",
      "Have you ever made up a tragedy to scam attention or money?"
    ],
    hard: [
      "Have you ever cheated on a partner and exposed them to serious harm?",
      "Have you ever committed a felony and walked away scot-free?",
      "Have you ever lied under oath to destroy someone's life?",
      "Have you ever betrayed a close friend for personal gain?",
      "Have you ever hidden a serious secret that could harm your partner?",
      "Have you ever flirted with someone just to cause emotional damage?",
      "Have you ever ruined a relationship just to prove you could?",
      "Have you ever blackmailed someone with sensitive information?",
      "Have you ever made up a lie so big it destroyed someone's life?",
      "Have you ever hoped someone would fail so you could take advantage?",
      "Have you ever intentionally ruined someone's reputation permanently?",
      "Have you ever faked love to manipulate someone's emotions?",
      "Have you ever led multiple people on for your own entertainment?",
      "Have you ever recorded an intimate moment without consent?",
      "Have you ever sabotaged someone's career for personal gain?",
      "Have you ever lied about being assaulted to manipulate others?",
      "Have you ever taken advantage of someone while they were vulnerable?",
      "Have you ever pretended to care just to gather damaging information?",
      "Have you ever watched someone spiral and done nothing to help?",
      "Have you ever manipulated someone into loving you for your benefit?"
    ]
  };

  const getRandomScenario = (difficultyLevel) => {
    const availableScenarios = scenarios[difficultyLevel];
    const randomIndex = Math.floor(Math.random() * availableScenarios.length);
    return availableScenarios[randomIndex];
  };

  const getRandomQuestions = (difficultyLevel, count = 5) => {
    const availableQuestions = questions[difficultyLevel];
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setMode(null);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'scenario') {
      const newScenario = getRandomScenario(difficulty);
      setScenario(newScenario);
    } else if (newMode === 'question') {
      const randomQuestions = getRandomQuestions(difficulty, 5);
      setCurrentQuestions(randomQuestions);
      setCurrentQuestionIndex(0);
      setQuestionResults([]);
    }
  };

  const handleStartScanning = () => {
    if (!difficulty || !mode) {
      toast({
        title: 'Error',
        description: 'Please select a difficulty and mode',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setCurrentStep('scanning');
    if (mode === 'scenario') {
      speakText(`${scenario.prompt}\n\n${scenario.context}`);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      setIsComputerSpeaking(true);
      setShowResultsButton(false);
      setCanShowResults(false);
      
      utterance.onend = () => {
        setIsComputerSpeaking(false);
        setShowResultsButton(true);
        setCanShowResults(false);
        setResultsButtonTimer(3);
        
        const timer = setInterval(() => {
          setResultsButtonTimer(prev => {
            if (prev <= 1) {
              setCanShowResults(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      };
      
      utterance.onerror = () => {
        setIsComputerSpeaking(false);
        setShowResultsButton(true);
        setCanShowResults(true);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      console.log('Text-to-speech not supported');
      setShowResultsButton(true);
      setCanShowResults(true);
    }
  };

  const handleFaceDetected = (detected) => {
    setFaceDetected(detected);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsShowingResult(false);
      setHasStartedCurrentQuestion(false);
      setCanProceedToNext(false);
    } else {
      setCurrentStep('result');
    }
  };

  useEffect(() => {
    let collectionTimer;

    if (currentStep === 'scanning' && 
        isScannerReady && 
        faceDetected && 
        !isShowingResult && 
        !hasStartedCurrentQuestion) {
      
      if (faceScannerRef.current) {
        setHasStartedCurrentQuestion(true);
        faceScannerRef.current.startCollecting();
        
        if (mode === 'question') {
          speakText(currentQuestions[currentQuestionIndex]);
        }
        
        collectionTimer = setTimeout(() => {
          if (faceScannerRef.current) {
            faceScannerRef.current.stopCollecting();
          }
        }, 30000);
      }
    }

    return () => {
      if (collectionTimer) clearTimeout(collectionTimer);
    };
  }, [currentStep, mode, isScannerReady, currentQuestionIndex, isShowingResult, currentQuestions, faceDetected, hasStartedCurrentQuestion]);

  useEffect(() => {
    if (isShowingResult) {
      setNextQuestionTimer(3);
      setCanProceedToNext(false);
      const timer = setInterval(() => {
        setNextQuestionTimer(prev => {
          if (prev <= 1) {
            setCanProceedToNext(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isShowingResult]);

  const handleShowResults = () => {
    if (faceScannerRef.current && canShowResults) {
      faceScannerRef.current.stopCollecting();
      setIsShowingResult(true);
      setShowResultsButton(false);
      setCanShowResults(false);
    }
  };

  const handleScanningComplete = (result) => {
    if (mode === 'scenario') {
      setLikelihoodScore(result.finalLieScore);
      setTestScores({
        rmsMean: result.rmsMean,
        zcrMean: result.zcrMean,
        headMovementVariance: result.headMovementVariance,
        smileIntensityVariance: result.smileIntensityVariance,
        gazeAwayPercentage: result.gazeAwayPercentage,
        microExpressionCount: result.microExpressionCount,
        rmsStd: result.rmsStd,
        zcrStd: result.zcrStd,
      });
      setPreviousScores(prev => [
        ...prev,
        { score: result.finalLieScore, scenario: scenario, timestamp: new Date().toISOString() }
      ].slice(-5));
      setCurrentStep('result');
    } else if (mode === 'question') {
      const currentQuestion = currentQuestions[currentQuestionIndex];
      setQuestionResults(prev => [...prev, { question: currentQuestion, ...result }]);
    }
  };

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)',
        color: '#fff',
        py: 8,
        position: 'relative',
      }}
    >
      <TopBar />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 'xl', mx: 'auto' }}>
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
            <AnalyzingText>
              Analyzing Results
            </AnalyzingText>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {loadingProgress}%
            </Typography>
          </LoadingAnimation>
        ) : (
          <>
            {currentStep === 'instructions' && (
              <Box sx={{ my: 8, textAlign: 'center' }}>
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
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#fff', 
                      mb: 2,
                      background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
                    }}
                  >
                    Select Difficulty
                  </Typography>
                  <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '800px', mx: 'auto' }}>
                    {[
                      { value: 'easy', label: 'Easy', icon: <SentimentSatisfied />, description: 'Simple scenarios and questions' },
                      { value: 'medium', label: 'Medium', icon: <SentimentNeutral />, description: 'Moderate complexity' },
                      { value: 'hard', label: 'Hard', icon: <SentimentDissatisfied />, description: 'Challenging scenarios' }
                    ].map((option) => (
                      <Grid item xs={12} sm={6} md={4} key={option.value}>
                        <GlassCard
                          onClick={() => handleDifficultyChange(option.value)}
                          sx={{
                            cursor: 'pointer',
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: difficulty === option.value ? '2px solid #09c2f7' : '1px solid rgba(250, 14, 164, 0.2)',
                            boxShadow: difficulty === option.value ? '0 0 20px rgba(9, 194, 247, 0.3)' : 'none',
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
                              mb: 1
                            }}
                          >
                            {option.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              textAlign: 'center',
                              fontSize: '0.875rem'
                            }}
                          >
                            {option.description}
                          </Typography>
                        </GlassCard>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                {difficulty && (
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#fff', 
                        mb: 2,
                        background: 'linear-gradient(45deg, #6ce9ff 30%, #09c2f7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
                      }}
                    >
                      Select Mode
                    </Typography>
                    <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '800px', mx: 'auto' }}>
                      {[
                        { value: 'scenario', label: 'Scenario Based', icon: <Psychology />, description: 'Respond to unique scenarios' },
                        { value: 'question', label: 'Question Based', icon: <RemoveRedEye />, description: 'Answer specific questions' }
                      ].map((option) => (
                        <Grid item xs={12} sm={6} key={option.value}>
                          <GlassCard
                            onClick={() => handleModeChange(option.value)}
                            sx={{
                              cursor: 'pointer',
                              p: 3,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: mode === option.value ? '2px solid #09c2f7' : '1px solid rgba(250, 14, 164, 0.2)',
                              boxShadow: mode === option.value ? '0 0 20px rgba(9, 194, 247, 0.3)' : 'none',
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
                                mb: 1
                              }}
                            >
                              {option.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.7)',
                                textAlign: 'center',
                                fontSize: '0.875rem'
                              }}
                            >
                              {option.description}
                            </Typography>
                          </GlassCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                <GradientButton onClick={handleStartScanning} disabled={!difficulty || !mode}>
                  Start Speaking
                </GradientButton>
              </Box>
            )}

            {currentStep === 'scanning' && (
              <Box sx={{ my: 8 }}>
                {mode === 'question' && isShowingResult ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Result for: {questionResults[questionResults.length - 1].question}
                    </Typography>
                    <DetailedResultDisplay 
                      overallPercentage={questionResults[questionResults.length - 1].finalLieScore} 
                      testScores={questionResults[questionResults.length - 1]}
                    />
                    <GradientButton 
                      onClick={handleNextQuestion}
                      disabled={!canProceedToNext}
                      sx={{ mt: 4 }}
                    >
                      {canProceedToNext ? 
                        (currentQuestionIndex < currentQuestions.length - 1 ? 'Next Question' : 'View Full Results') :
                        `Loading next question in ${nextQuestionTimer}s`
                      }
                    </GradientButton>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative' }}>
                    <FaceScanner
                      startScanning={true}
                      onScanningComplete={handleScanningComplete}
                      onFaceDetected={handleFaceDetected}
                      currentPrompt={mode === 'scenario' ? scenario : (mode === 'question' && isScannerReady ? currentQuestions[currentQuestionIndex] : 'Loading face detection...')}
                      showDoneButton={mode === 'scenario'}
                      ref={faceScannerRef}
                      onReady={() => setIsScannerReady(true)}
                      isComputerSpeaking={isComputerSpeaking}
                    />
                    {showResultsButton && (
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: '20%', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        zIndex: 3,
                        textAlign: 'center',
                      }}>
                        <GradientButton 
                          onClick={handleShowResults}
                          disabled={!canShowResults}
                          sx={{ 
                            minWidth: '200px',
                            fontSize: '1.2rem',
                            py: 1.5,
                            opacity: canShowResults ? 1 : 0.7,
                            position: 'relative',
                          }}
                        >
                          {canShowResults ? 'See Results' : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress
                                size={20}
                                thickness={4}
                                sx={{ color: 'white' }}
                                variant="determinate"
                                value={(3 - resultsButtonTimer) * (100 / 3)}
                              />
                              <Typography>
                                {resultsButtonTimer}s
                              </Typography>
                            </Box>
                          )}
                        </GradientButton>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {currentStep === 'result' && (
              <Box sx={{ py: 8 }}>
                {mode === 'scenario' ? (
                  <DetailedResultDisplay 
                    overallPercentage={likelihoodScore} 
                    testScores={testScores}
                    previousScores={previousScores}
                    scenario={scenario}
                  />
                ) : (
                  <QuestionResultsDisplay questionResults={questionResults} />
                )}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <GradientButton onClick={() => setCurrentStep('instructions')}>
                    Try Again
                  </GradientButton>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default LiarScore;