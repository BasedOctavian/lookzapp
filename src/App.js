import React, { useState, useEffect } from 'react';
import { ChakraProvider, Button, Flex, Box, Text } from '@chakra-ui/react';
import { system } from '@chakra-ui/react/preset';
import VideoCall from './Pages/VideoCall';
import CreateAccount from './Pages/CreateAccount';
import SignIn from './Pages/SignIn';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './Pages/PrivateRoute';
import TopRatedUsersTable from './Pages/TopRatedUsersTable';
import Profile from './Pages/Profile/Profile';
import HomeScreen from './Pages/HomeScreen';
import Updates from './Pages/Updates';
import GeoCall from './Pages/GeoCall';
import TwoTruths from './Pages/TwoTruths';
import GetRankedSelection from './Pages/GetRankedSelection';
import GetRanked from './Pages/GetRanked';
import InfluencerProfile from './Pages/Profile/InfluencerProfile';
import Analyze from './Pages/Analyze';
import Admin from './Pages/Admin/Admin';
import Looksmatch from './Pages/Looksmatch';
import GamesSelection from './Pages/GamesSelection';
import AnalyzeSelection from './Pages/AnalyzeSelection';
import AutismAnalytic from './Pages/AutismAnalytic';

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
          <Route path="/leaderboard" element={<PrivateRoute><TopRatedUsersTable /></PrivateRoute>} />
          <Route path="/video-chat" element={<PrivateRoute><VideoCall /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/influencer-profile/:influencerId" element={<PrivateRoute><InfluencerProfile /></PrivateRoute>} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/updates" element={<PrivateRoute><Updates /></PrivateRoute>} />
          <Route path="/geo-locate" element={<PrivateRoute><GeoCall /></PrivateRoute>} />
          <Route path="/two-truths" element={<PrivateRoute><TwoTruths /></PrivateRoute>} />
          <Route path="/analysis" element={<PrivateRoute><Analyze /></PrivateRoute>} />
          <Route path="/looksmatch" element={<PrivateRoute><Looksmatch /></PrivateRoute>} />
          <Route path="/get-ranked-selection" element={<GetRankedSelection />} />
          <Route path="/ranking" element={<GetRanked />} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/games-selection" element={<PrivateRoute><GamesSelection /></PrivateRoute>} />
          <Route path="/analyze-selection" element={<PrivateRoute><AnalyzeSelection /></PrivateRoute>} />
          <Route path="/autism-analytic" element={<AutismAnalytic />} />
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