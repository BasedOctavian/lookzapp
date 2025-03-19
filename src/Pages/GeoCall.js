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
import { IconButton } from '@mui/material';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 0,
  lng: 0,
};

function GeoCall() {
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
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { userData } = useUserData();
  const [guessLocation, setGuessLocation] = useState(null);
  const [localLocation, setLocalLocation] = useState(null);
  const [remoteLocation, setRemoteLocation] = useState(null);
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [localGuessCount, setLocalGuessCount] = useState(0);
  const [localLastGuessCorrect, setLocalLastGuessCorrect] = useState(null);
  const [remoteGuessCount, setRemoteGuessCount] = useState(0);
  const [remoteLastGuessCorrect, setRemoteLastGuessCorrect] = useState(null);
  const [localGameOver, setLocalGameOver] = useState(false);
  const [remoteGameOver, setRemoteGameOver] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [localGuesses, setLocalGuesses] = useState([]);
  const [localClosestDistance, setLocalClosestDistance] = useState(Infinity);
  const [remoteClosestDistance, setRemoteClosestDistance] = useState(Infinity);

  // Get Local Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocalLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocalLocation(null);
        }
      );
    } else {
      console.error('Geolocation not supported');
      setLocalLocation(null);
    }
  }, []);

  // Send Location When Data Channel Opens
  useEffect(() => {
    if (peer && isDataChannelOpen && localLocation) {
      try {
        peer.send(JSON.stringify({
          type: 'location',
          lat: localLocation.lat,
          lng: localLocation.lng,
        }));
      } catch (err) {
        console.error('Error sending location:', err);
      }
    }
  }, [localLocation, peer, isDataChannelOpen]);

  // Access Media Devices
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

  // Peer Event Handlers
  useEffect(() => {
    if (!peer) {
      setConnectionStatus('');
      return;
    }

    const handleConnect = () => {
      setConnectionStatus('Connected');
      setIsDataChannelOpen(true);
      if (localLocation) {
        peer.send(JSON.stringify({
          type: 'location',
          lat: localLocation.lat,
          lng: localLocation.lng,
        }));
      }
      if (userData && userData.id) {
        peer.send(JSON.stringify({
          displayName: userData.displayName,
          userId: userData.id,
        }));
      }
      peer.send(JSON.stringify({
        type: 'guessUpdate',
        guessCount: localGuessCount,
        lastGuessCorrect: localLastGuessCorrect,
        gameOver: localGameOver,
        closestDistance: localClosestDistance,
      }));
    };

    const handleData = (data) => {
      try {
        const remoteData = JSON.parse(data);
        if (remoteData.type === 'location') {
          setRemoteLocation({ lat: remoteData.lat, lng: remoteData.lng });
        } else if (remoteData.type === 'guessUpdate') {
          setRemoteGuessCount(remoteData.guessCount);
          setRemoteLastGuessCorrect(remoteData.lastGuessCorrect);
          setRemoteGameOver(remoteData.gameOver);
          setRemoteClosestDistance(remoteData.closestDistance);
        } else {
          setRemoteUserName(remoteData.displayName);
          setRemoteUserId(remoteData.userId);
        }
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
          const roomRef = doc(db, 'geoRooms', roomId);
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
  }, [peer, isInitiator, toast, roomId, userData, localGuessCount, localLastGuessCorrect, localGameOver, localClosestDistance]);

  // Room Creation
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
        const roomRef = await addDoc(collection(db, 'geoRooms'), {
          status: 'waiting',
          offer,
          answer: null,
        });
        setRoomId(roomRef.id);

        onSnapshot(doc(db, 'geoRooms', roomRef.id), (docSnap) => {
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
            const roomRef = doc(db, 'geoRooms', roomId);
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

  // Join Room
  const handleJoinRoom = async (roomId) => {
    setIsInitiator(false);
    setError('');
    try {
      const roomRef = doc(db, 'geoRooms', roomId);
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
            const roomRef = doc(db, 'geoRooms', roomId);
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

  // Reuse Room
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
      const roomRef = doc(db, 'geoRooms', existingRoomId);
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
          const roomRef = doc(db, 'geoRooms', roomId);
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

  // Start Call
  const handleStart = async () => {
    try {
      const roomsQuery = query(
        collection(db, 'geoRooms'),
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

  // End Call
  const handleEndCall = () => {
    if (peer) {
      peer.destroy();
      handleCallEnded();
    }
  };

  // Handle Call Ended
  const handleCallEnded = async () => {
    if (roomId) {
      try {
        const roomRef = doc(db, 'geoRooms', roomId);
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
    setLocalGuessCount(0);
    setLocalLastGuessCorrect(null);
    setRemoteGuessCount(0);
    setRemoteLastGuessCorrect(null);
    setLocalGameOver(false);
    setRemoteGameOver(false);
    setLocalGuesses([]);
    setGuessLocation(null);
    setRemoteLocation(null);
    setLocalClosestDistance(Infinity);
    setRemoteClosestDistance(Infinity);
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

  // Handle Map Click
  const handleMapClick = (event) => {
    if (!isMapLoaded || localGameOver) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setGuessLocation({ lat, lng });
  };

  // Submit Guess
  const handleSubmitGuess = () => {
    if (localGuessCount >= 3 || localGameOver) return;
    if (guessLocation && remoteLocation && window.google) {
      const guessLatLng = new window.google.maps.LatLng(guessLocation.lat, guessLocation.lng);
      const remoteLatLng = new window.google.maps.LatLng(remoteLocation.lat, remoteLocation.lng);
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(guessLatLng, remoteLatLng);
      const distanceInMiles = distance / 1609.34;
      const isCorrect = distanceInMiles <= 500;
      const newGuessCount = localGuessCount + 1;

      setLocalGuessCount(newGuessCount);
      setLocalLastGuessCorrect(isCorrect);
      setLocalGuesses((prev) => [...prev, { location: guessLocation, isCorrect, distance: distanceInMiles }]);

      if (distanceInMiles < localClosestDistance) {
        setLocalClosestDistance(distanceInMiles);
      }

      if (isCorrect || newGuessCount >= 3) {
        setLocalGameOver(true);
      }

      if (peer) {
        peer.send(JSON.stringify({
          type: 'guessUpdate',
          guessCount: newGuessCount,
          lastGuessCorrect: isCorrect,
          gameOver: isCorrect || newGuessCount >= 3,
          closestDistance: Math.min(localClosestDistance, distanceInMiles),
        }));
      }

      const distanceText = `Distance: ${distanceInMiles.toFixed(2)} miles`;
      if (isCorrect) {
        toast({
          title: 'Correct Guess!',
          description: `${distanceText}. You guessed within 500 miles in ${newGuessCount} guesses.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (newGuessCount < 3) {
        toast({
          title: 'Incorrect Guess',
          description: `${distanceText}. Not within 500 miles. You have ${3 - newGuessCount} guesses left.`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Game Over',
          description: `You did not guess within 500 miles after 3 attempts. Closest: ${localClosestDistance.toFixed(2)} miles.`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      console.log('Cannot calculate distance: missing location data');
    }
  };

  // Determine Video Border Color
  const getBorderColor = (guessCount, lastGuessCorrect, gameOver) => {
    if (gameOver) {
      if (lastGuessCorrect) {
        return 'green.500';
      } else if (guessCount >= 3) {
        return 'red.500';
      }
    }
    return 'gray.100';
  };

  // Compute Game Result
  const computeGameResult = () => {
    if (!localGameOver || !remoteGameOver) return null;

    if (localLastGuessCorrect && remoteLastGuessCorrect) {
      // Both guessed correctly, winner is the one with the closer guess
      if (localClosestDistance < remoteClosestDistance) {
        return 'win';
      } else {
        return 'lose';
      }
    } else if (localLastGuessCorrect) {
      // Only local player guessed correctly
      return 'win';
    } else if (remoteLastGuessCorrect) {
      // Only remote player guessed correctly
      return 'lose';
    } else {
      // Neither guessed correctly, winner is the one with the closer guess
      if (localClosestDistance < remoteClosestDistance) {
        return 'win';
      } else {
        return 'lose';
      }
    }
  };

  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* Header */}
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

      {/* Rules Section */}
      {showRules && (
        <Container maxW="container.xl" py={2}>
          <Box bg="blue.100" p={4} borderRadius="md" mb={4} position="relative">
            <Text fontSize="md" fontWeight="bold">Game Rules:</Text>
            <Text fontSize="sm">
              - Each player has 3 guesses to guess the opponent's location within 500 miles.<br />
              - A correct guess within 500 miles turns your video outline green.<br />
              - Running out of guesses turns your video outline red.<br />
              - If both guess correctly, the closer guess wins. If neither guesses correctly, the closest guess wins.<br />
              - The game ends when both players have finished guessing.
            </Text>
            <Button
              mt={4}
              colorScheme="yellow"
              variant="solid"
              onClick={() => setShowRules(false)}
            >
              Close
            </Button>
          </Box>
        </Container>
      )}

      {/* Main Content */}
      <Container maxW="container.xl" py={{ base: 4, md: 6 }} position="relative">
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          {/* Map and Remote Video Container */}
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
            minH="70vh"
          >
            {/* Map Component */}
            <Box
              w={['100%', '60%']}
              h={['40vh', '60vh']}
              borderWidth="2px"
              borderColor="gray.100"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="lg"
              position="relative"
            >
              {mapLoadError ? (
                <VStack justify="center" h="100%">
                  <Text color="red.500">Failed to load map. Please try again.</Text>
                  <Button
                    onClick={() => {
                      setIsMapLoaded(false);
                      setMapLoadError(false);
                      setMapKey((prev) => prev + 1);
                    }}
                  >
                    Retry
                  </Button>
                </VStack>
              ) : (
                <LoadScript
                  key={mapKey}
                  googleMapsApiKey="AIzaSyCvuEqGfe2JN51zV6mwJJuCGW5Z_xVvWp8" // Replace with your actual API key
                  libraries={['geometry']}
                  onError={() => setMapLoadError(true)}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={2}
                    center={defaultCenter}
                    onClick={handleMapClick}
                    onLoad={() => setIsMapLoaded(true)}
                  >
                    {guessLocation && <Marker position={guessLocation} />}
                    {localGuesses.map((guess, index) => (
                      <Marker
                        key={index}
                        position={guess.location}
                        icon={{
                          url: guess.isCorrect
                            ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        }}
                      />
                    ))}
                    {localGameOver && remoteGameOver && remoteLocation && (
                      <Marker
                        position={remoteLocation}
                        icon={{
                          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              )}
            </Box>

            {/* Remote Video */}
            <Box
              w={['100%', '35%']}
              h={['40vh', '60vh']}
              borderWidth="4px"
              borderColor={getBorderColor(remoteGuessCount, remoteLastGuessCorrect, remoteGameOver)}
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
                <Box
                  position="absolute"
                  bottom="2"
                  left="2"
                  color="white"
                  bg="rgba(0, 0, 0, 0.6)"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {remoteUserName || 'Stranger'}
                  </Text>
                  <Text fontSize="xs">Guesses: {remoteGuessCount}/3</Text>
                  {remoteLastGuessCorrect !== null && (
                    <Text fontSize="xs">
                      Last Guess: {remoteLastGuessCorrect ? '✓' : '✗'}
                    </Text>
                  )}
                  <Text fontSize="xs">
                    Closest: {remoteClosestDistance === Infinity ? 'N/A' : `${remoteClosestDistance.toFixed(2)} mi`}
                  </Text>
                </Box>
              )}
            </Box>
          </Flex>

          {/* Local Video Overlay */}
          <Box
            position="absolute"
            bottom="4"
            left="4"
            w={['120px', '200px']}
            h={['90px', '150px']}
            borderWidth="4px"
            borderColor={getBorderColor(localGuessCount, localLastGuessCorrect, localGameOver)}
            borderRadius="xl"
            overflow="hidden"
            boxShadow="lg"
            bg="black"
            zIndex="popover"
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Box
              position="absolute"
              bottom="2"
              left="2"
              color="white"
              bg="rgba(0, 0, 0, 0.6)"
              px={2}
              py={1}
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="medium">
                {userData?.displayName || 'You'}
              </Text>
              <Text fontSize="xs">Guesses: {localGuessCount}/3</Text>
              {localLastGuessCorrect !== null && (
                <Text fontSize="xs">
                  Last Guess: {localLastGuessCorrect ? '✓' : '✗'}
                </Text>
              )}
              <Text fontSize="xs">
                Closest: {localClosestDistance === Infinity ? 'N/A' : `${localClosestDistance.toFixed(2)} mi`}
              </Text>
            </Box>
          </Box>

          {/* Game Result */}
          {computeGameResult() && (
            <Box textAlign="center" mt={4}>
              <Text fontSize="xl" fontWeight="bold">
                {computeGameResult() === 'win' ? 'You won!' : 'You lost!'}
              </Text>
              <Text fontSize="sm">
                Your closest: {localClosestDistance.toFixed(2)} mi vs Opponent’s closest: {remoteClosestDistance.toFixed(2)} mi
              </Text>
            </Box>
          )}

          {/* Call Controls */}
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
                  End Call
                </Button>
                {!localGameOver && (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleSubmitGuess}
                    isDisabled={!isMapLoaded || !guessLocation || !remoteLocation}
                  >
                    Submit Guess
                  </Button>
                )}
                {localGameOver && !remoteGameOver && (
                  <Text>Waiting for opponent to finish their guesses...</Text>
                )}
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

export default GeoCall;