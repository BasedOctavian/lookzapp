import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  styled,
  keyframes,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useToast } from '@chakra-ui/toast';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LoadingIndicator from '../Components/LoadingIndicator';
import { Face, Psychology, SentimentSatisfied } from '@mui/icons-material';

// Define keyframes
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Define styled components
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
  margin: '0 auto',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(11, 43, 77, 0.2)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  background: 'linear-gradient(45deg, rgba(13, 17, 44, 0.7), rgba(102, 4, 62, 0.7))',
  backdropFilter: 'blur(16px)',
}));

const AnalysisContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: '16px',
  background: 'rgba(13, 17, 44, 0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(250, 14, 164, 0.3)',
  color: '#fff',
  animation: `${fadeIn} 0.5s ease-out`,
}));

const AnalysisItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  '& .MuiTypography-root': {
    fontSize: '0.9rem',
  },
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const questions = [
  { text: "Have you ever pissed yourself in public and tried to play it off?" },
  { text: "Ever stolen cash from a friend's bag while they were blacked out?" },
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
  { text: "Ever faked a mental breakdown just to dodge accountability?" },
  { text: "Ever stolen cash from grandma's purse and blamed your sibling?" },
  { text: "Ever made a fake profile to stalk your ex's new boo?" },
  { text: "Ever said 'I love you' just to hit and dip?" },
  { text: "Ever faked a traumatic event for likes or sympathy on TikTok?" },
  { text: "Ever lowkey wanted to get caught cheating just for the drama?" },
  { text: "Ever claimed you're single while your girl was asleep next to you?" },
  { text: "Ever hooked up with someone who repulsed you just for the ego boost?" },
  { text: "Ever lied to your therapist because you didn't want to sound insane?" },
  { text: "Ever hoped your best friend fails just to feel like the alpha?" },
  { text: "Ever posted thirst traps just to make your ex spiral?" },
  { text: "Ever done something legit felony-level and just never got caught?" },
  { text: "Ever said you were a CEO when you were jobless just to impress a baddie?" },
  { text: "Ever posted a cryptic 'miss you' story aimed at your ex and pretended it wasn't?" },
  { text: "Ever used someone's trauma to look like the good guy, then dipped?" },
  { text: "Ever sexted out of boredom with someone you'd never touch IRL?" },
  { text: "Ever catfished someone just to ruin their day?" },
  { text: "Ever let someone take the fall for drugs that were actually yours?" },
  { text: "Ever told people you were related to a celeb just to get free stuff?" },
  { text: "Ever flirted with your friend's parent just to feel powerful?" },
  { text: "Ever lied about your body count being low to seem innocent?" },
  { text: "Ever whispered something filthy in church just to make someone laugh?" },
  { text: "Ever claimed you were in a gang just to avoid getting jumped?" },
  { text: "Ever cried after sex because you felt nothing inside?" },
  { text: "Ever said your ex abused you just so people would hate them?" },
  { text: "Ever got off to your own nudes or videos?" },
  { text: "Ever told someone they were the best you ever had, and meant the opposite?" },
  { text: "Ever stalked someone so hard you knew their Starbucks order before meeting?" },
  { text: "Ever faked having a twin just to catfish two people at once?" },
  { text: "Ever snitched just to avoid getting canceled yourself?" },
  { text: "Ever said you were dying to get your ex to text back?" },
  { text: "Ever made a playlist for someone, then reused it for the next?" },
  { text: "Ever pretended to have amnesia after cheating just to dodge the convo?" },
  { text: "Ever DM'd a celeb something filthy, then deleted it and prayed?" },
  { text: "Ever posted fake crying selfies to see who checks in?" },
  { text: "Ever saved someone's spicy pics and kept them post-breakup?" },
  { text: "Ever made up a whole relationship just to make someone jealous?" },
  { text: "Ever scratched your balls and sniffed it like it was cologne?" },
  { text: "Ever re-used the same crusty sock for way too long?" },
  { text: "Ever peed in a bottle and forgot about it until someone found it?" },
  { text: "Ever let a booger dry on the wall and never cleaned it?" },
  { text: "Ever tried to flex abs in the mirror while crying?" },
  { text: "Ever searched something wild online, cleared history, then did it again?" },
  { text: "Ever touched your junk in class just to make sure it was still there?" },
  { text: "Ever faked a deeper voice on the phone to sound grown?" },
  { text: "Ever used 3-in-1 body wash, shampoo, and toothpaste like a psycho?" },
  { text: "Ever eaten something off the floor and told yourself it's the '5-second rule'?" },
  { text: "Ever sniffed your pits, gagged, then still didn't shower?" },
  { text: "Ever played sick just to stay home and binge hentai or weird anime?" },
  { text: "Ever used your phone screen reflection to check a zit mid-class?" },
  { text: "Ever dry humped your pillow and pretended it was your crush?" },
  { text: "Ever checked if your balls could float in the bathtub?" },
  { text: "Ever moaned quietly just to see what it felt like?" },
  { text: "Ever worn the same underwear for days and reversed them to feel 'cleaner'?" },
  { text: "Ever tried to flex muscles in gym class and ended up farting?" },
  { text: "Ever made a TikTok draft so cringe you swore you'd never open it again?" },
  { text: "Ever smelled your own fart under the blanket like it was an experiment?" },
  { text: "Ever compared your size with a deodorant bottle and panicked?" },
  { text: "Ever cracked open a zit and lowkey watched it in fascination?" },
  { text: "Ever licked something off your hand and didn't know what it was?" },
  { text: "Ever said 'bro I'm so done with her' then stalked her page for hours?" },
  { text: "Ever talked in a fake accent to try to sound foreign and mysterious?" },
  { text: "Ever got a boner during a school presentation and prayed no one noticed?" },
  { text: "Ever fake gagged in a mirror just to see how far your tongue goes?" },
  { text: "Ever made weird voices alone just to see how you'd sound as a villain?" },
  { text: "Ever pretended to get a text mid-convo just to avoid saying hi?" },
  { text: "Ever stared at a classmate's butt and mentally slapped yourself after?" }
];

