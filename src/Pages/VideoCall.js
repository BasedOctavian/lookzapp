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
  Icon,
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
import RatingScale from '../Components/RatingScale';

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
  const [hasRated, setHasRated] = useState(false); // New state to track rating submission
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating, loading } = useUserData();

  // Use useUserRatingData for remote user's rating
  const { submitRating: submitRemoteRating, rating: remoteRating, loading: ratingLoading } = useUserRatingData(remoteUserId);

  useEffect(() => {
    if (userData) {
      console.log('User data:', userData);
      console.log('User rating:', rating);
    }
  }, [userData, rating]);

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
  }, [peer, isInitiator, toast, roomId, userData]);

  // Reset hasRated when remoteUserId changes (new call session)
  useEffect(() => {
    setHasRated(false);
  }, [remoteUserId]);

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

  const handleRating = async (rating) => {
    if (!remoteUserId) {
      toast({
        title: 'Error',
        description: 'Cannot submit rating: Remote user ID not available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      await submitRemoteRating(rating);
      setHasRated(true); // Hide RatingScale after successful submission
      toast({
        title: 'Rating submitted',
        description: `You rated ${remoteUserName} ${rating}/10`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error submitting rating:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" p={{ base: 2, md: 4 }}>
      <Container maxW="100%" py={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading
              as="h1"
              size="xl"
              color="blue.700"
              fontWeight="bold"
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)"
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

          <Flex
            direction={['column', 'row']}
            w="100%"
            justify="center"
            align="center"
            gap={6}
            p={4}
            bg="white"
            borderRadius="xl"
            boxShadow="lg"
          >
            <Box
              w={['100%', '45%']}
              h={['40vh', '60vh']}
              borderWidth="2px"
              borderColor="gray.200"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
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
              >
                {userData?.displayName || 'You'}
              </Text>
            </Box>
            <Box
              w={['100%', '45%']}
              h={['40vh', '60vh']}
              borderWidth="2px"
              borderColor="gray.200"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
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
                >
                  Waiting for remote video...
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
                >
                  {remoteUserName || 'Remote'}
                </Text>
              )}
            </Box>
          </Flex>

          {/* Display both users' ratings */}
          <HStack spacing={4} justify="center" mt={4}>
            {!loading && (
              <Box textAlign="center">
                <Text fontWeight="bold">Your Rating</Text>
                <Text>{rating.toFixed(1)} / 10</Text>
              </Box>
            )}
            {remoteUserId && !ratingLoading && (
              <Box textAlign="center">
                <Text fontWeight="bold">{remoteUserName}'s Rating</Text>
                <Text>{remoteRating.toFixed(1)} / 10</Text>
              </Box>
            )}
          </HStack>

          <HStack spacing={{ base: 2, md: 4 }} justify="center" flexWrap="wrap">
            {peer ? (
              <>
                <IconButton
                  aria-label={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  icon={
                    isAudioMuted ? (
                      <Icon as={MicOff} color="white" w={6} h={6} />
                    ) : (
                      <Icon as={Mic} color="white" w={6} h={6} />
                    )
                  }
                  colorScheme={isAudioMuted ? 'red' : 'blue'}
                  size={{ base: 'md', md: 'lg' }}
                  variant="solid"
                  onClick={toggleAudio}
                />
                <IconButton
                  aria-label={isVideoMuted ? 'Enable Video' : 'Disable Video'}
                  icon={
                    isVideoMuted ? (
                      <Icon as={VideocamOff} color="white" w={6} h={6} />
                    ) : (
                      <Icon as={Videocam} color="white" w={6} h={6} />
                    )
                  }
                  colorScheme={isVideoMuted ? 'red' : 'blue'}
                  size={{ base: 'md', md: 'lg' }}
                  variant="solid"
                  onClick={toggleVideo}
                />
                <Button
                  leftIcon={<Icon as={Close} color="white" w={6} h={6} />}
                  colorScheme="red"
                  size={{ base: 'md', md: 'lg' }}
                  px={6}
                  onClick={handleEndCall}
                  _hover={{ bg: 'red.600' }}
                >
                  End Call
                </Button>
              </>
            ) : (
              <Button
                leftIcon={<Icon as={Phone} color="white" w={6} h={6} />}
                colorScheme="teal"
                size={{ base: 'md', md: 'lg' }}
                px={6}
                onClick={handleStart}
                _hover={{ bg: 'teal.600' }}
              >
                Start Call
              </Button>
            )}
          </HStack>

          {/* Show RatingScale only if peer is active and hasn't rated */}
          {peer && !hasRated && (
            <RatingScale onRate={(rating) => handleRating(rating)} />
          )}

          {roomId && (
            <Text
              fontSize={['sm', 'md']}
              color="gray.700"
              textAlign="center"
              bg="white"
              p={3}
              borderRadius="md"
              boxShadow="sm"
            >
              Room ID: <strong>{roomId}</strong> |{' '}
              {isInitiator ? 'Initiator' : 'Receiver'} | {connectionStatus}
            </Text>
          )}
          {error && (
            <Text
              fontSize={['sm', 'md']}
              color="red.600"
              textAlign="center"
              bg="red.50"
              p={3}
              borderRadius="md"
              boxShadow="sm"
            >
              {error}
            </Text>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

export default VideoCall;