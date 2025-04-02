// ImprovedButtonGroup.js
import React from 'react';
import {
  SimpleGrid,
  Button,
  VStack,
  Icon,
  Heading,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const ButtonGroup = ({ options }) => {
  const navigate = useNavigate();

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6} py={4}>
      {options
        .filter((option) => option.title !== 'Get Ranked')
        .map((option) => (
          <Button
          style={{ height: 155, marginBottom: 10, marginRight: 20 }}

            key={option.title}
            onClick={() => navigate(option.route)}
            aria-label={option.title}
            bg="white"
            color="gray.800"
            p={6}
            borderRadius="xl"
            boxShadow="sm"
            transition="all 0.3s ease"
            _hover={{
              bg: 'gray.100',
              transform: 'translateY(-2px)',
              boxShadow: 'md',
            }}
            _active={{
              transform: 'scale(0.98)',
              boxShadow: 'sm',
            }}
            _focus={{
              outline: 'none',
              boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
            }}
            textAlign="center"
            w="full"
            h="auto"
          >
            <VStack spacing={3}>
              <Icon as={option.icon} w={8} h={8} color={`${option.colorScheme}.500`} />
              <Heading as="h3" size="md" color={'black.600'} fontFamily={'Matt Bold'}>
                {option.title}
              </Heading>
              <Text fontSize="sm" color="gray.600" textAlign="center" fontFamily={'Matt Light'}>
                {option.description}
              </Text>
            </VStack>
          </Button>
        ))}
    </SimpleGrid>
  );
};

export default ButtonGroup;
