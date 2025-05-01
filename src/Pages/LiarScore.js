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
  zIndex: 3,
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
    { label: 'Pitch Change', value: features.pitchChangeRate * 100, icon: <Psychology />, max: 100, normal: 50, unit: '%' },
    { label: 'Intensity', value: features.rmsMean * 1000, icon: <Person />, max: 100, normal: 70, unit: '' },
    { label: 'Head Movement', value: features.headMovementVariance * 10, icon: <Face />, max: 100, normal: 50, unit: '' },
    { label: 'Smile Intensity', value: features.smileIntensityVariance * 100, icon: <SentimentSatisfied />, max: 100, normal: 70, unit: '%' },
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

// FaceScanner Component - Enhanced Lie Detection with Imperative Handle
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
      const smileScore = (baseRatio * 0.4) + (cornerLift * 0.6);
      return Math.min(Math.max(smileScore / 50, 0), 1);
    } catch (e) {
      console.error('Error calculating smile intensity:', e);
      return 0;
    }
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
    const audioFeatures = audioFeaturesRef.current;
    const headMovements = headMovementRef.current;
    const smileIntensities = smileIntensityRef.current;
    const gazeHistory = gazeHistoryRef.current;

    const rmsMean = audioFeatures.map((f) => f.rms).reduce((sum, r) => sum + r, 0) / audioFeatures.length || 0;
    const zcrMean = audioFeatures.map((f) => f.zcr).reduce((sum, z) => sum + z, 0) / audioFeatures.length || 0;
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

    let lieScore = 0;
    let totalWeight = 0;

    if (rmsMean > 0.15) lieScore += 20;
    else if (rmsMean > 0.1) lieScore += 10;
    totalWeight += 0.2;

    if (zcrMean > 0.15) lieScore += 15;
    else if (zcrMean > 0.1) lieScore += 8;
    totalWeight += 0.15;

    if (headMovementVariance > 8) lieScore += 10;
    else if (headMovementVariance > 5) lieScore += 5;
    totalWeight += 0.1;

    if (smileIntensityVariance > 0.15) lieScore += 10;
    else if (smileIntensityVariance > 0.1) lieScore += 5;
    totalWeight += 0.1;

    const finalLieScore = Math.min((lieScore / totalWeight), 100);

    return { finalLieScore, rmsMean, zcrMean, headMovementVariance, smileIntensityVariance, gazeAwayPercentage };
  };

  useImperativeHandle(ref, () => ({
    startCollecting: () => {
      setIsCollecting(true);
      earHistoryRef.current = [];
      audioFeaturesRef.current = [];
      headMovementRef.current = [];
      smileIntensityRef.current = [];
      gazeHistoryRef.current = [];
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

            // Initialize default features
            const defaultFeatures = {
              pitchChangeRate: 0,
              rmsMean: 0,
              headMovementVariance: 0,
              smileIntensityVariance: 0
            };

            if (!isComputerSpeaking) {
              let sum = 0;
              let silentSamples = 0;
              const silenceThreshold = 0.01;

              for (let i = 0; i < bufferLength; i++) {
                const amplitude = Math.abs(dataArray[i]);
                if (amplitude < silenceThreshold) {
                  silentSamples++;
                }
                sum += amplitude;
              }

              const silenceRatio = silentSamples / bufferLength;
              let rms = 0;
              if (silenceRatio < 0.95) {
                rms = Math.sqrt(sum / bufferLength) * 2;
                rms = Math.min(rms * 100, 1);
              }

              let zcr = 0;
              for (let i = 1; i < bufferLength; i++) {
                if ((dataArray[i - 1] >= 0 && dataArray[i] < 0) || (dataArray[i - 1] < 0 && dataArray[i] >= 0)) {
                  zcr += 1;
                }
              }
              zcr /= bufferLength;

              audioFeaturesRef.current.push({ rms, zcr });

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
            } else {
              setCurrentFeatures(defaultFeatures);
            }
          }
        } catch (error) {
          console.error('Error drawing face mesh:', error);
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
      {faceDetected && isCollecting && <AudioWaveform analyser={analyserRef.current} />}
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
    ...testScores
  };

  const chartData = [
    { label: 'Voice Intensity', value: (safeTestScores.rmsMean || 0) * 1000, max: 100 },
    { label: 'Zero-Crossing Rate', value: (safeTestScores.zcrMean || 0) * 100, max: 100 },
    { label: 'Head Movement', value: (safeTestScores.headMovementVariance || 0) * 10, max: 100 },
    { label: 'Smile Intensity', value: (safeTestScores.smileIntensityVariance || 0) * 100, max: 100 },
  ];

  const normalRanges = [50, 50, 50, 70];

  const getRatingExplanation = (label, value, max) => {
    const percentage = (value / max) * 100;
    let explanation = '';
    let color = '#4CAF50';

    switch (label) {
      case 'Voice Intensity':
        if (value > 80) {
          explanation = 'Very high intensity. Suggests overcompensation.';
          color = '#F44336';
        } else if (value > 50) {
          explanation = 'Elevated intensity. Could indicate stress.';
          color = '#FF9800';
        } else {
          explanation = 'Normal intensity. Natural speaking pattern.';
        }
        break;
      case 'Zero-Crossing Rate':
        if (value > 80) {
          explanation = 'Very unstable speech. Indicates nervousness.';
          color = '#F44336';
        } else if (value > 50) {
          explanation = 'Some instability. May suggest discomfort.';
          color = '#FF9800';
        } else {
          explanation = 'Stable speech. Natural rhythm.';
        }
        break;
      case 'Head Movement':
        if (value > 80) {
          explanation = 'Excessive movement. Indicates stress.';
          color = '#F44336';
        } else if (value > 50) {
          explanation = 'Increased movement. May suggest nervousness.';
          color = '#FF9800';
        } else {
          explanation = 'Natural movement. Comfortable behavior.';
        }
        break;
      case 'Smile Intensity':
        if (value > 80) {
          explanation = 'Unnatural variations. Suggests forced expressions.';
          color = '#F44336';
        } else if (value > 70) {
          explanation = 'Some instability. May indicate discomfort.';
          color = '#FF9800';
        } else {
          explanation = 'Natural smiles. Genuine expressions.';
        }
        break;
    }
    return { explanation, color };
  };

  const generateExplanation = (scores) => {
    const explanations = [];
    const confidenceLevels = [];
    
    if (scores.rmsMean > 0.15) {
      explanations.push('Your voice showed high intensity, suggesting overcompensation.');
      confidenceLevels.push(0.7);
    }

    if (scores.zcrMean > 0.15) {
      explanations.push('Your speech had rapid tone changes, indicating uncertainty.');
      confidenceLevels.push(0.8);
    }

    if (scores.headMovementVariance > 8) {
      explanations.push('Your head moved significantly, suggesting stress.');
      confidenceLevels.push(0.8);
    }

    if (scores.smileIntensityVariance > 0.25) {
      explanations.push('Your smile showed unnatural changes, suggesting forced expressions.');
      confidenceLevels.push(0.7);
    }

    const avgConfidence = confidenceLevels.length > 0 
      ? confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length 
      : 0;
    const confidenceText = avgConfidence > 0.8 ? 'with high confidence' : avgConfidence > 0.6 ? 'with moderate confidence' : 'with some confidence';

    return explanations.length > 0 
      ? `Our analysis found ${confidenceText}: ${explanations.join('. ')}.` 
      : 'Your responses showed natural patterns with no significant deception indicators.';
  };

  let tierLabel, tierEmoji;
  if (overallPercentage >= 70) {
    tierLabel = 'High Likelihood of Lying';
    tierEmoji = <SentimentDissatisfied />;
  } else if (overallPercentage >= 40) {
    tierLabel = 'Moderate Likelihood of Lying';
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
      return (
        <Box key={index} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
          <Typography variant="body1">{result.question}</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: getTierColor(result.finalLieScore) }}>
            Lie Likelihood: {result.finalLieScore.toFixed(0)}%
          </Typography>
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
  const toast = useToast();
  const faceScannerRef = useRef(null);

  const scenarios = {
    easy: [
      { prompt: "Your boss finds your 'How to Quit Your Job' search history on the work computer", context: "Explain why you were looking this up", category: "work" },
      { prompt: "Your roommate discovers you've been using their toothbrush", context: "Make up a story about why you needed to use it", category: "social" },
    ],
    medium: [
      { prompt: "Your boss discovers you've been working remotely from a beach in Mexico", context: "Explain why you needed to work from there", category: "work" },
      { prompt: "Your partner finds your secret Instagram account", context: "Make up a story about why you needed it", category: "social" },
    ],
    hard: [
      { prompt: "Your boss discovers you've been running a competing business", context: "Explain why you started this business", category: "work" },
      { prompt: "Your partner finds evidence of a secret relationship", context: "Make up a story about why you kept it secret", category: "social" },
    ]
  };

  const questions = {
    easy: [
      "Have you ever lied about your age?",
      "Have you ever cheated on a test?",
      "Have you ever pretended to be sick to avoid something?",
      "Have you ever stolen something small?",
      "Have you ever lied to a friend to avoid hurting their feelings?"
    ],
    medium: [
      "Have you ever lied on your resume?",
      "Have you ever cheated in a relationship?",
      "Have you ever stolen from work?",
      "Have you ever lied to your parents about something important?",
      "Have you ever pretended to be someone else online?"
    ],
    hard: [
      "Have you cheated on your ex?",
      "Have you ever committed a crime?",
      "Have you ever lied under oath?",
      "Have you ever betrayed a close friend?",
      "Have you ever hidden a serious secret from your partner?"
    ]
  };

  const getRandomScenario = (difficultyLevel) => {
    const availableScenarios = scenarios[difficultyLevel];
    const randomIndex = Math.floor(Math.random() * availableScenarios.length);
    return availableScenarios[randomIndex];
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
      setCurrentQuestions(questions[difficulty]);
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
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      setIsComputerSpeaking(true);
      
      utterance.onend = () => {
        setIsComputerSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsComputerSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      console.log('Text-to-speech not supported');
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
    } else {
      setCurrentStep('result');
    }
  };

  useEffect(() => {
    let speechEndTimer;
    let collectionTimer;

    if (currentStep === 'scanning' && 
        mode === 'question' && 
        isScannerReady && 
        faceDetected && 
        currentQuestionIndex < currentQuestions.length && 
        !isShowingResult && 
        !hasStartedCurrentQuestion) {
      
      if (faceScannerRef.current) {
        setHasStartedCurrentQuestion(true);
        faceScannerRef.current.startCollecting();
        speakText(currentQuestions[currentQuestionIndex]);
        
        // Show results button immediately after starting to speak
        setShowResultsButton(true);
        
        // Set up a timer to stop collecting if user hasn't clicked after 30 seconds
        collectionTimer = setTimeout(() => {
          if (faceScannerRef.current) {
            faceScannerRef.current.stopCollecting();
          }
        }, 30000); // Stop collecting after 30 seconds if user hasn't clicked
      }
    }

    return () => {
      if (speechEndTimer) clearInterval(speechEndTimer);
      if (collectionTimer) clearTimeout(collectionTimer);
    };
  }, [currentStep, mode, isScannerReady, currentQuestionIndex, isShowingResult, currentQuestions, faceDetected, hasStartedCurrentQuestion]);

  const handleShowResults = () => {
    if (faceScannerRef.current) {
      faceScannerRef.current.stopCollecting();
    }
    setIsShowingResult(true);
    setShowResultsButton(false);
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
                width: '100%',
                maxWidth: '400px',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${loadingProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
                  transition: 'width 0.1s ease-out',
                }}
              />
            </Box>
            <AnalyzingText>Analyzing Results</AnalyzingText>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {loadingProgress}%
            </Typography>
          </LoadingAnimation>
        ) : (
          <>
            {currentStep === 'instructions' && (
              <Box sx={{ my: 8, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 4 }}>
                  Lie Detector Scan
                </Typography>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    Select Difficulty
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                    <Button
                      variant={difficulty === 'easy' ? 'contained' : 'outlined'}
                      onClick={() => handleDifficultyChange('easy')}
                      sx={{ color: difficulty === 'easy' ? '#fff' : '#09c2f7', borderColor: '#09c2f7', '&:hover': { borderColor: '#fa0ea4' } }}
                    >
                      Easy
                    </Button>
                    <Button
                      variant={difficulty === 'medium' ? 'contained' : 'outlined'}
                      onClick={() => handleDifficultyChange('medium')}
                      sx={{ color: difficulty === 'medium' ? '#fff' : '#09c2f7', borderColor: '#09c2f7', '&:hover': { borderColor: '#fa0ea4' } }}
                    >
                      Medium
                    </Button>
                    <Button
                      variant={difficulty === 'hard' ? 'contained' : 'outlined'}
                      onClick={() => handleDifficultyChange('hard')}
                      sx={{ color: difficulty === 'hard' ? '#fff' : '#09c2f7', borderColor: '#09c2f7', '&:hover': { borderColor: '#fa0ea4' } }}
                    >
                      Hard
                    </Button>
                  </Box>
                </Box>
                {difficulty && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                      Select Mode
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                      <Button
                        variant={mode === 'scenario' ? 'contained' : 'outlined'}
                        onClick={() => handleModeChange('scenario')}
                        sx={{ color: mode === 'scenario' ? '#fff' : '#09c2f7', borderColor: '#09c2f7', '&:hover': { borderColor: '#fa0ea4' } }}
                      >
                        Scenario Based
                      </Button>
                      <Button
                        variant={mode === 'question' ? 'contained' : 'outlined'}
                        onClick={() => handleModeChange('question')}
                        sx={{ color: mode === 'question' ? '#fff' : '#09c2f7', borderColor: '#09c2f7', '&:hover': { borderColor: '#fa0ea4' } }}
                      >
                        Question Based
                      </Button>
                    </Box>
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
                      sx={{ mt: 4 }}
                    >
                      {currentQuestionIndex < currentQuestions.length - 1 ? 'Next Question' : 'See Final Results'}
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
                          sx={{ 
                            minWidth: '200px',
                            fontSize: '1.2rem',
                            py: 1.5,
                          }}
                        >
                          See Results
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