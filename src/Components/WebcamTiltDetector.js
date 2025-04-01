import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import {
  Container,
  Flex,
  Box,
  Button,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

// Define the list of available tests including "Overall"
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

// Fixed weights for each test as specified
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

// Fixed test parameters (default values, no longer adjustable)
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

const WebcamTiltDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const videoIntervalRef = useRef(null);
  const videoTimerRef = useRef(null);
  const videoCollectedScoresRef = useRef([]);

  const [currentTest, setCurrentTest] = useState('Overall');
  const [score, setScore] = useState(0);
  const [faceDetected, setFaceDetected] = useState('No face detected');
  const [webcamError, setWebcamError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFinalScore, setVideoFinalScore] = useState(null);
  const [isCollectingVideo, setIsCollectingVideo] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Ref to track the latest score
  const scoreRef = useRef(score);

  // Update score ref whenever score changes
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Load models and start webcam video
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
        throw new Error('Failed to load models');
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
        throw new Error('Webcam access denied or unavailable');
      }
    };

    loadModels()
      .then(startVideo)
      .catch((err) => {
        console.error('Initialization error:', err);
        if (isMounted) {
          setWebcamError(`Error: ${err.message}`);
          setModelsLoaded(false);
        }
      });

    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Detect faces and run tests on webcam video
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
        setFaceDetected('Face detected');
        const landmarks = detection.landmarks;

        // Calculate scores for all tests
        const videoTestScores = {};
        tests.forEach((test) => {
          if (test !== 'Overall') {
            videoTestScores[test] = runTest(test, landmarks, testParams);
          }
        });

        let currentScore;
        if (currentTest === 'Overall') {
          const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
          if (totalWeight > 0) {
            currentScore = Object.entries(videoTestScores).reduce(
              (sum, [test, score]) => sum + score * weights[test],
              0
            ) / totalWeight;
          } else {
            currentScore = 0;
          }
        } else {
          currentScore = videoTestScores[currentTest];
        }
        setScore(currentScore);

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetection);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
        drawTestOverlay(currentTest, landmarks, canvas, displaySize);
      } else {
        setFaceDetected('No face detected');
        setScore(0);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 500);
    return () => clearInterval(intervalRef.current);
  }, [currentTest, videoReady]);

  // Reset final score and countdown when face is no longer detected
  useEffect(() => {
    if (faceDetected !== 'Face detected') {
      setVideoFinalScore(null);
      setCountdown(null);
    }
  }, [faceDetected]);

  // Video score collection with countdown
  useEffect(() => {
    if (faceDetected === 'Face detected' && !isCollectingVideo && videoFinalScore === null) {
      setIsCollectingVideo(true);
      setCountdown(5);
      videoCollectedScoresRef.current = [];
      setVideoFinalScore(null);

      const startTime = Date.now();

      videoIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 5 - Math.floor(elapsed / 1000));
        setCountdown(remaining);
        videoCollectedScoresRef.current.push(scoreRef.current);
      }, 1000);

      videoTimerRef.current = setTimeout(() => {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
        videoTimerRef.current = null;
        setIsCollectingVideo(false);
        setCountdown(null);
        const scores = videoCollectedScoresRef.current;
        if (scores.length > 0) {
          const sortedScores = [...scores].sort((a, b) => a - b);
          const n = sortedScores.length;
          const k = Math.ceil(n / 4);
          const lowerQuartileScores = sortedScores.slice(0, k);
          const average = lowerQuartileScores.reduce((sum, val) => sum + val, 0) / k;
          setVideoFinalScore(average);
        } else {
          setVideoFinalScore(0);
        }
        videoCollectedScoresRef.current = [];
      }, 5000);
    }

    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    };
  }, [faceDetected]);

  // Helper functions
  const getCenter = (points) => {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const runTest = (test, landmarks, params) => {
    switch (test) {
      case 'Cardinal Tilt':
        return calculateTiltScore(landmarks, params['Cardinal Tilt']);
      case 'Facial Thirds':
        return calculateFacialThirdsScore(landmarks, params['Facial Thirds']);
      case 'Cheekbone Location':
        return calculateCheekboneScore(landmarks, params['Cheekbone Location']);
      case 'Interocular Distance':
        return calculateInterocularDistanceScore(landmarks, params['Interocular Distance']);
      case 'Undereyes':
        return calculateUndereyesScore(landmarks, params['Undereyes']);
      case 'Jawline':
        return calculateJawlineScore(landmarks, params['Jawline']);
      case 'Chin':
        return calculateChinScore(landmarks, params['Chin']);
      case 'Nose':
        return calculateNoseScore(landmarks, params['Nose']);
      default:
        return 0;
    }
  };

  const drawTestOverlay = (test, landmarks, canvas, displaySize) => {
    const context = canvas.getContext('2d');
    context.strokeStyle = 'red';
    context.lineWidth = 2;

    switch (test) {
      case 'Cardinal Tilt': {
        const leftEye = getCenter(landmarks.getLeftEye());
        const rightEye = getCenter(landmarks.getRightEye());
        context.beginPath();
        context.moveTo(leftEye.x, leftEye.y);
        context.lineTo(rightEye.x, rightEye.y);
        context.stroke();
        break;
      }
      case 'Facial Thirds': {
        const forehead = landmarks.positions[19];
        const noseBase = landmarks.positions[33];
        const chin = landmarks.positions[8];
        context.beginPath();
        context.moveTo(0, forehead.y);
        context.lineTo(displaySize.width, forehead.y);
        context.moveTo(0, noseBase.y);
        context.lineTo(displaySize.width, noseBase.y);
        context.moveTo(0, chin.y);
        context.lineTo(displaySize.width, chin.y);
        context.stroke();
        break;
      }
      default:
        break;
    }
  };

  // Score calculation functions
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

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }} overflow="hidden">
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Test Selection Buttons */}
        <Flex wrap="wrap" gap={2} justify="center">
          
        </Flex>

        {/* Video Display */}
        <Box
          position="relative"
          w={{ base: '100%', md: '640px' }}
          h="480px"
          borderWidth="2px"
          borderColor="gray.100"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="lg"
          bg="gray.200"
          alignSelf="center"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline // Add this for modern browsers
            webkit-playsinline="true" // Add this for older Safari compatibility
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </Box>

        {/* Status and Scores */}
        <VStack spacing={2} align="center">
          <Text fontSize="lg" fontWeight="bold" fontFamily="Matt Bold">
            Video: {faceDetected}
            {faceDetected === 'Face detected' && `, Live Score: ${score.toFixed(2)}/100`}
            {countdown !== null && `, Countdown: ${countdown}`}
            {videoFinalScore !== null && `, Final Score: ${videoFinalScore.toFixed(2)}/100`}
          </Text>
          <Text fontSize="lg" fontWeight="bold" fontFamily="Matt Bold">
            Current Test: {currentTest}
          </Text>
        </VStack>

        {/* Loading and Error States */}
        {!modelsLoaded && !webcamError && (
          <Text fontSize="lg" color="gray.500" fontFamily="Matt Bold">
            Loading models, please wait...
          </Text>
        )}
        {webcamError && (
          <Text fontSize="lg" color="red.500" fontFamily="Matt Bold">
            {webcamError}
          </Text>
        )}
      </VStack>
    </Container>
  );
};

export default WebcamTiltDetector;