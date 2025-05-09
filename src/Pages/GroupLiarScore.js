import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  IconButton,
  TextField,
  keyframes,
  styled,
  Paper
} from '@mui/material';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '@chakra-ui/toast';
import {
  CheckCircle,
  Error,
  Close,
  MicOff,
  Mic,
  Videocam,
  VideocamOff,
  ContentCopy,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import useVideoStream from '../hooks/useVideoStream';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const StyledButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  animation: `${gradientFlow} 6s ease infinite`,
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
  borderRadius: '24px',
  overflow: 'hidden',
  background: 'linear-gradient(45deg, rgba(13, 17, 44, 0.7), rgba(102, 4, 62, 0.7))',
  backdropFilter: 'blur(16px)',
}));

const FaceScannerCanvas = ({ videoId, onScanningComplete, isTurnToSpeak, sessionId }) => {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const featureHistoryRef = useRef([]);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechStartTime, setSpeechStartTime] = useState(null);
  const [speechEndTime, setSpeechEndTime] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [responseLength, setResponseLength] = useState(0);
  const [speechRate, setSpeechRate] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [pauseDuration, setPauseDuration] = useState(0);
  const [lastSpeechTime, setLastSpeechTime] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [repetitionCount, setRepetitionCount] = useState(0);
  const [lastWords, setLastWords] = useState([]);
  const [prevHeadPosition, setPrevHeadPosition] = useState(null);
  const [prevEyePosition, setPrevEyePosition] = useState(null);
  const [smoothedFeatures, setSmoothedFeatures] = useState({
    voiceIntensity: 0,
    zcr: 0,
    headMovement: 0,
    eyeMovement: 0,
    lipTension: 0
  });
  const toast = useToast();

  const weights = {
    headMovement: 2.0,
    eyeMovement: 2.0,
    fillerWords: 1.5,
    repetitions: 1.5,
    pauseCount: 1.3,
    confidence: -1.5,
    voiceIntensity: 1.0,
    lipTension: 1.4,
    zcr: 1.0,
    responseLength: 0.9,
    speechRate: 0.9
  };

  const leftEyeIndices = [33, 160, 158, 133, 153, 144];
  const noseIndices = [1, 2, 98, 327];

  const calculateDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
  };

  const calculateEyeCenter = (landmarks, indices) => {
    try {
      const points = indices.map(i => landmarks[i]);
      const centerX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p[1], 0) / points.length;
      return [centerX, centerY];
    } catch (e) {
      console.error('Error calculating eye center:', e);
      return [0, 0];
    }
  };

  const calculateHeadPosition = (landmarks) => {
    try {
      const nosePoints = noseIndices.map(i => landmarks[i]);
      const centerX = nosePoints.reduce((sum, p) => sum + p[0], 0) / nosePoints.length;
      const centerY = nosePoints.reduce((sum, p) => sum + p[1], 0) / nosePoints.length;
      return [centerX, centerY];
    } catch (e) {
      console.error('Error calculating head position:', e);
      return [0, 0];
    }
  };

  const calculateLipTension = (landmarks) => {
    try {
      const upperLip = landmarks[13];
      const lowerLip = landmarks[14];
      return calculateDistance(upperLip, lowerLip);
    } catch (e) {
      console.error('Error calculating lip tension:', e);
      return 0;
    }
  };

  const calculateScore = () => {
    try {
      const featureMeans = {
        rms: featureHistoryRef.current.map(f => f.rms).reduce((sum, v) => sum + v, 0) / featureHistoryRef.current.length,
        zcr: featureHistoryRef.current.map(f => f.zcr).reduce((sum, v) => sum + v, 0) / featureHistoryRef.current.length,
        headMovement: featureHistoryRef.current.map(f => f.headMovement).reduce((sum, v) => sum + v, 0) / featureHistoryRef.current.length,
        eyeMovement: featureHistoryRef.current.map(f => f.eyeMovement).reduce((sum, v) => sum + v, 0) / featureHistoryRef.current.length,
        lipTension: featureHistoryRef.current.map(f => f.lipTension).reduce((sum, v) => sum + v, 0) / featureHistoryRef.current.length,
      };

      const confidenceFactors = {
        responseLength: Math.min(responseLength / 100, 1),
        speechRate: Math.min(speechRate / 3, 1),
        pauseCount: Math.max(0, 1 - (pauseCount / 5)),
        fillerWords: Math.max(0, 1 - (fillerWordCount / 5)),
        repetitions: Math.max(0, 1 - (repetitionCount / 3)),
      };

      const confidenceScore = Object.values(confidenceFactors).reduce((sum, val) => sum + val, 0) / Object.keys(confidenceFactors).length;
      setConfidenceScore(confidenceScore);

      const normalizedFeatures = {
        voiceIntensity: Math.min(featureMeans.rms / 0.025, 1),
        zcr: Math.min(featureMeans.zcr / 0.2, 1),
        headMovement: Math.min(featureMeans.headMovement / 2.0, 1),
        eyeMovement: Math.min(featureMeans.eyeMovement / 0.3, 1),
        lipTension: Math.min(featureMeans.lipTension / 0.35, 1),
        responseLength: Math.min(responseLength / 200, 1),
        speechRate: Math.min(speechRate / 3, 1),
        pauseCount: Math.min(pauseCount / 5, 1),
        fillerWords: Math.min(fillerWordCount / 5, 1),
        repetitions: Math.min(repetitionCount / 3, 1),
        confidence: confidenceScore
      };

      const bias = -3.5;
      const weightedSum = bias + Object.keys(normalizedFeatures).reduce((sum, key) => 
        sum + weights[key] * normalizedFeatures[key], 0
      );
      const lieProbability = 1 / (1 + Math.exp(-weightedSum));
      const finalLieScore = Math.round(lieProbability * 100);

      return {
        finalLieScore,
        lieProbability,
        normalizedFeatures,
        metrics: {
          responseLength,
          speechRate,
          wordCount,
          pauseCount,
          pauseDuration,
          fillerWordCount,
          repetitionCount,
          confidenceScore
        }
      };
    } catch (error) {
      console.error('Error in score calculation:', error);
      return {
        finalLieScore: 0,
        lieProbability: 0,
        normalizedFeatures: {},
        metrics: {}
      };
    }
  };

  const handleDoneSpeaking = () => {
    setIsCollecting(false);
    setIsProcessing(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    const result = calculateScore();
    setIsProcessing(false);
    
    setPrediction(result.finalLieScore >= 55 ? 'LIE' : 'TRUTH');
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      onScanningComplete(result);
    }, 3000);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setSpeechStartTime(Date.now());
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        const words = transcript.trim().split(/\s+/);
        setWordCount(words.length);
        setResponseLength(transcript.length);

        const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'actually'];
        const fillerCount = words.filter(word => 
          fillerWords.includes(word.toLowerCase())
        ).length;
        setFillerWordCount(fillerCount);

        const currentWords = words.slice(-5);
        if (lastWords.length > 0) {
          const repetitions = currentWords.filter(word => 
            lastWords.includes(word)
          ).length;
          setRepetitionCount(prev => prev + repetitions);
        }
        setLastWords(currentWords);

        const currentTime = Date.now();
        if (speechStartTime) {
          const duration = (currentTime - speechStartTime) / 1000;
          setSpeechRate(words.length / duration);
        }

        if (lastSpeechTime) {
          const pauseTime = currentTime - lastSpeechTime;
          if (pauseTime > 1000) {
            setPauseCount(prev => prev + 1);
            setPauseDuration(prev => prev + pauseTime);
          }
        }
        setLastSpeechTime(currentTime);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setSpeechEndTime(Date.now());
      };
    }
  }, []);

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
      console.error('Failed to load FaceMesh model:', err);
      toast({ title: 'Error', description: 'Failed to load FaceMesh model', status: 'error', duration: 5000 });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const videoElement = document.getElementById(videoId);
    if (!videoElement) return;
    videoRef.current = videoElement;

    const handleVideoLoaded = () => {
      setVideoLoaded(true);
      const stream = videoElement.srcObject;
      if (stream) {
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
        }
      }
    };

    const handleDoneSpeakingEvent = (event) => {
      if (event.detail.sessionId === sessionId) {
        handleDoneSpeaking();
      }
    };

    videoElement.addEventListener('loadeddata', handleVideoLoaded);
    videoElement.addEventListener('doneSpeaking', handleDoneSpeakingEvent);
    if (videoElement.readyState >= 3) handleVideoLoaded();

    return () => {
      videoElement.removeEventListener('loadeddata', handleVideoLoaded);
      videoElement.removeEventListener('doneSpeaking', handleDoneSpeakingEvent);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [videoId, sessionId]);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      await loadModel();
    };
    initialize();
    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isTurnToSpeak && faceDetected && !isCollecting && !isProcessing && !showResult) {
      setIsCollecting(true);
      featureHistoryRef.current = [];
      setSmoothedFeatures({ voiceIntensity: 0, zcr: 0, headMovement: 0, eyeMovement: 0, lipTension: 0 });
      setPrevHeadPosition(null);
      setPrevEyePosition(null);
      setWordCount(0);
      setResponseLength(0);
      setFillerWordCount(0);
      setRepetitionCount(0);
      setPauseCount(0);
      setPauseDuration(0);
      setLastSpeechTime(null);
      setSpeechStartTime(null);
      setSpeechEndTime(null);
      setLastWords([]);
      setConfidenceScore(0);
      if (recognitionRef.current) recognitionRef.current.start();
    } else if (!isTurnToSpeak && isCollecting) {
      setIsCollecting(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [isTurnToSpeak, faceDetected, isCollecting, isProcessing, showResult]);

  useEffect(() => {
    if (!model || !videoLoaded || !analyserRef.current) return;

    const detectFaceAndRunTest = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const videoRect = video.getBoundingClientRect();
      canvas.width = videoRect.width;
      canvas.height = videoRect.height;

      const predictions = await model.estimateFaces(video);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        setFaceDetected(true);
        const landmarks = predictions[0].scaledMesh;
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        const currentHeadPosition = calculateHeadPosition(landmarks);
        const currentEyePosition = calculateEyeCenter(landmarks, leftEyeIndices);
        const currentLipTension = calculateLipTension(landmarks);

        let currentHeadMovement = 0;
        if (prevHeadPosition) {
          currentHeadMovement = calculateDistance(currentHeadPosition, prevHeadPosition);
        }
        setPrevHeadPosition(currentHeadPosition);

        let currentEyeMovement = 0;
        if (prevEyePosition) {
          currentEyeMovement = calculateDistance(currentEyePosition, prevEyePosition);
        }
        setPrevEyePosition(currentEyePosition);

        const analyser = analyserRef.current;
        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] ** 2;
        }
        const currentRMS = Math.sqrt(sum / bufferLength);

        let zcr = 0;
        for (let i = 1; i < bufferLength; i++) {
          if ((dataArray[i - 1] >= 0 && dataArray[i] < 0) || (dataArray[i - 1] < 0 && dataArray[i] >= 0)) {
            zcr += 1;
          }
        }
        const currentZCR = zcr / bufferLength;

        const alpha = 0.1;
        setSmoothedFeatures(prev => ({
          voiceIntensity: alpha * currentRMS + (1 - alpha) * prev.voiceIntensity,
          zcr: alpha * currentZCR + (1 - alpha) * prev.zcr,
          headMovement: alpha * currentHeadMovement + (1 - alpha) * prev.headMovement,
          eyeMovement: alpha * currentEyeMovement + (1 - alpha) * prev.eyeMovement,
          lipTension: alpha * currentLipTension + (1 - alpha) * prev.lipTension
        }));

        if (isCollecting) {
          featureHistoryRef.current.push({
            rms: currentRMS,
            zcr: currentZCR,
            headMovement: currentHeadMovement,
            eyeMovement: currentEyeMovement,
            lipTension: currentLipTension,
          });
        }

        context.save();
        if (showResult) {
          context.strokeStyle = prediction === 'LIE' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
          context.lineWidth = 2;
          context.font = 'bold 80px Arial';
          context.fillStyle = prediction === 'LIE' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(prediction, canvas.width / 2, canvas.height / 2);
        } else {
          context.strokeStyle = 'rgba(9, 194, 247, 0.1)';
          context.lineWidth = 1;
        }

        context.beginPath();
        for (let i = 0; i < landmarks.length; i++) {
          const point = landmarks[i];
          if (!point || !Array.isArray(point) || point.length < 2) continue;
          const [x, y] = point;
          const scaledX = x * scaleX;
          const scaledY = y * scaleY;
          if (i === 0) {
            context.moveTo(scaledX, scaledY);
          } else {
            context.lineTo(scaledX, scaledY);
          }
        }
        context.stroke();
        context.restore();
      } else {
        setFaceDetected(false);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 100);
    return () => clearInterval(intervalRef.current);
  }, [model, videoLoaded, isCollecting, showResult, prediction]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
          borderRadius: '24px'
        }}
      />
      {isLoading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(9, 194, 247, 0.3)',
          zIndex: 20
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 600 }}>
            Loading Face Detection... {loadingProgress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

function GroupLiarScore() {
  const { user, loading: authLoading } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [currentQuestionResults, setCurrentQuestionResults] = useState({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const sessionIdRef = useRef(null);
  const peersRef = useRef({});
  const localVideoRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { stream: localStream, error: streamError } = useVideoStream();
  const [remoteStreams, setRemoteStreams] = useState({});
  const [userDisplayName, setUserDisplayName] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [hasPerson1Spoken, setHasPerson1Spoken] = useState(false);
  const countdownRef = useRef(null);

  // Add useEffect to fetch user display name
  useEffect(() => {
    const fetchUserDisplayName = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserDisplayName(userDoc.data().displayName);
          }
        } catch (err) {
          console.error('Error fetching user display name:', err);
        }
      }
    };
    fetchUserDisplayName();
  }, [user]);

  // Move all useEffect hooks here, before any conditional returns
  useEffect(() => {
    if (streamError) {
      setError(`Camera error: ${streamError.message}`);
    }
  }, [streamError]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => {
        console.error('Error playing local video:', err);
        setError('Failed to play video stream');
      });
    }
  }, [localStream, isInRoom]);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      const roomData = docSnap.data();
      if (roomData) {
        setParticipants(roomData.participants);
        setCurrentQuestions(roomData.questions || []);
        setCurrentQuestionIndex(roomData.currentQuestionIndex || 0);
        setCurrentSpeakerIndex(roomData.currentSpeakerIndex || 0);
        const currentParticipantKeys = roomData.participants.map(p => `${p.userId}-${p.sessionId}`);
        Object.keys(peersRef.current).forEach((peerKey) => {
          if (!currentParticipantKeys.includes(peerKey)) {
            peersRef.current[peerKey].destroy();
            delete peersRef.current[peerKey];
          }
        });
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    setCurrentQuestionResults({});
  }, [currentQuestionIndex]);

  // Add useEffect for countdown
  useEffect(() => {
    if (participants.length === 2 && !gameStarted && !countdown) {
      setCountdown(10);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            handleStartGame();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [participants.length, gameStarted]);

  // Add useEffect for game state
  useEffect(() => {
    if (!roomId) return;
    
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribeRoom = onSnapshot(roomRef, async (docSnap) => {
      const roomData = docSnap.data();
      if (roomData && roomData.gameStateId) {
        // Subscribe to game state updates
        const gameStateRef = doc(db, 'gameStates', roomData.gameStateId);
        const unsubscribeGameState = onSnapshot(gameStateRef, (gameStateSnap) => {
          const gameState = gameStateSnap.data();
          if (gameState) {
            setGameStarted(gameState.gameStarted);
            setCurrentQuestions(gameState.questions || []);
            setCurrentQuestionIndex(gameState.currentQuestionIndex || 0);
            setCurrentSpeakerIndex(gameState.currentSpeakerIndex || 0);
          }
        });

        return () => {
          unsubscribeGameState();
        };
      }
    });

    return () => {
      unsubscribeRoom();
    };
  }, [roomId]);

  // Early return for loading state
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `
            radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
            linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
          `,
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // Early return for no user
  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `
            radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
            linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
          `,
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Please sign in to access this feature
        </Typography>
      </Box>
    );
  }

  const questions = [
    { text: "Have you ever pissed yourself in public and tried to play it off?" },
    { text: "Ever stolen cash from a friend's bag while they were blacked out?" },
    { text: "Ever pretended to get a text mid-convo just to avoid saying hi?" },
    { text: "Ever stared at a classmate's butt and mentally slapped yourself after?" },
    { text: "Ever smashed in a bathroom while a line of people were waiting outside?" },
    { text: "Ever told your mom you're thriving while secretly snorting pills in your car?" },
    { text: "Ever drove blackout drunk and only realized it the next day?" },
    { text: "Ever begged for nudes, screenshotted them, then ghosted hard?" },
    { text: "Ever pretended to be an 'entrepreneur' just to get laid?" },
    { text: "Ever moaned your ex's name while rawdogging someone else?" },
    { text: "Ever doubled your body count just to look less like a virgin?" },
    { text: "Ever watched illegal fetish content and lowkey enjoyed it?" },
    { text: "Ever lied to your dealer saying you're clean just to get more?" },
    { text: "Ever made out with someone you found disgusting just because you were horny and bored?" },
    { text: "Ever told someone you liked them while secretly planning to ghost?" },
    { text: "Ever followed a girl home just to see if she lives alone?" },
    { text: "Ever lied about being 18 when you were actually 15 just to pull?" },
    { text: "Ever stalked your ex's new man and felt like absolute garbage after?" },
    { text: "Ever bragged about a fake threesome just to sound cool?" },
    { text: "Ever told someone you loved them to keep the money or attention coming?" },
    { text: "Ever cried on command just to win a fight or dodge a breakup?" },
    { text: "Ever watched someone get changed and pretended you didn't see?" },
    { text: "Ever gassed someone up just to emotionally ruin them later?" },
    { text: "Ever jerked it in a public place and walked out like nothing happened?" },
    { text: "Ever called someone 'your world' while texting 3 others?" },
    { text: "Ever sent a full-on 'come over' text and instantly wanted to die?" },
    { text: "Ever ghosted someone mid-'I love you' text?" },
    { text: "Ever cheated your way through a whole class and flexed that GPA?" },
    { text: "Ever started a rumor about someone's sexuality just to stir shit?" },
    { text: "Ever fantasized about hooking up with a teacher or cousin?" },
    { text: "Ever smiled hearing your ex got cheated on?" },
  ];

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleCreateRoom = async () => {
    try {
      if (!localStream) {
        setError('Camera access is required');
        return;
      }

      const newSessionId = `${user.uid}-${Date.now()}`;
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      setIsFirstPerson(true);

      const shuffledQuestions = shuffleArray(questions).slice(0, 30);
      const roomRef = await addDoc(collection(db, 'rooms'), {
        participants: [{ 
          userId: user.uid, 
          displayName: userDisplayName,
          sessionId: newSessionId,
          isFirstPerson: true
        }],
        status: 'active',
        createdAt: serverTimestamp(),
        questions: shuffledQuestions.map(q => q.text),
        currentQuestionIndex: 0,
        currentSpeakerIndex: 0
      });

      setRoomId(roomRef.id);
      setIsInRoom(true);
      setupConnectionListeners(roomRef.id, newSessionId);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (id) => {
    try {
      if (!localStream) {
        setError('Camera access is required');
        return;
      }

      const roomRef = doc(db, 'rooms', id);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        setError('Room not found');
        return;
      }

      const roomData = roomSnap.data();
      if (roomData.participants.length >= 2) {
        setError('Room is full (maximum 2 participants)');
        return;
      }

      const newSessionId = `${user.uid}-${Date.now()}`;
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      setIsFirstPerson(false);

      // Update room with new participant
      await updateDoc(roomRef, {
        participants: arrayUnion({ 
          userId: user.uid, 
          displayName: userDisplayName,
          sessionId: newSessionId,
          isFirstPerson: false
        }),
      });

      setRoomId(id);
      setIsInRoom(true);

      // If game is already started, sync the game state
      if (roomData.gameStateId) {
        const gameStateRef = doc(db, 'gameStates', roomData.gameStateId);
        const gameStateSnap = await getDoc(gameStateRef);
        
        if (gameStateSnap.exists()) {
          const gameState = gameStateSnap.data();
          setGameStarted(true);
          setCurrentQuestions(gameState.questions || []);
          setCurrentQuestionIndex(gameState.currentQuestionIndex || 0);
          setCurrentSpeakerIndex(gameState.currentSpeakerIndex || 0);
        }
      }

      const existingParticipants = roomData.participants;
      existingParticipants.forEach((participant) => {
        if (participant.userId !== user.uid || participant.sessionId !== newSessionId) {
          initiatePeerConnection(participant.userId, id, participant.sessionId);
        }
      });

      setupConnectionListeners(id, newSessionId);
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
    }
  };

  const handlePeerData = async (data) => {
    console.log('Received peer data:', data);
    const message = JSON.parse(data);
    if (message.type === 'userInfo') {
      console.log('Received user info:', message);
      setParticipants(prev => {
        const updated = prev.map(p => 
          p.userId === message.userId ? { ...p, displayName: message.displayName } : p
        );
        console.log('Updated participants:', updated);
        return updated;
      });
    } else if (message.type === 'turnComplete') {
      console.log('Received turn complete from peer:', message);
      setCurrentQuestionResults(prev => ({
        ...prev,
        [message.userId]: { prediction: message.result.prediction }
      }));
      
      // If we received person 1's result, update the flag
      if (message.isFirstPerson) {
        setHasPerson1Spoken(true);
      }
    } else if (message.type === 'nextQuestion') {
      setCurrentQuestionIndex(message.nextQuestionIndex);
      setCurrentTurn(0);
      setCurrentQuestionResults({});
      setHasPerson1Spoken(false);
    } else if (message.type === 'gameStart') {
      try {
        console.log('Received game start message:', message);
        
        // Update local state first
        setGameStarted(true);
        setCurrentQuestions(message.questions);
        setCurrentQuestionIndex(0);
        setCurrentSpeakerIndex(0);

        // Then update room with game state reference
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          gameStateId: message.gameStateId,
          status: 'in_progress',
          questions: message.questions,
          currentQuestionIndex: 0,
          currentSpeakerIndex: 0
        });
        
        // Send acknowledgment back to the sender
        Object.values(peersRef.current).forEach(peer => {
          if (peer.connected) {
            peer.send(JSON.stringify({
              type: 'gameStartAck',
              timestamp: Date.now()
            }));
          }
        });
      } catch (err) {
        console.error('Error handling game start message:', err);
      }
    } else if (message.type === 'gameStartAck') {
      console.log('Received game start acknowledgment');
    } else if (message.type === 'turnTransition') {
      try {
        setCurrentSpeakerIndex(message.currentSpeakerIndex);
        if (message.nextQuestionIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(message.nextQuestionIndex);
        }
        // Reset speaking state for the next turn
        setIsSpeaking(false);
      } catch (err) {
        console.error('Error handling turn transition:', err);
      }
    } else if (message.type === 'gameComplete') {
      setIsInRoom(false);
    }
  };

  const initiatePeerConnection = (remoteUserId, roomId, remoteSessionId) => {
    console.log('Initiating peer connection with:', { remoteUserId, roomId, remoteSessionId });
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    peer.on('signal', async (data) => {
      console.log('Peer signal generated:', data);
      const connectionId = `${user.uid}-${remoteUserId}-${remoteSessionId}`;
      await addDoc(collection(db, `rooms/${roomId}/connections`), {
        connectionId,
        participantA: user.uid,
        participantB: remoteUserId,
        sessionIdA: sessionIdRef.current,
        sessionIdB: remoteSessionId,
        offer: JSON.stringify(data),
        answer: null,
      });
    });

    peer.on('connect', () => {
      console.log('Peer connected, sending user info:', { displayName: userDisplayName, userId: user.uid });
      peer.send(JSON.stringify({
        type: 'userInfo',
        displayName: userDisplayName,
        userId: user.uid
      }));
    });

    peer.on('stream', (stream) => {
      console.log('Received remote stream:', { remoteUserId, remoteSessionId });
      setRemoteStreams(prev => ({
        ...prev,
        [`${remoteUserId}-${remoteSessionId}`]: stream
      }));
    });

    peer.on('data', handlePeerData);

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setError('Connection error occurred');
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', { remoteUserId, remoteSessionId });
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[`${remoteUserId}-${remoteSessionId}`];
        return newStreams;
      });
    });

    peersRef.current[`${remoteUserId}-${remoteSessionId}`] = peer;
  };

  const setupConnectionListeners = (roomId, currentSessionId) => {
    console.log('Setting up connection listeners:', { roomId, currentSessionId });
    const q = query(
      collection(db, `rooms/${roomId}/connections`),
      where('participantB', '==', user.uid)
    );
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const connectionData = change.doc.data();
          console.log('New connection data:', connectionData);
          const remoteUserId = connectionData.participantA;
          const remoteSessionId = connectionData.sessionIdA;
          const peerKey = `${remoteUserId}-${remoteSessionId}`;
          if (peersRef.current[peerKey]) return;

          const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: localStream,
          });

          peer.on('signal', async (data) => {
            console.log('Peer signal generated (receiver):', data);
            await updateDoc(doc(db, `rooms/${roomId}/connections`, change.doc.id), {
              answer: JSON.stringify(data),
            });
          });

          peer.on('connect', () => {
            console.log('Peer connected (receiver), sending user info:', { displayName: userDisplayName, userId: user.uid });
            peer.send(JSON.stringify({
              type: 'userInfo',
              displayName: userDisplayName,
              userId: user.uid
            }));
          });

          peer.on('stream', (stream) => {
            console.log('Received remote stream (receiver):', { remoteUserId, remoteSessionId });
            setRemoteStreams(prev => ({
              ...prev,
              [`${remoteUserId}-${remoteSessionId}`]: stream
            }));
          });

          peer.on('data', handlePeerData);

          peer.on('error', (err) => {
            console.error('Peer error (receiver):', err);
            setError('Connection error occurred');
          });

          peer.on('close', () => {
            console.log('Peer connection closed (receiver):', { remoteUserId, remoteSessionId });
            setRemoteStreams(prev => {
              const newStreams = { ...prev };
              delete newStreams[`${remoteUserId}-${remoteSessionId}`];
              return newStreams;
            });
          });

          peersRef.current[peerKey] = peer;
          peer.signal(JSON.parse(connectionData.offer));
        }
      });
    });

    const q2 = query(
      collection(db, `rooms/${roomId}/connections`),
      where('participantA', '==', user.uid),
      where('answer', '!=', null)
    );
    onSnapshot(q2, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const connectionData = change.doc.data();
          const remoteUserId = connectionData.participantB;
          const remoteSessionId = connectionData.sessionIdB;
          const peerKey = `${remoteUserId}-${remoteSessionId}`;
          const peer = peersRef.current[peerKey];
          if (peer && connectionData.answer) {
            peer.signal(JSON.parse(connectionData.answer));
          }
        }
      });
    });
  };

  const handleLeaveRoom = async () => {
    try {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};

      if (roomId) {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          participants: arrayRemove({ 
            userId: user.uid, 
            displayName: userDisplayName,
            sessionId: sessionId 
          }),
        });
      }

      setIsInRoom(false);
      setRoomId('');
      setParticipants([]);
      setSessionId(null);
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      toast({
        title: 'Room code copied',
        description: 'Share this code with others to join your room',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }).catch(err => {
      console.error('Failed to copy room code:', err);
      toast({
        title: 'Failed to copy room code',
        description: 'Please try copying the code manually',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
  };

  const isCurrentUserTurn = () => {
    return (currentSpeakerIndex === 0 && isFirstPerson) || (currentSpeakerIndex === 1 && !isFirstPerson);
  };

  const isParticipantSpeaking = (participantId) => {
    const participantIndex = participants.findIndex(p => p.userId === participantId);
    return participantIndex === currentSpeakerIndex;
  };

  const handleStartGame = async () => {
    if (participants.length !== 2) {
      toast({
        title: 'Cannot start game',
        description: 'Need exactly 2 players to start',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const shuffledQuestions = shuffleArray(questions).slice(0, 30);
      const roomRef = doc(db, 'rooms', roomId);
      
      // Create a new game state document
      const gameStateRef = await addDoc(collection(db, 'gameStates'), {
        roomId: roomId,
        questions: shuffledQuestions.map(q => q.text),
        currentQuestionIndex: 0,
        currentSpeakerIndex: 0,
        gameStarted: true,
        participants: participants.map(p => p.userId),
        createdAt: serverTimestamp()
      });

      // Update room with game state reference
      await updateDoc(roomRef, {
        gameStateId: gameStateRef.id,
        status: 'in_progress',
        questions: shuffledQuestions.map(q => q.text),
        currentQuestionIndex: 0,
        currentSpeakerIndex: 0
      });

      // Wait for room update to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send game start message to all connected peers
      const connectedPeers = Object.entries(peersRef.current).filter(([_, peer]) => peer && peer.connected);
      
      if (connectedPeers.length === 0) {
        console.warn('No connected peers found when starting game');
      }

      const peerPromises = connectedPeers.map(([peerKey, peer]) => {
        return new Promise((resolve, reject) => {
          try {
            if (peer && peer.connected) {
              peer.send(JSON.stringify({
                type: 'gameStart',
                gameStateId: gameStateRef.id,
                questions: shuffledQuestions.map(q => q.text),
                timestamp: Date.now()
              }));
              resolve();
            } else {
              console.warn(`Peer ${peerKey} not connected, skipping game start message`);
              resolve(); // Resolve anyway to not block the game start
            }
          } catch (err) {
            console.error('Error sending game start to peer:', err);
            resolve(); // Resolve anyway to not block the game start
          }
        });
      });

      await Promise.all(peerPromises);

      // Update local state
      setGameStarted(true);
      setCurrentQuestions(shuffledQuestions.map(q => q.text));
      setCurrentQuestionIndex(0);
      setCurrentSpeakerIndex(0);

      // Log successful game start
      console.log('Game started successfully:', {
        gameStateId: gameStateRef.id,
        roomId: roomId,
        questions: shuffledQuestions.length
      });

    } catch (err) {
      console.error('Error starting game:', err);
      toast({
        title: 'Error',
        description: 'Failed to start game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleScanningComplete = async (result) => {
    try {
      // Validate result data
      if (!result || typeof result.finalLieScore === 'undefined') {
        console.error('Invalid result data:', result);
        toast({
          title: 'Error',
          description: 'Invalid detection result',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Calculate prediction locally
      const prediction = result.finalLieScore >= 55 ? 'LIE' : 'TRUTH';

      // Update local state first
      setCurrentQuestionResults(prev => ({ 
        ...prev, 
        [user.uid]: { prediction } 
      }));

      // If person 1 just finished speaking, set the flag
      if (isFirstPerson) {
        setHasPerson1Spoken(true);
      }

      // Send result to other peer
      Object.entries(peersRef.current).forEach(([peerKey, peer]) => {
        if (peer && peer.connected) {
          try {
            peer.send(JSON.stringify({
              type: 'turnComplete',
              questionIndex: currentQuestionIndex,
              userId: user.uid,
              displayName: userDisplayName,
              result: { prediction },
              isFirstPerson: isFirstPerson
            }));
          } catch (err) {
            console.error('Error sending result to peer:', err);
          }
        }
      });

      // If both players have submitted results, move to next question
      const currentResults = { ...currentQuestionResults, [user.uid]: { prediction } };
      if (Object.keys(currentResults).length === 2) {
        // Move to next question
        const nextQuestionIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextQuestionIndex);
        setCurrentTurn(0); // Reset turn to person 1
        setCurrentQuestionResults({}); // Clear results for next question
        setHasPerson1Spoken(false); // Reset person 1 speaking flag

        // Send turn transition to other peer
        Object.entries(peersRef.current).forEach(([peerKey, peer]) => {
          if (peer && peer.connected) {
            try {
              peer.send(JSON.stringify({
                type: 'nextQuestion',
                nextQuestionIndex: nextQuestionIndex
              }));
            } catch (err) {
              console.error('Error sending turn transition to peer:', err);
            }
          }
        });

        // Check if game is complete
        if (nextQuestionIndex >= 30) {
          // Game is complete
          Object.entries(peersRef.current).forEach(([peerKey, peer]) => {
            if (peer && peer.connected) {
              try {
                peer.send(JSON.stringify({
                  type: 'gameComplete'
                }));
              } catch (err) {
                console.error('Error sending game complete to peer:', err);
              }
            }
          });
          setIsInRoom(false);
        }
      }
    } catch (err) {
      console.error('Error in handleScanningComplete:', err);
      toast({
        title: 'Error',
        description: 'Failed to process your response',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <TopBar />
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
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          {isInRoom ? (
            <Box sx={{ mt: 4 }}>
              {!gameStarted ? (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {participants.length === 2 ? (
                      countdown ? (
                        <>
                          Game starting in <span style={{ color: '#09c2f7', fontWeight: 'bold', fontSize: '1.5em' }}>{countdown}</span> seconds...
                        </>
                      ) : (
                        'Waiting for players to join...'
                      )
                    ) : (
                      `Waiting for players to join... (${participants.length}/2)`
                    )}
                  </Typography>
                  {countdown && (
                    <Box sx={{ 
                      width: '300px', 
                      height: '6px', 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '3px',
                      margin: '20px auto',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <Box sx={{
                        width: `${(countdown / 10) * 100}%`,
                        height: '100%',
                        backgroundColor: '#09c2f7',
                        transition: 'width 1s linear',
                        boxShadow: '0 0 10px rgba(9, 194, 247, 0.5)'
                      }} />
                    </Box>
                  )}
                </Box>
              ) : (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Question {currentQuestionIndex + 1}/30
                  </Typography>
                  {isCurrentUserTurn() && (
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      {currentQuestions[currentQuestionIndex] || 'Loading...'}
                    </Typography>
                  )}
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Current Speaker: {participants[currentSpeakerIndex]?.displayName || 'Waiting...'}
                    {isCurrentUserTurn() && ' (Your turn)'}
                  </Typography>
                </>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '24px',
                      backdropFilter: 'blur(16px)',
                      backgroundColor: 'rgba(13, 17, 44, 0.7)',
                      border: '1px solid rgba(250, 14, 164, 0.2)',
                      height: { base: '100%', md: '600px' },
                      maxWidth: { base: '100%', md: '800px' },
                      minHeight: '300px',
                      position: 'relative',
                      overflow: 'visible',
                      margin: '0 auto'
                    }}
                  >
                    <StyledWebcamContainer>
                      <video
                        id={`video-element-local-${sessionId}`}
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '16px',
                          transform: 'scaleX(1)',
                        }}
                      />
                      <FaceScannerCanvas
                        videoId={`video-element-local-${sessionId}`}
                        onScanningComplete={handleScanningComplete}
                        isTurnToSpeak={isCurrentUserTurn()}
                        sessionId={sessionId}
                      />
                    </StyledWebcamContainer>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '12px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        zIndex: 20,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                        {userDisplayName} (You) {isFirstPerson ? '(First Person)' : '(Second Person)'}
                        {isCurrentUserTurn() && ' - Your turn to speak'}
                      </Typography>
                    </Box>
                    {(() => {
                      console.log('Button visibility conditions:', {
                        gameStarted,
                        isFirstPerson,
                        hasPerson1Spoken,
                        currentQuestionResults: currentQuestionResults[user.uid],
                        allConditions: gameStarted && isFirstPerson && !hasPerson1Spoken && !currentQuestionResults[user.uid]
                      });
                      return gameStarted && isFirstPerson && !hasPerson1Spoken && !currentQuestionResults[user.uid] && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          <StyledButton
                            onClick={() => {
                              const canvas = document.querySelector(`#video-element-local-${sessionId}`);
                              if (canvas) {
                                const event = new CustomEvent('doneSpeaking', {
                                  detail: { sessionId }
                                });
                                canvas.dispatchEvent(event);
                              }
                            }}
                            sx={{
                              bgcolor: 'rgba(9, 194, 247, 0.2)',
                              color: '#fff',
                              '&:hover': {
                                bgcolor: 'rgba(9, 194, 247, 0.3)',
                              },
                              px: 4,
                              minWidth: '200px',
                              fontSize: '1.2rem',
                            }}
                          >
                            Done Speaking
                          </StyledButton>
                        </Box>
                      );
                    })()}
                  </Paper>
                </Grid>
                {participants.map((participant) => (
                  participant.userId !== user.uid || participant.sessionId !== sessionId ? (
                    <Grid item xs={12} sm={6} key={`${participant.userId}-${participant.sessionId}`}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '24px',
                          backdropFilter: 'blur(16px)',
                          backgroundColor: 'rgba(13, 17, 44, 0.7)',
                          border: '1px solid rgba(250, 14, 164, 0.2)',
                          height: { base: '100%', md: '600px' },
                          maxWidth: { base: '100%', md: '800px' },
                          minHeight: '300px',
                          position: 'relative',
                          overflow: 'visible',
                          margin: '0 auto'
                        }}
                      >
                        <StyledWebcamContainer>
                          {!remoteStreams[`${participant.userId}-${participant.sessionId}`] ? (
                            <Box sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: '16px'
                            }}>
                              <Typography sx={{ color: '#fff' }}>Waiting for connection...</Typography>
                            </Box>
                          ) : (
                            <video
                              id={`video-element-${participant.userId}-${participant.sessionId}`}
                              ref={el => {
                                if (el) {
                                  el.srcObject = remoteStreams[`${participant.userId}-${participant.sessionId}`];
                                  el.autoplay = true;
                                  el.playsInline = true;
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '16px',
                                transform: 'scaleX(1)',
                              }}
                            />
                          )}
                        </StyledWebcamContainer>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            background: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: '12px',
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            zIndex: 20,
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                            {participant.displayName} {participant.isFirstPerson ? '(First Person)' : '(Second Person)'}
                            {isParticipantSpeaking(participant.userId) && ' - Speaking'}
                          </Typography>
                        </Box>
                        {gameStarted && isParticipantSpeaking(participant.userId) && (
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <StyledButton
                              onClick={() => {
                                const canvas = document.querySelector(`#video-element-${participant.userId}-${participant.sessionId}`);
                                if (canvas) {
                                  const event = new CustomEvent('doneSpeaking', {
                                    detail: { sessionId: participant.sessionId }
                                  });
                                  canvas.dispatchEvent(event);
                                }
                              }}
                              sx={{
                                bgcolor: 'rgba(9, 194, 247, 0.2)',
                                color: '#fff',
                                '&:hover': {
                                  bgcolor: 'rgba(9, 194, 247, 0.3)',
                                },
                                px: 4,
                                minWidth: '200px',
                                fontSize: '1.2rem',
                              }}
                            >
                              Done Speaking
                            </StyledButton>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  ) : null
                ))}
              </Grid>

              {Object.keys(currentQuestionResults).length === 2 && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 4,
                    p: 3,
                    borderRadius: '24px',
                    backdropFilter: 'blur(16px)',
                    backgroundColor: 'rgba(13, 17, 44, 0.7)',
                    border: '1px solid rgba(250, 14, 164, 0.2)',
                    animation: `${fadeIn} 0.5s ease-out`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
                    }
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                    Results for Question {currentQuestionIndex + 1}
                  </Typography>
                  <Grid container spacing={3}>
                    {participants.map(participant => (
                      currentQuestionResults[participant.userId] && (
                        <Grid item xs={12} sm={6} key={participant.userId}>
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: '16px',
                              backgroundColor: 'rgba(9, 194, 247, 0.1)',
                              border: '1px solid rgba(9, 194, 247, 0.2)',
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                              }
                            }}
                          >
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                              {participant.displayName}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 2,
                              p: 2,
                              borderRadius: '12px',
                              backgroundColor: currentQuestionResults[participant.userId].prediction === 'LIE' 
                                ? 'rgba(255, 68, 68, 0.1)' 
                                : 'rgba(76, 175, 80, 0.1)',
                              border: `1px solid ${
                                currentQuestionResults[participant.userId].prediction === 'LIE'
                                  ? 'rgba(255, 68, 68, 0.3)'
                                  : 'rgba(76, 175, 80, 0.3)'
                              }`
                            }}>
                              <Typography
                                variant="h4"
                                sx={{
                                  color: currentQuestionResults[participant.userId].prediction === 'LIE' ? '#ff4444' : '#4caf50',
                                  fontWeight: 700,
                                }}
                              >
                                {currentQuestionResults[participant.userId].prediction}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {currentQuestionResults[participant.userId].prediction === 'LIE'
                                    ? 'High probability of deception detected'
                                    : 'Likely telling the truth'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ 
                              p: 2, 
                              borderRadius: '12px',
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                {currentQuestionResults[participant.userId].prediction === 'LIE'
                                  ? 'Multiple indicators of deception were detected in the response.'
                                  : 'The response showed natural patterns consistent with truthfulness.'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )
                    ))}
                  </Grid>
                </Paper>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                <IconButton
                  onClick={toggleAudio}
                  sx={{
                    bgcolor: isAudioMuted ? 'rgba(255, 0, 0, 0.2)' : 'rgba(9, 194, 247, 0.2)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: isAudioMuted ? 'rgba(255, 0, 0, 0.3)' : 'rgba(9, 194, 247, 0.3)',
                    },
                  }}
                >
                  {isAudioMuted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton
                  onClick={toggleVideo}
                  sx={{
                    bgcolor: isVideoMuted ? 'rgba(255, 0, 0, 0.2)' : 'rgba(9, 194, 247, 0.2)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: isVideoMuted ? 'rgba(255, 0, 0, 0.3)' : 'rgba(9, 194, 247, 0.3)',
                    },
                  }}
                >
                  {isVideoMuted ? <VideocamOff /> : <Videocam />}
                </IconButton>
                <IconButton
                  onClick={copyRoomLink}
                  sx={{
                    bgcolor: 'rgba(9, 194, 247, 0.2)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'rgba(9, 194, 247, 0.3)',
                    },
                  }}
                >
                  <ContentCopy />
                </IconButton>
                <StyledButton
                  onClick={handleLeaveRoom}
                  startIcon={<Close />}
                  sx={{ px: 4 }}
                >
                  Leave Room
                </StyledButton>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                mt: 8,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: '24px',
                  backdropFilter: 'blur(16px)',
                  backgroundColor: 'rgba(13, 17, 44, 0.7)',
                  border: '1px solid rgba(250, 14, 164, 0.2)',
                  width: '100%',
                  maxWidth: '500px',
                }}
              >
                <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', color: '#fff' }}>
                  Join or Create a Room
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#09c2f7',
                        },
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StyledButton
                      onClick={handleCreateRoom}
                      sx={{ flex: 1 }}
                    >
                      Create Room
                    </StyledButton>
                    <StyledButton
                      onClick={() => handleJoinRoom(roomId)}
                      sx={{ flex: 1 }}
                    >
                      Join Room
                    </StyledButton>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          {error && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Error sx={{ color: '#ff4444' }} />
              <Typography sx={{ color: '#fff' }}>{error}</Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </>
  );
}

export default GroupLiarScore;