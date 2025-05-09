import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { ChakraProvider, Button, Flex, Box, Text, Spinner } from '@chakra-ui/react';
import { system } from '@chakra-ui/react/preset';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import PrivateRoute from './Pages/PrivateRoute';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoadingIndicator from './Components/LoadingIndicator';
import OneWord from './Components/OneWord';
import OneWordPage from './Pages/OneWordPage';
import Soon from './Pages/Soon';

// Lazy load components for better performance
const VideoCall = lazy(() => import('./Pages/VideoCall'));
const CreateAccount = lazy(() => import('./Pages/CreateAccount'));
const SignIn = lazy(() => import('./Pages/SignIn'));
const VerifyEmail = lazy(() => import('./Pages/VerifyEmail'));
const TopRatedUsersTable = lazy(() => import('./Pages/TopRatedUsersTable'));
const Profile = lazy(() => import('./Pages/Profile/Profile'));
const HomeScreen = lazy(() => import('./Pages/HomeScreen'));
const Updates = lazy(() => import('./Pages/Updates'));
const GeoCall = lazy(() => import('./Pages/GeoCall'));
const TwoTruths = lazy(() => import('./Pages/TwoTruths'));
const GetRankedSelection = lazy(() => import('./Pages/GetRankedSelection'));
const GetRanked = lazy(() => import('./Pages/GetRanked'));
const InfluencerProfile = lazy(() => import('./Pages/Profile/InfluencerProfile'));
const Analyze = lazy(() => import('./Pages/Analyze'));
const Admin = lazy(() => import('./Pages/Admin/Admin'));
const Looksmatch = lazy(() => import('./Pages/Looksmatch'));
const Selection = lazy(() => import('./Pages/Selection'));
//const AnalyzeSelection = lazy(() => import('./Pages/AnalyzeSelection'));
const AutismAnalytic = lazy(() => import('./Pages/AutismAnalytic'));
const GeekedGuess = lazy(() => import('./Pages/GeekedGuess'));
const LandingPage = lazy(() => import('./Pages/LandingPage'));
const Octavian = lazy(() => import('./Pages/OctavianLandingPage'));
const ScanLimitPage = lazy(() => import('./Components/ScanLimitPage'));
const LiarScore = lazy(() => import('./Pages/LiarScore'));
const GroupLiarScore = lazy(() => import('./Pages/GroupLiarScore'));
const Criminality = lazy(() => import('./Pages/Criminality'));
const SusMeter = lazy(() => import('./Pages/SusMeter'));
const CelebBlur = lazy(() => import('./Pages/CelebBlur'));
const InfluencerBlur = lazy(() => import('./Pages/InfluencerBlur'));
const WhoDoneIt = lazy(() => import('./Pages/WhoDoneIt'));
const TimelineMatch = lazy(() => import('./Pages/TimelineMatch'));
const ScandalMatch = lazy(() => import('./Pages/ScandalMatch'));
const MoralScore = lazy(() => import('./Pages/MoralScore'));
const LogicalProfile = lazy(() => import('./Pages/LogicalProfile'));
const LifePredictor = lazy(() => import('./Pages/LifePredictor'));
// Create MUI theme
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Loading component for Suspense
const LoadingSpinner = () => (
  <LoadingIndicator
    message="Loading..."
    subMessage="Please wait while we prepare your experience"
  />
);

function App() {
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState(null);
  const hasPrintedArt = useRef(false);

  useEffect(() => {
    try {
      const hasSeenWarning = localStorage.getItem('hasSeenWarning');
      if (!hasSeenWarning) {
        setShowWarning(false);
      }
      
      if (!hasPrintedArt.current) {
        console.log(`
██╗░░░░░░█████╗░░█████╗░██╗░░██╗███████╗░█████╗░██████╗░██████╗░
██║░░░░░██╔══██╗██╔══██╗██║░██╔╝╚════██║██╔══██╗██╔══██╗██╔══██╗
██║░░░░░██║░░██║██║░░██║█████═╝░░░███╔═╝███████║██████╔╝██████╔╝
██║░░░░░██║░░██║██║░░██║██╔═██╗░██╔══╝░░██╔══██║██╔═══╝░██╔═══╝░
███████╗╚█████╔╝╚█████╔╝██║░╚██╗███████╗██║░░██║██║░░░░░██║░░░░░
╚══════╝░╚════╝░░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝╚═╝░░░░░╚═╝░░░░░`);
        hasPrintedArt.current = true;
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      setError('Unable to access browser storage. Some features may be limited.');
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem('hasSeenWarning', 'true');
      setShowWarning(false);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      setError('Unable to save preferences. Some features may be limited.');
    }
  };

  // Error boundary component
  if (error) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Box p={4} bg="red.50" borderRadius="md">
          <Text color="red.500">{error}</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <ChakraProvider value={system}>
      <ThemeProvider theme={muiTheme}>
        <SnackbarProvider maxSnack={3}>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<CreateAccount />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/select" element={<Selection />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/scan-limit" element={<ScanLimitPage />} />
                <Route path="/home" element={<Navigate to="/" />} />    
                <Route path="/scan/attractiveness" element={<Analyze />} />
                <Route path="/scan/autism" element={<PrivateRoute><AutismAnalytic /></PrivateRoute>} />
                <Route path="/scan/crime" element={<PrivateRoute><Criminality /></PrivateRoute>} />
                <Route path="/scan/lying" element={<PrivateRoute><LiarScore /></PrivateRoute>} />
                <Route path="/scan/summary" element={<OneWordPage />} />
                <Route path="/games/guess-celeb" element={<CelebBlur />} />
                <Route path="/games/guess-influencer" element={<InfluencerBlur />} />
                <Route path="/games/order-events" element={<TimelineMatch />} />
                <Route path="/games/match-scandal" element={<ScandalMatch />} />
                <Route path="/games/morality-test" element={<MoralScore />} />
                <Route path="/games/preference-predictor" element={<LogicalProfile />} />
                <Route path="/games/life-predictor" element={<LifePredictor />} />
                <Route path="/games/who-done-it" element={<WhoDoneIt />} />
                <Route path="/soon" element={<Soon />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>

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
        </SnackbarProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default App;