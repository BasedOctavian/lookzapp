import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import {
  ChakraProvider,
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
import { db } from './firebase';
import { useToast } from '@chakra-ui/toast';
import {
  Phone,
  Close,
  MicOff,
  Mic,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';
import { system } from '@chakra-ui/react/preset';

function App() {
  const [roomId, setRoomId] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);
  const [error, setError] = useState('');
  const [peer, setPeer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const toast = useToast();

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
    const handleConnect = () => setConnectionStatus('Connected');
    const handleError = (err) => {
      console.error('Peer error:', err);
      setError('Connection error');
      toast({
        title: 'Connection error',
        description: 'An error occurred with the connection',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    };
    const handleClose = () => setConnectionStatus('Call ended');

    peer.on('connect', handleConnect);
    peer.on('error', handleError);
    peer.on('close', handleClose);

    setConnectionStatus(isInitiator ? 'Waiting for connection...' : 'Connecting...');

    return () => {
      peer.off('connect', handleConnect);
      peer.off('error', handleError);
      peer.off('close', handleClose);
    };
  }, [peer, isInitiator, toast]);

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

      newPeer.on('error', (err) => console.error('Peer error:', err));
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

      newPeer.on('error', (err) => console.error('Peer error:', err));
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

    newPeer.on('error', (err) => console.error('Peer error:', err));
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

  return (
    <ChakraProvider value={system}>
      <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" p={4}>
        <Container maxW="100%" py={6}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Heading
              as="h1"
              size="xl"
              textAlign="center"
              color="blue.700"
              fontWeight="bold"
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)"
            >
              Lookzapp
            </Heading>

            {/* Video Section */}
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
                  style={{ width: '100%', height: 'auto', display: 'block' }}
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
                  You
                </Text>
              </Box>
              <Box
                w={['100%', '45%']}
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
                  style={{ width: '100%', height: 'auto', display: 'block' }}
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
                    Remote
                  </Text>
                )}
              </Box>
            </Flex>

            {/* Controls */}
            <HStack spacing={4} justify="center" flexWrap="wrap">
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
                    size="lg"
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
                    size="lg"
                    variant="solid"
                    onClick={toggleVideo}
                  />
                  <Button
                    leftIcon={<Icon as={Close} color="white" w={6} h={6} />}
                    colorScheme="red"
                    size="lg"
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
                  size="lg"
                  px={6}
                  onClick={handleStart}
                  _hover={{ bg: 'teal.600' }}
                >
                  Start Call
                </Button>
              )}
            </HStack>

            {/* Status and Info */}
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
    </ChakraProvider>
  );
}

export default App;