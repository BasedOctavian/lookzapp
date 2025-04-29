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
import OneWord from '../Components/OneWord';

function OneWordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <>
      
    
            <OneWord />
           
    </>
  );
}

export default OneWordPage;