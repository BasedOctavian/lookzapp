import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
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
  Spinner,
  useToken,
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
  Star,
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
import { useUserRatingData } from '../hooks/useUserRatingData';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import useVideoStream from '../hooks/useVideoStream'; // Added import for the custom hook

const RatingScale = lazy(() => import('../Components/RatingScale'));

function VideoCall() {
  // **State Declarations**
  const [roomId, setRoomId] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);
  const [error, setError] = useState('');
  const [peer, setPeer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState('');
  const [remoteUserId, setRemoteUserId] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [initialRating, setInitialRating] = useState(null);
  const [remoteRatingReceived, setRemoteRatingReceived] = useState(false);
  const [currentRatingStep, setCurrentRatingStep] = useState('idle');
  const [callStartTime, setCallStartTime] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading } = useUserData();
  const {
    submitRating: submitRemoteRating,
    rating: remoteRating,
    loading: ratingLoading,
  } = useUserRatingData(remoteUserId);

  // Use the custom hook to get the local stream
  const localStream = useVideoStream();

  // Set the stream to the local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (localRating) {
      setInitialRating(localRating.toFixed(1));
    }
  }, [localRating]);

  // **Function Definitions**
  const handleCreateRoom = async () => {
    setIsInitiator(true);
    setError('');
    try {
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: localStream,
      });

      newPeer.on('signal', async (data) => {
        const offer = JSON.stringify(data);
        const roomRef = await addDoc(collection(db, 'rooms'), {
          status: 'waiting',
          offer,
          answer: null,
        });
        setRoomId(roomRef.id);

        onSnapshot(doc(db, 'rooms', roomRef.id), (docSnap) => {
          const roomData = docSnap.data();
          if (roomData?.answer && !newPeer.destroyed) {
            try {
              const answer = JSON.parse(roomData.answer);
              newPeer.signal(answer);
            } catch (err) {
              console.error('Invalid answer data:', err);
            }
          }
        });
      });

      newPeer.on('stream', (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      newPeer.on('error', async (err) => {
        console.error('Peer error:', err);
        setError('Connection error');
        toast({
          title: 'Connection error',
          description: 'An error occurred with the connection',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        handleCallEnded();
      });

      newPeer.on('close', () => handleCallEnded());

      newPeer._pc.oniceconnectionstatechange = () => {
        if (
          newPeer._pc.iceConnectionState === 'disconnected' ||
          newPeer._pc.iceConnectionState === 'failed'
        ) {
          handleCallEnded();
        }
      };

      setPeer(newPeer);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId) => {
    setIsInitiator(false);
    setError('');
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        setError('Room not found');
        return;
      }
      const roomData = roomSnap.data();
      if (roomData.status !== 'waiting') {
        setError('Room is not available');
        return;
      }

      const offer = JSON.parse(roomData.offer);
      const newPeer = new Peer({
        initiator: false,
        trickle: false,
        stream: localStream,
      });

      newPeer.on('signal', async (data) => {
        const answer = JSON.stringify(data);
        await updateDoc(roomRef, { answer, status: 'active' });
      });

      newPeer.on('stream', (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      newPeer.on('error', async (err) => {
        console.error('Peer error:', err);
        setError('Connection error');
        toast({
          title: 'Connection error',
          description: 'An error occurred with the connection',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        handleCallEnded();
      });

      newPeer.on('close', () => handleCallEnded());
      setPeer(newPeer);
      newPeer.signal(offer);
      setRoomId(roomId);
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
    }
  };

  const handleReuseRoom = async (existingRoomId) => {
    setIsInitiator(true);
    setError('');
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    newPeer.on('signal', async (data) => {
      const offer = JSON.stringify(data);
      const roomRef = doc(db, 'rooms', existingRoomId);
      await updateDoc(roomRef, {
        status: 'waiting',
        offer,
        answer: null,
      });
      setRoomId(existingRoomId);

      onSnapshot(roomRef, (docSnap) => {
        const roomData = docSnap.data();
        if (roomData?.answer && !newPeer.destroyed) {
          try {
            const answer = JSON.parse(roomData.answer);
            newPeer.signal(answer);
          } catch (err) {
            console.error('Invalid answer data:', err);
          }
        }
      });
    });

    newPeer.on('stream', (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    newPeer.on('error', async (err) => {
      console.error('Peer error:', err);
      setError('Connection error');
      toast({
        title: 'Connection error',
        description: 'An error occurred with the connection',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      handleCallEnded();
    });

    newPeer.on('close', () => handleCallEnded());
    setPeer(newPeer);
  };

  const handleStart = async () => {
    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('status', 'in', ['waiting', 'inactive'])
      );
      const querySnapshot = await getDocs(roomsQuery);
      if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0];
        const roomData = roomDoc.data();
        const existingRoomId = roomDoc.id;
        if (roomData.status === 'inactive') {
          await handleReuseRoom(existingRoomId);
        } else if (roomData.status === 'waiting') {
          handleJoinRoom(existingRoomId);
        }
      } else {
        handleCreateRoom();
      }
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Failed to start call');
      toast({
        title: 'Start Call Error',
        description: 'Unable to start the call. Please try again.',
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
    if (!initialRating && localRating) {
      setInitialRating(localRating.toFixed(1));
    }
    if (roomId) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          status: 'inactive',
          offer: null,
          answer: null,
        });
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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localRating && remoteRatingReceived) {
      navigate('/updates', { state: { initialRating: initialRating || localRating.toFixed(1) } });
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign out error',
        description: 'An error occurred while signing out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Define the mapping between RatingScale categories and Firestore fields
  const featureMapping = {
    'Eyes': 'eyesRating',
    'Smile': 'smileRating',
    'Jawline': 'facialRating',
    'Hair': 'hairRating',
    'Body': 'bodyRating',
  };

  const handleRating = (newRating, featureAllocations) => {
    // Transform featureAllocations to match Firestore field names
    const mappedAllocations = {};
    for (const [category, score] of Object.entries(featureAllocations)) {
      const fieldName = featureMapping[category];
      if (fieldName) {
        mappedAllocations[fieldName] = score;
      } else {
        console.warn(`No mapping found for category: ${category}`);
      }
    }

    // Submit the transformed data
    submitRemoteRating(newRating, mappedAllocations)
      .then(() => {
        setHasRated(true);
        toast({
          title: 'Rating Submitted',
          description: 'Your rating has been successfully submitted.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((err) => {
        console.error('Error submitting rating:', err);
        toast({
          title: 'Rating Error',
          description: 'Failed to submit rating.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  // **useEffect Hooks**
  useEffect(() => {
    if (!peer) {
      setConnectionStatus('');
      return;
    }

    const handleConnect = () => {
      setConnectionStatus('Connected');
      setCallStartTime(new Date());
      if (userData && userData.id) {
        peer.send(JSON.stringify({ displayName: userData.displayName, userId: userData.id }));
      }
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

    const handleError = async (err) => {
      console.error('Peer error:', err);
      setError('Connection error');
      toast({
        title: 'Connection error',
        description: 'An error occurred with the connection',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      handleCallEnded();
    };

    const handleClose = () => {
      setConnectionStatus('Call ended');
      handleCallEnded();
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
  }, [peer, isInitiator, toast, roomId, userData]);

  useEffect(() => {
    setHasRated(false);
  }, [remoteUserId]);

  useEffect(() => {
    if (!roomId || !peer) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      const roomData = docSnap.data();
      if (roomData?.status === 'inactive' && peer) {
        handleCallEnded();
      }
    }, (error) => {
      console.error('Error in room status listener:', error);
    });

    return () => unsubscribe();
  }, [roomId, peer]);

  useEffect(() => {
    if (!remoteUserId || !userData?.id || !callStartTime) {
      return;
    }

    console.log('Setting up listener for ratings');

    const q = query(
      collection(db, 'ratings'),
      where('rateeId', '==', userData.id),
      where('raterId', '==', remoteUserId),
      where('createdAt', '>', callStartTime)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          setRemoteRatingReceived(true);
        }
      });
    }, (error) => {
      console.error('Listener error:', error);
    });

    return () => unsubscribe();
  }, [remoteUserId, userData?.id, callStartTime]);

  useEffect(() => {
    if (!peer || hasRated) {
      setCurrentRatingStep('idle');
    }
  }, [peer, hasRated]);

  // **JSX Return Statement**
  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50">
        <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
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
                flex={['1', 'none']}
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
                  {!loading && (
                    <HStack spacing={1}>
                      <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                      <Text fontSize="sm" fontWeight="medium">
                        {localRating.toFixed(1)}
                      </Text>
                    </HStack>
                  )}
                </HStack>
              </Box>

              <Box
                w={['100%', '45%']}
                h={['auto', '60vh']}
                flex={['1', 'none']}
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
                    {remoteUserId && !ratingLoading && (
                      <HStack spacing={1}>
                        <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                        <Text fontSize="sm" fontWeight="medium">
                          {remoteRating.toFixed(1)}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                )}
              </Box>
            </Flex>

            {peer && !hasRated && (
              <Suspense fallback={<Text>Loading rating interface...</Text>}>
                <Box w="100%" bg="white" p={6} borderRadius="2xl" boxShadow="xl">
                  <RatingScale
                    onRate={(rating, featureAllocations) => handleRating(rating, featureAllocations)}
                    onStepChange={setCurrentRatingStep}
                  />
                </Box>
              </Suspense>
            )}

            <HStack spacing={4} justify="center" flexWrap="wrap">
              {peer ? (
                <>
                  <IconButton
                    aria-label={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                    onClick={toggleAudio}
                    color={isAudioMuted ? 'error' : 'primary'}
                  >
                    {isAudioMuted ? <MicOff /> : <Mic />}
                  </IconButton>
                  <IconButton
                    aria-label={isVideoMuted ? 'Enable Video' : 'Disable Video'}
                    onClick={toggleVideo}
                    color={isVideoMuted ? 'error' : 'primary'}
                  >
                    {isVideoMuted ? <VideocamOff /> : <Videocam />}
                  </IconButton>
                  <Button
                    leftIcon={<Close />}
                    colorScheme="red"
                    size="lg"
                    px={8}
                    onClick={handleEndCall}
                    boxShadow="md"
                    _hover={{ transform: 'scale(1.05)' }}
                  >
                    Move on
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
                  Start Random Call
                </Button>
              )}
            </HStack>

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
      <Footer />
    </>
  );
}

export default VideoCall;