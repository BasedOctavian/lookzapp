import React, { useState, useEffect } from 'react';
import { ChakraProvider, Button, Flex, Box, Text } from '@chakra-ui/react';
import { system } from '@chakra-ui/react/preset';
import VideoCall from './Pages/VideoCall';
import CreateAccount from './Pages/CreateAccount';
import SignIn from './Pages/SignIn';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './Pages/PrivateRoute';
import TopRatedUsersTable from './Pages/TopRatedUsersTable';
import Profile from './Pages/Profile';
import HomeScreen from './Pages/HomeScreen';
import Updates from './Pages/Updates';
import GeoCall from './Pages/GeoCall';

function App() {
  // State to show or hide the warning overlay
  const [showWarning, setShowWarning] = useState(false);

  // Check if the user has seen the warning before
  useEffect(() => {
    const hasSeenWarning = localStorage.getItem('hasSeenWarning');
    if (!hasSeenWarning) {
      setShowWarning(true);
    }
  }, []);

  // Handle the button click to dismiss the warning
  const handleAcknowledge = () => {
    localStorage.setItem('hasSeenWarning', 'true');
    setShowWarning(false);
  };

  return (
    <ChakraProvider value={system}>
      <Router>
        <Routes>
          <Route path="/createaccount" element={<CreateAccount />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/top-rated-users" element={<PrivateRoute><TopRatedUsersTable /></PrivateRoute>} />
          <Route path="/video-call" element={<PrivateRoute><VideoCall /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
          <Route path="/updates" element={<PrivateRoute><Updates /></PrivateRoute>} />
          <Route path="/geo-call" element={<PrivateRoute><GeoCall /></PrivateRoute>} />
        </Routes>

        {/* Custom warning overlay */}
        {showWarning && (
          <Flex
            position="fixed"
            top="0"
            left="0"
            width="100vw"
            height="100vh"
            alignItems="center"
            justifyContent="center"
            bg="rgba(0, 0, 0, 0.5)"
            backdropFilter="blur(10px)"
            zIndex="1000"
          >
            <Box
              bg="white"
              p="8"
              borderRadius="md"
              boxShadow="lg"
              textAlign="center"
              maxWidth="500px"
            >
              <Text fontSize="2xl" fontWeight="bold" mb="4">
                Warning
              </Text>
              <Text mb="6">
              This site facilitates video chatting but does not monitor or control user interactions. Users are fully responsible for their actions. We disclaim liability for any content shared. By using this service, you agree to comply with all laws and our terms. Report any issues immediately.
              </Text>
              <Button colorScheme="blue" onClick={handleAcknowledge}>
                I understand
              </Button>
            </Box>
          </Flex>
        )}
      </Router>
    </ChakraProvider>
  );
}

export default App;