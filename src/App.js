import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@chakra-ui/react/preset';
import VideoCall from './Pages/VideoCall';

function App() {
  return (
    <ChakraProvider value={system}>
      <VideoCall />
    </ChakraProvider>
  );
}

export default App;