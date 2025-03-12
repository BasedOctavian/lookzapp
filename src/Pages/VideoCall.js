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
  Circle,
  Grid,
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
import { Divider } from '@mui/material';
import { Fade } from '@chakra-ui/transition';
import { IconButton } from "@mui/material";



// RatingScale Component with Emoji Icons and Dual-Step Rating
const RatingScale = ({ onRate }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showCategories, setShowCategories] = useState(false);

  const [blue400, pink400, purple400, teal400, orange400] = useToken(
    'colors',
    ['blue.400', 'pink.400', 'purple.400', 'teal.400', 'orange.400']
  );

  const categories = [
    { category: 'Eyes', emoji: '👀', color: blue400 },
    { category: 'Smile', emoji: '😊', color: pink400 },
    { category: 'Jawline', emoji: '👤', color: purple400 },
    { category: 'Hair', emoji: '💇', color: teal400 },
    { category: 'Body', emoji: '💪', color: orange400 },
  ];

  const handleNumberClick = (rating) => {
    setSelectedRating(rating);
    setShowNumbers(false);
    setShowCategories(true);
  };

  const handleCategoryClick = (category) => {
    onRate(selectedRating, category);
    setShowCategories(false);
  };

  return (
    <Box textAlign="center" mt={4} p={6} bg="white" borderRadius="2xl" boxShadow="xl">
      <Fade in={showNumbers}>
        {showNumbers && (
          <>
            <Heading size="md" mb={6} color="gray.700" fontWeight="semibold">
              How would you rate this appearance?
            </Heading>
            <Flex wrap="wrap" gap={3} justify="center">
              {[...Array(10)].map((_, i) => (
                <Circle
                  key={i + 1}
                  size="50px"
                  bgGradient="linear(to-br, blue.400, purple.500)"
                  color="blue.600"
                  cursor="pointer"
                  _hover={{ transform: 'scale(1.1)', shadow: 'lg' }}
                  onClick={() => handleNumberClick(i + 1)}
                  transition="all 0.2s cubic-bezier(.27,.67,.47,1.6))"
                  fontSize="lg"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  {i + 1}
                </Circle>
              ))}
            </Flex>
          </>
        )}
      </Fade>

      <Fade in={showCategories}>
        {showCategories && (
          <>
            <VStack spacing={4}>
              <Heading size="md" color="gray.700" fontWeight="semibold">
                Select the most impressive feature
                <Text fontSize="sm" color="gray.500" mt={1}>
                  (You rated {selectedRating}/10)
                </Text>
              </Heading>

              <Divider borderColor="gray.200" />

              <Grid templateColumns="repeat(auto-fit, minmax(100px, 1fr))" gap={5} w="100%">
                {categories.map(({ category, emoji, color }) => (
                  <Box
                    key={category}
                    as="button"
                    p={3}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.100"
                    _hover={{
                      transform: 'scale(1.05)',
                      borderColor: color,
                      boxShadow: `0 0 12px ${color}`,
                    }}
                    transition="all 0.2s cubic-bezier(.27,.67,.47,1.6))"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <VStack spacing={2}>
                      <Text fontSize="4xl">{emoji}</Text>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        {category}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </Grid>
            </VStack>
          </>
        )}
      </Fade>
    </Box>
  );
};

function VideoCall() {
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
  const [hasRated, setHasRated] = useState(false);
  const [initialRating, setInitialRating] = useState(null);
  const [remoteRatingReceived, setRemoteRatingReceived] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading } = useUserData();
  const headerBg = 'rgba(255, 255, 255, 0.8)';
  const featureColors = ['blue.400', 'pink.400', 'purple.400', 'teal.400', 'orange.400'];
  const {
    submitRating: submitRemoteRating,
    rating: remoteRating,
    loading: ratingLoading,
  } = useUserRatingData(remoteUserId);
  const [remoteDataReceived, setRemoteDataReceived] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Failed to access media devices:', err);
        setError('Failed to access camera/microphone');
      });
  }, []);
  

  useEffect(() => {
    if (!peer) {
      setConnectionStatus('');
      return;
    }

    

    const handleConnect = () => {
      setConnectionStatus('Connected');
      setInitialRating(localRating.toFixed(1));
      if (userData && userData.id) {
        peer.send(JSON.stringify({ displayName: userData.displayName, userId: userData.id }));
      }
    };

    const handleData = (data) => {
      try {
        const remoteData = JSON.parse(data);
        setRemoteUserName(remoteData.displayName);
        setRemoteUserId(remoteData.userId);
        setRemoteDataReceived(true);
        console.log('Received remote data:', { remoteUserId: remoteData.userId, localUserId: userData.id });
        setRemoteRatingReceived(true);
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
      if (roomId) {
        try {
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, {
            status: 'inactive',
            offer: null,
            answer: null,
          });
        } catch (updateErr) {
          console.error('Error updating room status:', updateErr);
        }
      }
    };

    const handleClose = () => setConnectionStatus('Call ended');

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
  }, [peer, isInitiator, toast, roomId, userData, localRating]);


  useEffect(() => {
    setHasRated(false);
  }, [remoteUserId]);

  useEffect(() => {
    if (!peer && remoteDataReceived){
      console.log('remote rating', remoteRatingReceived)
      console.log('Navigating to updates');
      handleCallEnded();
    }
   
  }, [peer, remoteRatingReceived]);

  // Listen for remote user's rating of the local user
  useEffect(() => {
    if (!remoteUserId || !userData?.id) {
      console.log('Skipping rating listener: missing remoteUserId or userData.id');
      return;
    }

    const q = query(
      collection(db, 'ratings'),
      where('rateeId', '==', userData.id),
      where('raterId', '==', remoteUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Rating snapshot:', {
        size: snapshot.size,
        docs: snapshot.docs.map(doc => doc.data())
      });
      setRemoteRatingReceived(snapshot.size > 0);
    }, (error) => {
      console.error('Error in rating listener:', error);
      toast({
        title: 'Rating listener error',
        description: 'Failed to monitor ratings: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    return () => unsubscribe();
  }, [remoteUserId, userData?.id, toast]);

  // Redirect to Updates page when both users have rated each other
  useEffect(() => {
    if (hasRated && remoteRatingReceived && !redirected) {
      console.log('Redirecting to /updates with initialRating:', initialRating);
      setRedirected(true);
      navigate('/updates', { state: { initialRating } });
    }
  }, [hasRated, remoteRatingReceived, initialRating, navigate, redirected]);

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
        navigate('/updates', { state: { initialRating } });
        setError('Connection error');
        toast({
          title: 'Connection error',
          description: 'An error occurred with the connection',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        if (roomId) {
          try {
            const roomRef = doc(db, 'rooms', roomId);
            await updateDoc(roomRef, {
              status: 'inactive',
              offer: null,
              answer: null,
            });
          } catch (updateErr) {
            console.error('Error updating room status:', updateErr);
          }
        }
      });
  
      newPeer.on('close', () => handleCallEnded());
  
      // Add ICE connection state listener
      newPeer._pc.oniceconnectionstatechange = () => {
        if (
          newPeer._pc.iceConnectionState === 'disconnected' ||
          newPeer._pc.iceConnectionState === 'failed'
        ) {
          console.log('ICE connection lost:', newPeer._pc.iceConnectionState);
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
        navigate('/updates', { state: { initialRating } });
        toast({
          title: 'Connection error',
          description: 'An error occurred with the connection',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        if (roomId) {
          try {
            const roomRef = doc(db, 'rooms', roomId);
            await updateDoc(roomRef, {
              status: 'inactive',
              offer: null,
              answer: null,
            });
          } catch (updateErr) {
            console.error('Error updating room status:', updateErr);
          }
        }
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
      if (roomId) {
        try {
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, {
            status: 'inactive',
            offer: null,
            answer: null,
          });
        } catch (updateErr) {
          console.error('Error updating room status:', updateErr);
        }
      }
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

    if (initialRating){
      console.log(initialRating);
      navigate('/updates', { state: { initialRating } });
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

  const handleRating = (newRating, selectedFeature) => {
    console.log(`Submitting rating: ${newRating} for ${selectedFeature} to ${remoteUserId}`);
    submitRemoteRating(newRating, selectedFeature)
      .then(() => {
        setHasRated(true);
        console.log('Rating submitted successfully');
      })
      .catch((err) => {
        console.error('Error submitting rating:', err);
        toast({
          title: 'Rating error',
          description: 'Failed to submit rating',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* Modern Sticky Header */}
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(10px)"
        zIndex="sticky"
        borderBottomWidth="1px"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading
              as="h1"
              size="xl"
              color="blue.700"
              fontWeight="bold"
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)"
              onClick={() => navigate('/')}
            >
              Lookzapp
            </Heading>
            <HStack spacing={4}>
              <Button
                variant="link"
                color="blue.500"
                fontWeight="medium"
                onClick={() => navigate('/top-rated-users')}
              >
                Top Rated Users
              </Button>
              <Button
                variant="link"
                color="red.500"
                fontWeight="medium"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          {/* Video Containers */}
          <Flex
            direction={['column', 'row']}
            w="100%"
            justify="center"
            align="center"
            gap={6}
            p={4}
            bg="white"
            borderRadius="2xl"
            boxShadow="xl"
          >
            {/* Local Video */}
            <Box
              w={['100%', '45%']}
              h={['40vh', '60vh']}
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
              <Text
                position="absolute"
                bottom="2"
                left="2"
                color="white"
                bg="rgba(0, 0, 0, 0.6)"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="sm"
                fontWeight="medium"
              >
                {userData?.displayName || 'You'}
              </Text>
            </Box>

            {/* Remote Video */}
            <Box
              w={['100%', '45%']}
              h={['40vh', '60vh']}
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
                <Text
                  position="absolute"
                  bottom="2"
                  left="2"
                  color="white"
                  bg="rgba(0, 0, 0, 0.6)"
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {remoteUserName || 'Stranger'}
                </Text>
              )}
            </Box>
          </Flex>

          {/* Ratings Display */}
          <HStack spacing={6} justify="center" w="100%">
            {!loading && (
              <Box
                textAlign="center"
                bg="white"
                p={4}
                borderRadius="xl"
                boxShadow="md"
              >
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Your Rating
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {localRating.toFixed(1)}
                </Text>
              </Box>
            )}
            {remoteUserId && !ratingLoading && (
              <Box
                textAlign="center"
                bg="white"
                p={4}
                borderRadius="xl"
                boxShadow="md"
              >
                <Text fontSize="sm" color="gray.500" mb={1}>
                  {remoteUserName}'s Rating
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {remoteRating.toFixed(1)}
                </Text>
              </Box>
            )}
          </HStack>

          {/* Call Controls */}
          <HStack spacing={4} justify="center" flexWrap="wrap">
            {peer ? (
              <>
                <IconButton
                  aria-label={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
                  onClick={toggleAudio}
                  color={isAudioMuted ? "error" : "primary"}
                >
                  {isAudioMuted ? <MicOff /> : <Mic />}
                </IconButton>

                <IconButton
                  aria-label={isVideoMuted ? "Enable Video" : "Disable Video"}
                  onClick={toggleVideo}
                  color={isVideoMuted ? "error" : "primary"}
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
              >
                Start Random Call
              </Button>
            )}
          </HStack>

          {/* Rating Interface */}
          {peer && !hasRated && (
            <Box w="100%" bg="white" p={6} borderRadius="2xl" boxShadow="xl">
              <RatingScale onRate={(rating, feature) => handleRating(rating, feature)} />
            </Box>
          )}

          {/* Status Indicators */}
          <VStack spacing={2} w="100%">
            {roomId && (
              <Text
                fontSize="sm"
                color="gray.600"
                textAlign="center"
                bg="white"
                p={3}
                borderRadius="lg"
                boxShadow="sm"
              >
                Connection ID: <strong>{roomId}</strong> • {connectionStatus}
              </Text>
            )}
            {error && (
              <Text
                fontSize="sm"
                color="red.600"
                textAlign="center"
                bg="red.50"
                p={3}
                borderRadius="lg"
                boxShadow="sm"
              >
                {error}
              </Text>
            )}
          </VStack>
        </VStack>
      </Container>
    </Flex>
  );
}

export default VideoCall;