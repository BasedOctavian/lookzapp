import React, { useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'simple-peer';
import {
  Container,
  Flex,
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Heading,
  Input,
  Spinner,
} from '@chakra-ui/react';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '@chakra-ui/toast';
import {
  CheckCircle,
  Error,
  Phone,
  Close,
  MicOff,
  Mic,
  Videocam,
  VideocamOff,
  Gamepad,
  Logout,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { Radio, RadioGroup } from '@chakra-ui/radio';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/alert';
import { Avatar, IconButton } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { FormControl, FormErrorMessage } from '@chakra-ui/form-control';
import { Skeleton } from '@chakra-ui/skeleton';
import { Progress } from '@chakra-ui/progress';

// Memoized StatementInput Component to Prevent Unnecessary Re-renders
const StatementInput = React.memo(({ stmt, index, onChange, isDisabled, isSelected }) => {
  return (
    <FormControl isInvalid={!stmt.trim() && isDisabled}>
      <Input
        value={stmt}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder={`Statement ${index + 1}`}
        variant="filled"
        size="lg"
        isDisabled={isDisabled}
        bg={isSelected ? 'yellow.100' : 'white'}
        borderRadius="md"
        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
        aria-label={`Statement ${index + 1}`}
        sx={{ transition: 'background-color 0.3s ease' }}
      />
      {!stmt.trim() && isDisabled && (
        <FormErrorMessage>Statement cannot be empty</FormErrorMessage>
      )}
    </FormControl>
  );
});

// Isolated Timer Component
const Timer = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  return (
    <HStack spacing={2}>
      <TimerIcon color="error" />
      <Text fontSize="lg" color={timeLeft <= 10 ? 'red.600' : 'red.500'} fontWeight="bold">
        Time left: {timeLeft} seconds
      </Text>
    </HStack>
  );
};

function TwoTruths() {
  // State Declarations
  const [roomId, setRoomId] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);
  const [error, setError] = useState('');
  const [peer, setPeer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState('');
  const [remoteUserId, setRemoteUserId] = useState('');
  const [statements, setStatements] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // Timer for entering statements
  const [guessTimeLeft, setGuessTimeLeft] = useState(30); // Timer for guessing
  const [messages, setMessages] = useState([]); // Chat messages
  const [currentMessage, setCurrentMessage] = useState(''); // Current chat input

  // Refs and Hooks
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, loading } = useUserData();

  // Helper Variables
  const isLocalInitiator = isInitiator;
  const localStatementsField = isLocalInitiator ? 'initiatorStatements' : 'joinerStatements';
  const localLieIndexField = isLocalInitiator ? 'initiatorLieIndex' : 'joinerLieIndex';
  const remoteStatementsField = isLocalInitiator ? 'joinerStatements' : 'initiatorStatements';
  const remoteLieIndexField = isLocalInitiator ? 'joinerLieIndex' : 'initiatorLieIndex';
  const localGuessField = isLocalInitiator ? 'initiatorGuess' : 'joinerGuess';
  const remoteGuessField = isLocalInitiator ? 'joinerGuess' : 'initiatorGuess';

  // Framer Motion Components
  const MotionBox = motion(Box);
  const MotionButton = motion(Button);

  // Memoized Event Handler for Statement Changes
  const handleStatementChange = useCallback((index, value) => {
    setStatements((prev) => {
      const newStatements = [...prev];
      newStatements[index] = value;
      return newStatements;
    });
  }, []);

  // Game Phase Stepper Component
  const GamePhaseStepper = ({ currentPhase }) => {
    const phases = ['Setup', 'Connecting', 'Statements', 'Guessing', 'Results'];
    const phaseIndex = {
      setup: 0,
      connecting: 1,
      statements: 2,
      guessing: 3,
      results: 4,
    }[currentPhase] || 0;

    return (
      <Flex justify="center" mb={8}>
        <HStack spacing={4}>
          {phases.map((phase, index) => (
            <Flex key={phase} align="center">
              <Box
                w="40px"
                h="40px"
                borderRadius="full"
                bg={index < phaseIndex ? 'teal.500' : index === phaseIndex ? 'blue.500' : 'gray.200'}
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                transition="all 0.3s ease"
                aria-label={`${phase} phase ${index < phaseIndex ? 'completed' : index === phaseIndex ? 'current' : 'upcoming'}`}
              >
                {index < phaseIndex ? <CheckCircle /> : index + 1}
              </Box>
              <Text
                fontSize="sm"
                fontWeight={index === phaseIndex ? 'bold' : 'normal'}
                color={index === phaseIndex ? 'blue.600' : 'gray.500'}
                ml={2}
              >
                {phase}
              </Text>
            </Flex>
          ))}
        </HStack>
      </Flex>
    );
  };

  // Core Functions

  // Create a New Room
  const handleCreateRoom = async () => {
    if (!localStream) {
      setError('Local stream not available. Check your camera and microphone permissions.');
      return;
    }
    if (!userData || !userData.id) {
      setError('User data not loaded. Please try again.');
      return;
    }

    setIsInitiator(true);
    setError('');

    try {
      const newPeer = new Peer({ initiator: true, trickle: false, stream: localStream });

      newPeer.on('signal', async (data) => {
        const roomRef = await addDoc(collection(db, 'twoTruthsRooms'), {
          status: 'waiting',
          offer: data,
          answer: null,
          initiatorId: userData.id,
          joinerId: null,
          gameState: 'entering_statements',
          initiatorStatements: null,
          initiatorLieIndex: null,
          joinerStatements: null,
          joinerLieIndex: null,
          initiatorGuess: null,
          joinerGuess: null,
        });

        setRoomId(roomRef.id);
        console.log('Room created with ID:', roomRef.id);

        onSnapshot(doc(db, 'twoTruthsRooms', roomRef.id), (docSnap) => {
          const roomData = docSnap.data();
          if (roomData?.answer && !newPeer.destroyed) {
            console.log('Received answer:', roomData.answer);
            newPeer.signal(roomData.answer);
          }
        });
      });

      newPeer.on('stream', (stream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });

      newPeer.on('error', (err) => {
        console.error('PeerJS error:', err);
        handleCallEnded(false);
      });
      newPeer.on('close', () => {
        console.log('PeerJS connection closed');
        handleCallEnded(false);
      });

      setPeer(newPeer);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.');
    }
  };

  // Join an Existing Room
  const handleJoinRoom = async (roomId) => {
    if (!localStream) {
      setError('Local stream not available. Check your camera and microphone permissions.');
      return;
    }
    if (!userData || !userData.id) {
      setError('User data not loaded. Please try again.');
      return;
    }

    setIsInitiator(false);
    setError('');

    try {
      const roomRef = doc(db, 'twoTruthsRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setError('Room does not exist. Check the room ID and try again.');
        return;
      }

      const roomData = roomSnap.data();
      if (roomData.status !== 'waiting' && roomData.status !== 'inactive') {
        setError('Room is not available for joining. It might be full or the game has already started.');
        return;
      }

      if (roomData.status === 'inactive') {
        setIsInitiator(true);
        await updateDoc(roomRef, {
          status: 'waiting',
          offer: null,
          answer: null,
          initiatorId: userData.id,
          joinerId: null,
          gameState: 'entering_statements',
          initiatorStatements: null,
          initiatorLieIndex: null,
          joinerStatements: null,
          joinerLieIndex: null,
          initiatorGuess: null,
          joinerGuess: null,
        });

        const newPeer = new Peer({ initiator: true, trickle: false, stream: localStream });

        newPeer.on('signal', async (data) => {
          await updateDoc(roomRef, {
            offer: data,
          });
        });

        newPeer.on('stream', (stream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        });

        newPeer.on('error', (err) => {
          console.error('PeerJS error:', err);
          handleCallEnded(false);
        });
        newPeer.on('close', () => {
          console.log('PeerJS connection closed');
          handleCallEnded(false);
        });

        setPeer(newPeer);
        setRoomId(roomId);
        console.log('Reusing inactive room with ID:', roomId);

        onSnapshot(roomRef, (docSnap) => {
          const updatedData = docSnap.data();
          if (updatedData?.answer && !newPeer.destroyed) {
            console.log('Received answer:', updatedData.answer);
            newPeer.signal(updatedData.answer);
          }
        });
      } else {
        const offer = roomData.offer;
        const newPeer = new Peer({ initiator: false, trickle: false, stream: localStream });

        newPeer.on('signal', async (data) => {
          await updateDoc(roomRef, {
            answer: data,
            status: 'active',
            joinerId: userData.id,
          });
          console.log('Answer set for room:', roomId);
        });

        newPeer.on('stream', (stream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        });

        newPeer.on('error', (err) => {
          console.error('PeerJS error:', err);
          handleCallEnded(false);
        });
        newPeer.on('close', () => {
          console.log('PeerJS connection closed');
          handleCallEnded(false);
        });

        setPeer(newPeer);
        newPeer.signal(offer);
        setRoomId(roomId);
        console.log('Joined waiting room:', roomId);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please check your connection and try again.');
    }
  };

  // Start the Game (Join or Create)
  const handleStart = async () => {
    if (!localStream) {
      setError('Local stream not available. Check your camera and microphone permissions.');
      return;
    }

    try {
      let roomsQuery = query(collection(db, 'twoTruthsRooms'), where('status', '==', 'waiting'));
      let querySnapshot = await getDocs(roomsQuery);

      if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0];
        await handleJoinRoom(roomDoc.id);
        return;
      }

      roomsQuery = query(collection(db, 'twoTruthsRooms'), where('status', '==', 'inactive'));
      querySnapshot = await getDocs(roomsQuery);

      if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0];
        await handleJoinRoom(roomDoc.id);
        return;
      }

      await handleCreateRoom();
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game. Please check your connection and try again.');
      toast({
        title: 'Start Error',
        description: 'Unable to start the game. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // End the Call
  const handleEndCall = () => {
    if (peer) {
      peer.destroy();
      handleCallEnded(true);
    }
  };

  // Handle Call Termination
  const handleCallEnded = async (force = false) => {
    if (force || (roomData && roomData.gameState === 'revealing_answers')) {
      if (roomId) {
        try {
          const roomRef = doc(db, 'twoTruthsRooms', roomId);
          await updateDoc(roomRef, {
            status: 'inactive',
            offer: null,
            answer: null,
            initiatorId: null,
            joinerId: null,
            gameState: null,
            initiatorStatements: null,
            initiatorLieIndex: null,
            joinerStatements: null,
            joinerLieIndex: null,
            initiatorGuess: null,
            joinerGuess: null,
          });
          console.log('Room set to inactive:', roomId);
        } catch (err) {
          console.error('Error updating room status:', err);
          setError('Failed to update room status');
        }
      }
      setPeer(null);
      setRoomId('');
      setIsInitiator(false);
      setRemoteUserName('');
      setRemoteUserId('');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    } else {
      console.log('Call event detected, but game is in progress. Keeping room active.');
    }
  };

  // Toggle Audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error('Error signing out:', err);
      toast({
        title: 'Sign Out Error',
        description: 'Failed to sign out.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Game UI Rendering
  const renderGameUI = () => {
    if (!roomData) return null;

    const completion = statements.filter((s) => s.trim()).length / 3 * 75 + (lieIndex !== null ? 25 : 0);
    const currentPhase = roomData.gameState === 'entering_statements' ? 'statements' :
                        roomData.gameState === 'guessing' ? 'guessing' :
                        roomData.gameState === 'revealing_answers' ? 'results' :
                        peer ? 'connecting' : 'setup';

    return (
      <AnimatePresence mode="wait">
        {roomData.gameState === 'entering_statements' && (
          <MotionBox
            key="entering_statements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {!hasSubmitted ? (
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="blue.700">
                  Enter Your Two Truths and One Lie
                </Heading>
                <Text fontSize="md" color="gray.600" mb={2}>
                  Write two true facts and one lie about yourself. Select which one is the lie below.
                </Text>
                <Progress value={completion} size="sm" colorScheme="teal" mb={4} />
                <Timer initialTime={60} onTimeUp={() => {
                  if (!hasSubmitted) {
                    const randomLie = Math.floor(Math.random() * 3);
                    updateDoc(doc(db, 'twoTruthsRooms', roomId), {
                      [localStatementsField]: statements.map(s => s.trim() || 'I forgot to write this!'),
                      [localLieIndexField]: lieIndex !== null ? lieIndex : randomLie,
                    });
                    setHasSubmitted(true);
                  }
                }} />
                <Progress value={(timeLeft / 60) * 100} size="sm" colorScheme="red" mb={4} />
                {statements.map((stmt, index) => (
                  <StatementInput
                    key={index}
                    stmt={stmt}
                    index={index}
                    onChange={handleStatementChange}
                    isDisabled={hasSubmitted}
                    isSelected={lieIndex === index}
                  />
                ))}
                <HStack spacing={4} align="center">
                  <Text fontWeight="medium" color="gray.700">
                    Which one is your lie?
                  </Text>
                  <RadioGroup onChange={(value) => !hasSubmitted && setLieIndex(Number(value))} value={lieIndex}>
                    <HStack spacing={6}>
                      {statements.map((_, index) => (
                        <Radio
                          key={index}
                          value={index}
                          isDisabled={hasSubmitted}
                          colorScheme="teal"
                          aria-label={`Select statement ${index + 1} as the lie`}
                        >
                          {index + 1}
                        </Radio>
                      ))}
                    </HStack>
                  </RadioGroup>
                </HStack>
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  colorScheme="teal"
                  size="lg"
                  onClick={async () => {
                    if (statements.some((s) => !s.trim()) || lieIndex === null) return;
                    await updateDoc(doc(db, 'twoTruthsRooms', roomId), {
                      [localStatementsField]: statements,
                      [localLieIndexField]: lieIndex,
                    });
                    setHasSubmitted(true);
                  }}
                  isDisabled={statements.some((s) => !s.trim()) || lieIndex === null}
                  aria-label="Submit statements"
                >
                  Submit
                </MotionButton>
              </VStack>
            ) : (
              <Flex justify="center" align="center" direction="column">
                <Spinner size="xl" color="teal.500" />
                <Text mt={4} fontSize="lg" color="gray.600">
                  Waiting for {remoteUserName || 'the other player'} to submit their statements...
                </Text>
              </Flex>
            )}
          </MotionBox>
        )}
        {roomData.gameState === 'guessing' && (
          <MotionBox
            key="guessing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {roomData[localGuessField] === null && roomData[remoteStatementsField] ? (
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="blue.700">
                  Guess {remoteUserName || 'Their'} Lie
                </Heading>
                <Text fontSize="md" color="gray.600" mb={2}>
                  Watch the video and pick the statement you think is the lie.
                </Text>
                <HStack spacing={2}>
                  <TimerIcon color="error" />
                  <Text fontSize="lg" color={guessTimeLeft <= 10 ? 'red.600' : 'red.500'} fontWeight="bold">
                    Time left to guess: {guessTimeLeft} seconds
                  </Text>
                </HStack>
                <Progress value={(guessTimeLeft / 30) * 100} size="sm" colorScheme="red" mb={4} />
                {roomData[remoteStatementsField].map((stmt, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="sm"
                    _hover={{ bg: 'gray.100', borderColor: 'gray.300' }}
                    transition="all 0.2s ease"
                  >
                    <Text fontSize="lg" color="gray.800">{`${index + 1}. ${stmt}`}</Text>
                  </Box>
                ))}
                <HStack spacing={4} justify="center">
                  {roomData[remoteStatementsField].map((_, index) => (
                    <MotionButton
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      colorScheme="blue"
                      variant="solid"
                      size="md"
                      onClick={async () => {
                        await updateDoc(doc(db, 'twoTruthsRooms', roomId), {
                          [localGuessField]: index,
                        });
                      }}
                      aria-label={`Guess statement ${index + 1} as the lie`}
                    >
                      {index + 1}
                    </MotionButton>
                  ))}
                </HStack>
              </VStack>
            ) : (
              <Flex justify="center" align="center" direction="column">
                <Spinner size="xl" color="teal.500" />
                <Text mt={4} fontSize="lg" color="gray.600">
                  Waiting for {remoteUserName || 'the other player'} to guess your lie...
                </Text>
              </Flex>
            )}
          </MotionBox>
        )}
        {roomData.gameState === 'revealing_answers' && (
          <MotionBox
            key="revealing_answers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="blue.700">Game Results</Heading>
              <Box>
                <Text fontWeight="bold" color="gray.700" mb={2}>
                  Your Statements:
                </Text>
                {roomData[localStatementsField].map((stmt, index) => (
                  <Text
                    key={index}
                    color={index === roomData[localLieIndexField] ? 'red.500' : 'gray.800'}
                    fontSize="lg"
                  >
                    {`${index + 1}. ${stmt} ${index === roomData[localLieIndexField] ? '(Lie)' : ''}`}
                  </Text>
                ))}
                <Text mt={2} fontSize="lg" color="teal.600">
                  {remoteUserName || 'Opponent'} guessed: Statement {roomData[remoteGuessField] + 1}
                  {roomData[remoteGuessField] === roomData[localLieIndexField] ? ' (Correct!)' : ' (Wrong)'}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.700" mb={2}>
                  {remoteUserName || 'Opponent'}’s Statements:
                </Text>
                {roomData[remoteStatementsField].map((stmt, index) => (
                  <Text
                    key={index}
                    color={index === roomData[remoteLieIndexField] ? 'red.500' : 'gray.800'}
                    fontSize="lg"
                  >
                    {`${index + 1}. ${stmt} ${index === roomData[remoteLieIndexField] ? '(Lie)' : ''}`}
                  </Text>
                ))}
                <Text mt={2} fontSize="lg" color="teal.600">
                  You guessed: Statement {roomData[localGuessField] + 1}
                  {roomData[localGuessField] === roomData[remoteLieIndexField] ? ' (Correct!)' : ' (Wrong)'}
                </Text>
              </Box>
              {(() => {
                const localCorrect = roomData[localGuessField] === roomData[remoteLieIndexField];
                const remoteCorrect = roomData[remoteGuessField] === roomData[localLieIndexField];
                let resultText;
                if (localCorrect && !remoteCorrect) resultText = 'You win! You guessed right, they didn’t.';
                else if (!localCorrect && remoteCorrect) resultText = `${remoteUserName || 'They'} win! They guessed right, you didn’t.`;
                else if (localCorrect && remoteCorrect) resultText = "It's a tie! You both guessed correctly.";
                else resultText = "It's a tie! Neither of you guessed correctly.";
                return (
                  <Text fontSize="xl" fontWeight="bold" color="teal.600" textAlign="center" mt={6}>
                    {resultText}
                  </Text>
                );
              })()}
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    );
  };

  // useEffect Hooks

  // Setup Media Stream
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error('Failed to access media devices:', err);
        setError('Failed to access camera/microphone. Check permissions.');
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Peer Connection Events
  useEffect(() => {
    if (!peer) {
      setConnectionStatus('');
      return;
    }

    const handleConnect = () => {
      setConnectionStatus('Connected');
      if (userData && userData.id) {
        peer.send(JSON.stringify({ displayName: userData.displayName, userId: userData.id }));
      }
      console.log('Peer connected');
    };

    const handleData = (data) => {
      try {
        const remoteData = JSON.parse(data);
        if (remoteData.displayName) {
          setRemoteUserName(remoteData.displayName);
          setRemoteUserId(remoteData.userId);
        } else if (remoteData.message) {
          setMessages((prev) => [...prev, `${remoteUserName || 'Stranger'}: ${remoteData.message}`]);
        }
      } catch (err) {
        console.error('Invalid data received:', err);
      }
    };

    const handleError = (err) => {
      console.error('PeerJS error:', err);
      handleCallEnded(false);
    };

    const handleClose = () => {
      console.log('PeerJS connection closed');
      handleCallEnded(false);
    };

    peer.on('connect', handleConnect);
    peer.on('data', handleData);
    peer.on('error', handleError);
    peer.on('close', handleClose);

    setConnectionStatus(isInitiator ? 'Waiting for connection...' : 'Connecting...');

    return () => {
      peer.off('connect', handleConnect);
      peer.off('data', handleData);
      peer.off('error', handleError);
      peer.off('close', handleClose);
    };
  }, [peer, isInitiator, userData]);

  // Listen to Room Data Updates
  useEffect(() => {
    if (roomId) {
      const unsubscribe = onSnapshot(doc(db, 'twoTruthsRooms', roomId), (docSnap) => {
        if (docSnap.exists()) {
          setRoomData(docSnap.data());
        }
      });
      return () => unsubscribe();
    }
  }, [roomId]);

  // Manage Game State Transitions
  useEffect(() => {
    if (isLocalInitiator && roomData) {
      if (
        roomData.gameState === 'entering_statements' &&
        roomData.initiatorStatements &&
        roomData.joinerStatements
      ) {
        updateDoc(doc(db, 'twoTruthsRooms', roomId), { gameState: 'guessing' });
      } else if (
        roomData.gameState === 'guessing' &&
        roomData.initiatorGuess !== null &&
        roomData.joinerGuess !== null
      ) {
        updateDoc(doc(db, 'twoTruthsRooms', roomId), { gameState: 'revealing_answers' });
      }
    }
  }, [roomData, isLocalInitiator, roomId]);

  // Statement Entry Timer
  useEffect(() => {
    if (roomData?.gameState === 'entering_statements' && !hasSubmitted) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (!hasSubmitted) {
              const randomLie = Math.floor(Math.random() * 3);
              updateDoc(doc(db, 'twoTruthsRooms', roomId), {
                [localStatementsField]: statements.map(s => s.trim() || 'I forgot to write this!'),
                [localLieIndexField]: lieIndex !== null ? lieIndex : randomLie,
              });
              setHasSubmitted(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(60); // Reset timer when phase changes
    }
  }, [roomData?.gameState, hasSubmitted, statements, lieIndex, roomId]);

  // Guessing Timer
  useEffect(() => {
    if (roomData?.gameState === 'guessing' && roomData[localGuessField] === null) {
      const interval = setInterval(() => {
        setGuessTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const randomGuess = Math.floor(Math.random() * 3);
            updateDoc(doc(db, 'twoTruthsRooms', roomId), { [localGuessField]: randomGuess });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setGuessTimeLeft(30); // Reset timer when phase changes
    }
  }, [roomData?.gameState, roomData, localGuessField, roomId]);

  // Network Status Monitoring
  useEffect(() => {
    const handleOnline = () => setError('');
    const handleOffline = () =>
      setError('You are offline. Please check your internet connection.');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine Current Phase
  const currentPhase = roomData?.gameState === 'entering_statements' ? 'statements' :
                       roomData?.gameState === 'guessing' ? 'guessing' :
                       roomData?.gameState === 'revealing_answers' ? 'results' :
                       peer ? 'connecting' : 'setup';

  // JSX Rendering
  return (
    <Flex direction="column" minH="100vh" bg="gray.50" fontFamily="Inter, system-ui">
      {roomData?.gameState === 'revealing_answers' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} />
      )}
      {/* Header */}
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg="linear-gradient(to right, #3182CE, #38B2AC)"
        zIndex="sticky"
        boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3} cursor="pointer" onClick={() => navigate('/')}>
              <IconButton
                icon={<Gamepad />}
                colorScheme="whiteAlpha"
                variant="ghost"
                size="lg"
                aria-label="Game Icon"
                _hover={{ transform: 'scale(1.1)' }}
                transition="all 0.2s"
              />
              <Heading as="h1" size="xl" color="white" fontWeight="bold">
                Lookzapp
              </Heading>
            </HStack>
            <IconButton
              aria-label="Sign Out"
              icon={<Logout />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="lg"
              onClick={handleSignOut}
              _hover={{ transform: 'scale(1.1)' }}
              transition="all 0.2s"
            />
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={{ base: 6, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <GamePhaseStepper currentPhase={currentPhase} />
          <Flex
            direction={{ base: 'column', md: 'row' }}
            w="100%"
            justify="space-between"
            align="center"
            gap={6}
            bg="white"
            borderRadius="2xl"
            boxShadow="xl"
            p={6}
          >
            <Box
              position="relative"
              w={{ base: '100%', md: '48%' }}
              pb={{ base: '56.25%', md: '0' }}
              h={{ base: 'auto', md: '60vh' }}
              borderRadius="xl"
              overflow="hidden"
              boxShadow="lg"
              border="1px solid"
              borderColor="gray.200"
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box position="absolute" bottom="0" left="0" w="100%" bg="blackAlpha.600" p={2}>
                <HStack spacing={2}>
                  <Avatar size="sm" name={userData?.displayName || 'You'} src={userData?.avatarUrl} />
                  <Text color="white" fontSize="sm" fontWeight="medium">
                    {userData?.displayName || 'You'}
                  </Text>
                </HStack>
              </Box>
            </Box>
            <Box
              position="relative"
              w={{ base: '100%', md: '48%' }}
              pb={{ base: '56.25%', md: '0' }}
              h={{ base: 'auto', md: '60vh' }}
              borderRadius="xl"
              overflow="hidden"
              boxShadow="lg"
              border="1px solid"
              borderColor="gray.200"
            >
              {peer ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Flex justify="center" align="center" h="100%" bg="gray.800">
                  <Spinner size="xl" color="white" />
                  <Text color="white" ml={4} fontSize="md">
                    Waiting for connection...
                  </Text>
                </Flex>
              )}
              {peer && (
                <Box position="absolute" bottom="0" left="0" w="100%" bg="blackAlpha.600" p={2}>
                  <HStack spacing={2}>
                    <Avatar size="sm" name={remoteUserName || 'Stranger'} />
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {remoteUserName || 'Stranger'}
                    </Text>
                  </HStack>
                </Box>
              )}
            </Box>
          </Flex>
          <MotionBox
            w="100%"
            p={6}
            bg="white"
            borderRadius="2xl"
            boxShadow="xl"
            border="1px solid"
            borderColor="gray.200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {peer ? renderGameUI() : <Skeleton height="200px" />}
          </MotionBox>
          <Flex justify="center" align="center" gap={4} flexWrap="wrap">
            {peer ? (
              <>
                <IconButton
                  aria-label={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  icon={isAudioMuted ? <MicOff /> : <Mic />}
                  colorScheme={isAudioMuted ? 'red' : 'teal'}
                  size="lg"
                  variant="outline"
                  onClick={toggleAudio}
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="all 0.2s"
                />
                <IconButton
                  aria-label={isVideoMuted ? 'Enable Video' : 'Disable Video'}
                  icon={isVideoMuted ? <VideocamOff /> : <Videocam />}
                  colorScheme={isVideoMuted ? 'red' : 'teal'}
                  size="lg"
                  variant="outline"
                  onClick={toggleVideo}
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="all 0.2s"
                />
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  leftIcon={<Close />}
                  colorScheme="red"
                  size="lg"
                  px={8}
                  onClick={handleEndCall}
                >
                  End Call
                </MotionButton>
              </>
            ) : (
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                leftIcon={<Phone />}
                colorScheme="teal"
                size="lg"
                px={8}
                onClick={handleStart}
              >
                Start Game
              </MotionButton>
            )}
          </Flex>
          {/* Chat Section */}
          <Box mt={8} p={6} bg="white" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200">
            <Heading size="md" mb={4} color="gray.800">
              Chat
            </Heading>
            <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto" p={2} bg="gray.50" borderRadius="md">
              {messages.map((msg, index) => {
                const isUserMessage = msg.startsWith(userData?.displayName || 'You');
                return (
                  <Box
                    key={index}
                    p={2}
                    bg={isUserMessage ? 'teal.50' : 'gray.100'}
                    borderRadius="md"
                    boxShadow="sm"
                    alignSelf={isUserMessage ? 'flex-end' : 'flex-start'}
                    maxW="70%"
                  >
                    <Text fontSize="sm" color="gray.800">{msg}</Text>
                  </Box>
                );
              })}
            </VStack>
            <HStack mt={4}>
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type a message..."
                variant="filled"
                bg="gray.50"
                borderColor="gray.200"
                _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1px teal.400' }}
                aria-label="Type a message"
              />
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                colorScheme="teal"
                onClick={() => {
                  if (currentMessage.trim()) {
                    setMessages([...messages, `${userData?.displayName || 'You'}: ${currentMessage}`]);
                    setCurrentMessage('');
                    if (peer) peer.send(JSON.stringify({ message: currentMessage }));
                  }
                }}
              >
                Send
              </MotionButton>
            </HStack>
          </Box>
          {roomId && (
            <Alert status="success" variant="subtle" borderRadius="md" boxShadow="sm">
              <AlertIcon as={CheckCircle} />
              <AlertTitle mr={2}>Connection ID: {roomId}</AlertTitle>
              <AlertDescription>{connectionStatus}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert status="error" variant="subtle" borderRadius="md" boxShadow="sm">
              <AlertIcon as={Error} />
              <AlertTitle mr={2}>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </VStack>
      </Container>
    </Flex>
  );
}

export default TwoTruths;