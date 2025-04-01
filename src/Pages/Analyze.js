import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@chakra-ui/toast';
import { useNavigate } from 'react-router-dom';
import {
  Flex,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  Container,
} from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import WebcamTiltDetector from '../Components/WebcamTiltDetector';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';

function Analyze() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50" overflowX="hidden">
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} overflow="hidden">
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            <WebcamTiltDetector />
            {/* Additional components can be added here if needed */}
          </VStack>
        </Container>
      </Flex>
      <Footer />
    </>
  );
}

export default Analyze;