const FaceScanner = React.forwardRef(({ startScanning, onScanningComplete, onFaceDetected, currentPrompt, weights, currentStep, onCalibrationComplete, isMobile }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const featureHistoryRef = useRef([]);
  const calibrationRMS = useRef([]);
  const calibrationCycle = useRef(0);
  const rmsNormalizationFactor = useRef(0.025); // Default value
  const [isCollecting, setIsCollecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [model, setModel] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const toast = useToast();
  const [smoothedFeatures, setSmoothedFeatures] = useState({
    voiceIntensity: 0,
    zcr: 0,
    headMovement: 0,
    eyeMovement: 0,
    lipTension: 0
  });
  const [prevHeadPosition, setPrevHeadPosition] = useState(null);
  const [prevEyePosition, setPrevEyePosition] = useState(null);
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
  const [analysisResults, setAnalysisResults] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [currentAudioBaseline, setCurrentAudioBaseline] = useState(0);
  const audioBaselineRef = useRef(0);
  const audioSamplesRef = useRef([]);

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const leftEyeIndices = [33, 160, 158, 133, 153, 144];
  const noseIndices = [1, 2, 98, 327];
  const CALIBRATION_CYCLES = 50; // Approx 5 seconds at 100ms interval

  const [consecutiveTruths, setConsecutiveTruths] = useState(0);
  const [consecutiveLies, setConsecutiveLies] = useState(0);

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
    if (currentStep === 'calibration') {
      calibrationRMS.current = [];
      calibrationCycle.current = 0;
    }
  }, [currentStep]);

  useEffect(() => {
    if (startScanning && !isCollecting) {
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
    }
  }, [startScanning, currentPrompt]);

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

  // Reset audio normalization when question changes
  useEffect(() => {
    if (currentPrompt) {
      audioSamplesRef.current = [];
      audioBaselineRef.current = 0;
      setCurrentAudioBaseline(0);
    }
  }, [currentPrompt]);

  const calculateAudioLevel = (currentRMS) => {
    // Collect samples for the first second
    if (audioSamplesRef.current.length < 10) {
      audioSamplesRef.current.push(currentRMS);
      if (audioSamplesRef.current.length === 10) {
        // Calculate baseline from first 10 samples
        const baseline = audioSamplesRef.current.reduce((sum, val) => sum + val, 0) / audioSamplesRef.current.length;
        audioBaselineRef.current = baseline;
        setCurrentAudioBaseline(baseline);
      }
      return 0;
    }

    // Calculate relative audio level compared to baseline
    const relativeLevel = Math.max(0, (currentRMS - audioBaselineRef.current) / audioBaselineRef.current);
    return Math.min(relativeLevel * 100, 100);
  };

  const calculateScore = (weights) => {
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
        voiceIntensity: Math.min(featureMeans.rms / rmsNormalizationFactor.current, 1),
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

      // Check if it's Safari on iOS
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafariIOS = isSafari && isIOS;

      // Adjust bias based on platform
      let bias;
      if (isSafariIOS) {
        bias = -0.8; // Even lower threshold for Safari on iOS
      } else if (isMobile) {
        bias = -1.2; // Lower threshold for other mobile devices
      } else {
        bias = -3.5; // Original threshold for desktop
      }

      const weightedSum = bias + Object.keys(normalizedFeatures).reduce((sum, key) => 
        sum + weights[key] * normalizedFeatures[key], 0
      );
      const lieProbability = 1 / (1 + Math.exp(-weightedSum));
      let finalLieScore = Math.round(lieProbability * 100);

      const lieThreshold = isMobile ? 68 : 55; // Different threshold for mobile
      let isLie = finalLieScore >= lieThreshold;

      // Check for 3 consecutive same results and apply 50% flip chance
      if (consecutiveLies >= 3 || consecutiveTruths >= 3) {
        const shouldFlip = Math.random() < 0.5; // 50% chance to flip
        if (shouldFlip) {
          isLie = !isLie;
          finalLieScore = isLie ? lieThreshold + Math.floor(Math.random() * (100 - lieThreshold)) : lieThreshold - Math.floor(Math.random() * lieThreshold);
        }
      }

      // Update consecutive counters
      if (isLie) {
        setConsecutiveLies(prev => prev + 1);
        setConsecutiveTruths(0);
      } else {
        setConsecutiveTruths(prev => prev + 1);
        setConsecutiveLies(0);
      }

      // Store debug info
      setDebugInfo({
        bias,
        weightedSum,
        lieProbability,
        finalLieScore,
        isSafariIOS,
        isMobile,
        normalizedFeatures,
        lieThreshold,
        isLie,
        consecutiveLies,
        consecutiveTruths
      });

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

    const result = calculateScore(weights);
    setIsProcessing(false);
    
    setPrediction(result.finalLieScore >= 55 ? 'LIE' : 'TRUTH');
    setShowResult(true);

    setAnalysisResults({
      confidence: Math.round(result.normalizedFeatures.confidence * 100),
      keyFactors: [
        { name: 'Voice Intensity', value: Math.round(result.normalizedFeatures.voiceIntensity * 100) },
        { name: 'Speech Rate', value: Math.round(result.normalizedFeatures.speechRate * 100) },
        { name: 'Head Movement', value: Math.round(result.normalizedFeatures.headMovement * 100) },
        { name: 'Eye Movement', value: Math.round(result.normalizedFeatures.eyeMovement * 100) },
        { name: 'Lip Tension', value: Math.round(result.normalizedFeatures.lipTension * 100) },
        { name: 'Filler Words', value: Math.round(result.normalizedFeatures.fillerWords * 100) },
        { name: 'Repetitions', value: Math.round(result.normalizedFeatures.repetitions * 100) },
      ].sort((a, b) => b.value - a.value).slice(0, 3)
    });

    setTimeout(() => {
      setShowResult(false);
      onScanningComplete(result);
    }, 3000);
  };

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

        const landmarks = predictions[0].scaledMesh;

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

        if (currentStep === 'calibration') {
          calibrationRMS.current.push(currentRMS);
          calibrationCycle.current += 1;
          if (calibrationCycle.current >= CALIBRATION_CYCLES) {
            const averageRMS = calibrationRMS.current.reduce((sum, v) => sum + v, 0) / calibrationRMS.current.length;
            const targetRMS = 0.007;
            rmsNormalizationFactor.current = 0.025 * (averageRMS / targetRMS);
            onCalibrationComplete();
          }
          return;
        }

        // Calculate audio level relative to baseline
        const audioLevel = calculateAudioLevel(currentRMS);

        const alpha = 0.1;
        setSmoothedFeatures(prev => ({
          voiceIntensity: alpha * currentRMS + (1 - alpha) * prev.voiceIntensity,
          zcr: alpha * currentZCR + (1 - alpha) * prev.zcr,
          headMovement: alpha * currentHeadMovement + (1 - alpha) * prev.headMovement,
          eyeMovement: alpha * currentEyeMovement + (1 - alpha) * prev.eyeMovement,
          lipTension: alpha * currentLipTension + (1 - alpha) * prev.lipTension
        }));

        context.save();
        if (showResult) {
          context.strokeStyle = prediction === 'LIE' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
          context.lineWidth = 2;
        } else {
          context.strokeStyle = 'rgba(9, 194, 247, 0.1)';
          context.lineWidth = 1;
        }

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
        context.restore();

        if (isCollecting) {
          featureHistoryRef.current.push({
            rms: currentRMS,
            zcr: currentZCR,
            headMovement: currentHeadMovement,
            eyeMovement: currentEyeMovement,
            lipTension: currentLipTension,
          });
        }

        // Update smoothed features with relative audio level
        setSmoothedFeatures(prev => ({
          ...prev,
          voiceIntensity: audioLevel / 100 // Convert back to 0-1 range
        }));

        if (showResult) {
          context.save();
          context.font = 'bold 80px Arial';
          context.fillStyle = prediction === 'LIE' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(prediction, canvas.width / 2, canvas.height / 2);
          
          
          context.restore();
        }
      } else {
        setFaceDetected(false);
        onFaceDetected(false);
      }
    };

    intervalRef.current = setInterval(detectFaceAndRunTest, 100);
    return () => clearInterval(intervalRef.current);
  }, [model, videoReady, isCollecting, onFaceDetected, weights, showResult, prediction, currentStep, onCalibrationComplete, currentPrompt]);

  if (webcamError) {
    toast({ title: 'Error', description: webcamError, status: 'error', duration: 5000, isClosable: true });
  }

  return (
    <Box>
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
          <Typography variant="h6" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, textAlign: 'center' }}>
            {currentStep === 'calibration'
              ? 'Calibrating microphone, please say "Testing, one, two, three"'
              : faceDetected 
                ? (isCollecting ? 'Hold still and speak...' : 'Look at the camera')
                : 'Please Wait...'}
          </Typography>
          {currentStep === 'scanning' && faceDetected && currentPrompt && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, mb: 1 }}>
                {currentPrompt}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                Reply with a simple yes or no, elaborate if needed
              </Typography>
            </Box>
          )}
        </StyledInstructionText>
        {!showResult && isCollecting && !isProcessing && (
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
        
      </StyledWebcamContainer>
    </Box>
  );
});

