import React, { useState, useRef, useEffect } from 'react';
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
  IconButton,
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
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { Card, CardHeader, CardBody } from '@chakra-ui/card';
import { Input } from '@chakra-ui/input';
import { Radio, RadioGroup } from '@chakra-ui/radio';

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

  // Core Functions

  const handleCreateRoom = async () => {
    if (!localStream) {
      setError('Local stream not available');
      return;
    }
    if (!userData || !userData.id) {
      setError('User data not loaded');
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

      newPeer.on('error', handleCallEnded);
      newPeer.on('close', handleCallEnded);

      setPeer(newPeer);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (!localStream) {
      setError('Local stream not available');
      return;
    }
    if (!userData || !userData.id) {
      setError('User data not loaded');
      return;
    }

    setIsInitiator(false);
    setError('');

    try {
      const roomRef = doc(db, 'twoTruthsRooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setError('Room does not exist');
        return;
      }

      const roomData = roomSnap.data();
      if (roomData.status !== 'waiting' && roomData.status !== 'inactive') {
        setError('Room is not available for joining');
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

        newPeer.on('error', handleCallEnded);
        newPeer.on('close', handleCallEnded);

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

        newPeer.on('error', handleCallEnded);
        newPeer.on('close', handleCallEnded);

        setPeer(newPeer);
        newPeer.signal(offer);
        setRoomId(roomId);
        console.log('Joined waiting room:', roomId);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
    }
  };

  const handleStart = async () => {
    if (!localStream) {
      setError('Local stream not available');
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
      setError('Failed to start game');
      toast({
        title: 'Start Error',
        description: 'Unable to start the game.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEndCall = () => {
    if (peer) {
      peer.destroy();
      handleCallEnded();
    }
  };

  const handleCallEnded = async () => {
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
    // Removed navigate('/updates') to stay on the game page
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

  const renderGameUI = () => {
    if (!roomData) {
      console.log('No roomData yet');
      return null;
    }

    console.log('Current game state:', roomData.gameState);

    switch (roomData.gameState) {
      case 'entering_statements':
        console.log('Rendering entering_statements UI');
        if (!roomData[localStatementsField]) {
          return (
            <Card w="100%" boxShadow="lg" borderRadius="2xl">
              <CardHeader>
                <Heading size="md" color="blue.700">
                  Enter Your Two Truths and One Lie
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Text fontSize="sm" color="gray.600">
                    Write three statements about yourself: two truths and one lie.
                  </Text>
                  {statements.map((stmt, index) => (
                    <Input
                      key={index}
                      value={stmt}
                      onChange={(e) => {
                        const newStatements = [...statements];
                        newStatements[index] = e.target.value;
                        setStatements(newStatements);
                      }}
                      placeholder={`Statement ${index + 1}`}
                      variant="filled"
                      size="md"
                    />
                  ))}
                  <HStack>
                    <Text fontWeight="medium">Which one is your lie?</Text>
                    <RadioGroup onChange={(value) => setLieIndex(Number(value))}>
                      <HStack spacing={4}>
                        {statements.map((_, index) => (
                          <Radio key={index} value={index}>
                            {index + 1}
                          </Radio>
                        ))}
                      </HStack>
                    </RadioGroup>
                  </HStack>
                  <Button
                    colorScheme="teal"
                    size="md"
                    onClick={async () => {
                      if (statements.some((s) => !s.trim()) || lieIndex === null) {
                        toast({
                          title: 'Incomplete',
                          description: 'Please fill all statements and select your lie.',
                          status: 'warning',
                        });
                        return;
                      }
                      try {
                        await updateDoc(doc(db, 'twoTruthsRooms', roomId), {
                          [localStatementsField]: statements,
                          [localLieIndexField]: lieIndex,
                        });
                        console.log('Statements submitted:', statements, 'Lie index:', lieIndex);
                      } catch (err) {
                        console.error('Error submitting statements:', err);
                        toast({ title: 'Error', description: 'Failed to submit.', status: 'error' });
                      }
                    }}
                  >
                    Submit
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          );
        }
        return (
          <Text fontSize="md" color="gray.600">
            Waiting for {remoteUserName || 'the other player'} to submit their statements...
          </Text>
        );

      case 'guessing':
        console.log('Rendering guessing UI');
        if (roomData[localGuessField] === null && roomData[remoteStatementsField]) {
          return (
            <Card w="100%" boxShadow="lg" borderRadius="2xl">
              <CardHeader>
                <Heading size="md" color="blue.700">
                  Guess {remoteUserName || 'Their'} Lie
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Text fontSize="sm" color="gray.600">
                    Watch the video for clues! Here are {remoteUserName || 'their'} statements:
                  </Text>
                  {roomData[remoteStatementsField].map((stmt, index) => (
                    <Text
                      key={index}
                      fontSize="lg"
                      sx={{
                        animation: `fadeIn 0.5s ease-in-out ${index * 0.3}s both`,
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'translateY(10px)' },
                          to: { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      {`${index + 1}. ${stmt}`}
                    </Text>
                  ))}
                  <Text fontWeight="medium">Which one do you think is the lie?</Text>
                  <HStack spacing={4}>
                    {roomData[remoteStatementsField].map((_, index) => (
                      <Button
                        key={index}
                        colorScheme="blue"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'twoTruthsRooms', roomId), {
                              [localGuessField]: index,
                            });
                            console.log('Guess submitted:', index);
                          } catch (err) {
                            console.error('Error submitting guess:', err);
                            toast({
                              title: 'Error',
                              description: 'Failed to submit guess.',
                              status: 'error',
                            });
                          }
                        }}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          );
        }
        return (
          <Text fontSize="md" color="gray.600">
            Waiting for {remoteUserName || 'the other player'} to guess your lie...
          </Text>
        );

      case 'revealing_answers':
        console.log('Rendering revealing_answers UI');
        const localCorrect = roomData[localGuessField] === roomData[remoteLieIndexField];
        const remoteCorrect = roomData[remoteGuessField] === roomData[localLieIndexField];
        let resultText;
        if (localCorrect && !remoteCorrect) resultText = 'You win! You guessed right, they didn’t.';
        else if (!localCorrect && remoteCorrect) resultText = `${remoteUserName || 'They'} win! They guessed right, you didn’t.`;
        else if (localCorrect && remoteCorrect) resultText = "It's a tie! You both guessed correctly.";
        else resultText = "It's a tie! Neither of you guessed correctly.";

        return (
          <Card w="100%" boxShadow="lg" borderRadius="2xl">
            <CardHeader>
              <Heading size="md" color="blue.700">
                Game Results
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Text fontWeight="bold">Your Statements:</Text>
                {roomData[localStatementsField].map((stmt, index) => (
                  <Text
                    key={index}
                    color={index === roomData[localLieIndexField] ? 'red.500' : 'black'}
                    sx={{
                      animation:
                        index === roomData[localLieIndexField]
                          ? 'pulse 1s infinite'
                          : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                    {`${index + 1}. ${stmt} ${index === roomData[localLieIndexField] ? '(Lie)' : ''}`}
                  </Text>
                ))}
                <Text fontWeight="bold">{remoteUserName || 'Opponent'}’s Statements:</Text>
                {roomData[remoteStatementsField].map((stmt, index) => (
                  <Text
                    key={index}
                    color={index === roomData[remoteLieIndexField] ? 'red.500' : 'black'}
                    sx={{
                      animation:
                        index === roomData[remoteLieIndexField]
                          ? 'pulse 1s infinite'
                          : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                    {`${index + 1}. ${stmt} ${index === roomData[remoteLieIndexField] ? '(Lie)' : ''}`}
                  </Text>
                ))}
                <Text>
                  Your guess: Statement {roomData[localGuessField] + 1} (
                  {localCorrect ? 'Correct' : 'Incorrect'})
                </Text>
                <Text>
                  {remoteUserName || 'Opponent'}’s guess: Statement {roomData[remoteGuessField] + 1} (
                  {remoteCorrect ? 'Correct' : 'Incorrect'})
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="teal.600">
                  {resultText}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        );

      default:
        return null;
    }
  };

  // useEffect Hooks

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
  }, []);

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
        setRemoteUserName(remoteData.displayName);
        setRemoteUserId(remoteData.userId);
      } catch (err) {
        console.error('Invalid data received:', err);
      }
    };

    peer.on('connect', handleConnect);
    peer.on('data', handleData);
    peer.on('error', handleCallEnded);
    peer.on('close', handleCallEnded);

    setConnectionStatus(isInitiator ? 'Waiting for connection...' : 'Connecting...');

    return () => {
      peer.off('connect', handleConnect);
      peer.off('data', handleData);
      peer.off('error', handleCallEnded);
      peer.off('close', handleCallEnded);
    };
  }, [peer, isInitiator, userData]);

  useEffect(() => {
    if (roomId) {
      const unsubscribe = onSnapshot(doc(db, 'twoTruthsRooms', roomId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Room data updated:', data);
          setRoomData(data);
        }
      });
      return () => unsubscribe();
    }
  }, [roomId]);

  useEffect(() => {
    if (isLocalInitiator && roomData) {
      console.log('Checking game state transition:', roomData.gameState);
      if (
        roomData.gameState === 'entering_statements' &&
        roomData.initiatorStatements &&
        roomData.joinerStatements
      ) {
        console.log('Both statements submitted, moving to guessing');
        updateDoc(doc(db, 'twoTruthsRooms', roomId), { gameState: 'guessing' });
      } else if (
        roomData.gameState === 'guessing' &&
        roomData.initiatorGuess !== null &&
        roomData.joinerGuess !== null
      ) {
        console.log('Both guesses submitted, moving to revealing_answers');
        updateDoc(doc(db, 'twoTruthsRooms', roomId), { gameState: 'revealing_answers' });
      }
    }
  }, [roomData, isLocalInitiator, roomId]);

  // JSX Rendering
  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(10px)"
        zIndex="sticky"
        borderBottomWidth="1px"
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading
              as="h1"
              size="xl"
              color="blue.700"
              fontWeight="bold"
              onClick={() => navigate('/')}
              cursor="pointer"
            >
              Two Truths and a Lie
            </Heading>
            <HStack spacing={4}>
              <Button variant="link" color="red.500" fontWeight="medium" onClick={handleSignOut}>
                Sign Out
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          {/* Rules */}
          <Card w="100%" boxShadow="md" borderRadius="2xl">
            <CardBody>
              <Text fontSize="md" color="gray.700">
                <strong>Rules:</strong> Enter two truths and one lie about yourself. Watch your
                opponent’s video to guess their lie. After both guess, see who got it right!
              </Text>
            </CardBody>
          </Card>

          {/* Video Containers */}
          <Flex
            direction={['column', 'row']}
            w="100%"
            h={['75vh', 'auto']}
            justify="center"
            align="center"
            gap={6}
            p={4}
            bg="white"
            borderRadius="2xl"
            boxShadow="xl"
          >
            <Box
              w={['100%', '45%']}
              h={['auto', '60vh']}
              borderWidth="2px"
              borderColor="gray.100"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="lg"
              bg="black"
              position="relative"
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <HStack
                position="absolute"
                bottom="2"
                left="2"
                color="white"
                bg="rgba(0, 0, 0, 0.6)"
                px={2}
                py={1}
                borderRadius="md"
                spacing={1}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {userData?.displayName || 'You'}
                </Text>
              </HStack>
            </Box>
            <Box
              w={['100%', '45%']}
              h={['auto', '60vh']}
              borderWidth="2px"
              borderColor="gray.100"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="lg"
              bg="black"
              position="relative"
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!peer && (
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  color="white"
                  bg="rgba(0, 0, 0, 0.6)"
                  px={4}
                  py={2}
                  borderRadius="md"
                  fontSize="md"
                  fontWeight="medium"
                >
                  Waiting for connection...
                </Text>
              )}
              {peer && (
                <HStack
                  position="absolute"
                  bottom="2"
                  left="2"
                  color="white"
                  bg="rgba(0, 0, 0, 0.6)"
                  px={2}
                  py={1}
                  borderRadius="md"
                  spacing={1}
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {remoteUserName || 'Stranger'}
                  </Text>
                </HStack>
              )}
            </Box>
          </Flex>

          {/* Game Interface */}
          <Box w="100%" p={4} bg="white" borderRadius="2xl" boxShadow="xl">
            {peer && renderGameUI()}
          </Box>

          {/* Call Controls */}
          <HStack spacing={4} justify="center" flexWrap="wrap">
            {peer ? (
              <>
                <IconButton
                  aria-label={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  onClick={toggleAudio}
                  colorScheme={isAudioMuted ? 'red' : 'teal'}
                  icon={isAudioMuted ? <MicOff /> : <Mic />}
                />
                <IconButton
                  aria-label={isVideoMuted ? 'Enable Video' : 'Disable Video'}
                  onClick={toggleVideo}
                  colorScheme={isVideoMuted ? 'red' : 'teal'}
                  icon={isVideoMuted ? <VideocamOff /> : <Videocam />}
                />
                <Button
                  leftIcon={<Close />}
                  colorScheme="red"
                  size="lg"
                  px={8}
                  onClick={handleEndCall}
                  boxShadow="md"
                  _hover={{ transform: 'scale(1.05)' }}
                >
                  End Call
                </Button>
              </>
            ) : (
              <Button
                leftIcon={<Phone />}
                colorScheme="teal"
                size="lg"
                px={8}
                onClick={handleStart}
                boxShadow="md"
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
              >
                Start Game
              </Button>
            )}
          </HStack>

          {/* Status Indicators */}
          <VStack spacing={2} w="100%">
            {roomId && (
              <HStack
                fontSize="sm"
                color="gray.600"
                textAlign="center"
                bg="white"
                p={3}
                borderRadius="lg"
                boxShadow="sm"
                justify="center"
              >
                <CheckCircle color="success" />
                <Text>
                  Connection ID: <strong>{roomId}</strong> • {connectionStatus}
                </Text>
              </HStack>
            )}
            {error && (
              <HStack
                fontSize="sm"
                color="red.600"
                textAlign="center"
                bg="red.50"
                p={3}
                borderRadius="lg"
                boxShadow="sm"
                justify="center"
              >
                <Error color="error" />
                <Text>{error}</Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Container>
    </Flex>
  );
}

export default TwoTruths;