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
} from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';



function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Signed in',
        description: 'Welcome back!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/video-call');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(to-br, gray.900, blue.800)"
      px={4}
    >
      <VStack
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="2xl"
        spacing={6}
        w={{ base: '90%', md: '400px' }}
      >
        <Heading as="h2" size="xl" textAlign="center" color="blue.500">
          Sign In
        </Heading>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                bg="gray.100"
                _focus={{ bg: 'white', borderColor: 'blue.400' }}
              />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                bg="gray.100"
                _focus={{ bg: 'white', borderColor: 'blue.400' }}
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isLoading}
              _hover={{ bg: 'blue.600' }}
            >
              Sign In
            </Button>
          </VStack>
        </form>
        <Text textAlign="center" color="gray.500">
          Don’t have an account?{' '}
          <Link href="/createaccount" color="blue.500" fontWeight="bold">
            Sign Up
          </Link>
        </Text>
      </VStack>
    </Flex>
  );
}

export default SignIn;
