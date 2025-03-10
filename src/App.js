import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@chakra-ui/react/preset';
import VideoCall from './Pages/VideoCall';
import CreateAccount from './Pages/CreateAccount';
import SignIn from './Pages/SignIn';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './Pages/PrivateRoute';

function App() {
  return (
    <ChakraProvider value={system}>
      <Router>
        <Routes>
          <Route path="/createaccount" element={<CreateAccount />} />
          <Route path="/signin" element={<SignIn />} />
          {/* Use PrivateRoute as a wrapper inside a Route */}
          <Route path="/video-call" element={<PrivateRoute><VideoCall /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/signin" />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;