const LiarScore = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Add mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [weights] = useState({
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
  });
  const faceScannerRef = useRef(null);
  const toast = useToast();

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleStartScanning = () => {
    const shuffled = shuffleArray(questions);
    setShuffledQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setCurrentStep('calibration');
  };

  const handleFaceDetected = (detected) => {};

  const handleScanningComplete = (result) => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      if ((currentQuestionIndex + 1) % 10 === 0) {
        setCurrentStep('break');
      }
    } else {
      setCurrentStep('instructions');
    }
  };

  const BreakScreen = () => {
    const tests = [
      {
        title: 'Attractiveness Analysis',
        description: 'Advanced AI-powered analysis of facial features and attractiveness',
        path: '/scan/attractiveness',
        icon: <Face />,
        color: '#09c2f7'
      },
      {
        title: 'Criminality Analysis',
        description: 'Evaluate behavioral patterns and risk factors',
        path: '/scan/crime',
        icon: <WarningAmberIcon />,
        color: '#fa0ea4'
      },
      {
        title: 'Autism Analysis',
        description: 'Advanced AI-powered analysis of potential autism spectrum traits',
        path: '/scan/autism',
        icon: <Psychology />,
        color: '#6ce9ff'
      },
      {
        title: 'Label Me',
        description: 'Get personalized labels and insights about yourself',
        path: '/scan/label',
        icon: <SentimentSatisfied />,
        color: '#4dabf7'
      }
    ];

    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8,
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Take a Break or Try Our Other Features
        </Typography>

        <Box sx={{ mb: 6 }}>
          <GradientButton 
            onClick={() => setCurrentStep('scanning')}
            sx={{ 
              minWidth: '200px',
              fontSize: '1.2rem',
              py: 1.5,
            }}
          >
            Continue Lie Detection
          </GradientButton>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {tests.map((test) => (
            <Grid item xs={12} sm={6} md={3} key={test.title}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(13, 17, 44, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(250, 14, 164, 0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 8px 32px ${test.color}40`,
                    border: `1px solid ${test.color}40`
                  }
                }}
                onClick={() => navigate(test.path)}
              >
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  p: 3
                }}>
                  <Box
                    sx={{
                      color: test.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: `${test.color}20`,
                      mb: 2,
                      '& .MuiSvgIcon-root': {
                        fontSize: 32
                      }
                    }}
                  >
                    {test.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {test.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      mb: 2,
                      minHeight: '40px'
                    }}
                  >
                    {test.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      color: test.color,
                      borderColor: `${test.color}40`,
                      '&:hover': {
                        borderColor: test.color,
                        backgroundColor: `${test.color}10`
                      }
                    }}
                  >
                    Try Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
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
        {currentStep === 'instructions' && (
          <Box sx={{ my: 8, textAlign: 'center' }}>
            <Box
              sx={{
                marginTop: '100px',
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
            <Typography
              variant="h4"
              component="h1"
              align="center"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Lie Detector
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                mb: 4,
              }}
            >
              Answer provocative questions while our AI analyzes your facial expressions, voice patterns, and micro-expressions to detect deception.
            </Typography>
            <GradientButton 
              onClick={handleStartScanning}
              sx={{ 
                minWidth: '200px',
                fontSize: '1.2rem',
                py: 1.5,
              }}
            >
              Start Game
            </GradientButton>
          </Box>
        )}

        {(currentStep === 'calibration' || currentStep === 'scanning') && (
          <Box sx={{ my: 8 }}>
            <FaceScanner
              currentStep={currentStep}
              onCalibrationComplete={() => setCurrentStep('scanning')}
              startScanning={currentStep === 'scanning'}
              onScanningComplete={handleScanningComplete}
              onFaceDetected={handleFaceDetected}
              currentPrompt={currentStep === 'scanning' ? shuffledQuestions[currentQuestionIndex]?.text : null}
              weights={weights}
              isMobile={isMobile}
              ref={faceScannerRef}
            />
          </Box>
        )}

        {currentStep === 'break' && <BreakScreen />}
      </Box>
    </Box>
  );
};

export default LiarScore;