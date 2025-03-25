import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  HStack, 
  Icon, 
  IconButton, 
  Text, 
  Button, 
  Spacer, 
  useBreakpointValue 
} from '@chakra-ui/react';
import { FaVideo, FaGamepad, FaTrophy, FaStar, FaMapMarkedAlt, FaEnvelope, FaBars, FaHamburger } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';


const TopBar = () => {
  const navigate = useNavigate();

  // Navigation items array
  const navItems = [
    { title: 'Video Chat', icon: FaVideo, route: '/video-call' },
    { title: 'Other Games', icon: FaGamepad, route: '/two-truths' },
    { title: 'Rating', icon: FaTrophy, route: '/top-rated-users' },
    { title: 'Get Ranked', icon: FaStar, route: '/get-ranked-selection' },
    { title: 'Guess Location', icon: FaMapMarkedAlt, route: '/geo-call' },
    { title: 'Messages', icon: FaEnvelope, route: '/messages' },
  ];

  // Detect screen size
  const isDesktop = useBreakpointValue({ base: false, md: true });

  // State for drawer open/close
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <Box 
      bg="white" 
      boxShadow="md" 
      px={4} 
      py={2} 
      mb={6} 
      style={{ position: 'sticky', top: 0, zIndex: 100, marginTop: '-50' }}
    >
      <Flex align="center">
        {/* Logo */}
        <Text
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="bold"
          cursor="pointer"
          onClick={() => navigate('/')}
        >
          Lookzapp
        </Text>
        <Spacer />

        {/* Desktop Navigation */}
        {isDesktop ? (
          <HStack spacing={6}>
            {navItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                onClick={() => navigate(item.route)}
                _hover={{ bg: 'gray.100' }}
              >
                <HStack spacing={2}>
                  <Icon 
                    as={item.icon} 
                    w={5} 
                    h={5} 
                    color={item.title === 'Rating' ? 'yellow.500' : 'gray.600'} 
                  />
                  <Text fontSize="sm">{item.title}</Text>
                </HStack>
              </Button>
            ))}
          </HStack>
        ) : (
          /* Mobile Hamburger Icon */
          <MuiIconButton onClick={handleToggle}>
                <FaBars />
              </MuiIconButton>
        )}
      </Flex>

      {/* Mobile Drawer */}
      {!isDesktop && (
        <Drawer anchor="right" open={isOpen} onClose={handleToggle}>
          <MuiBox sx={{ width: 250 }} role="presentation">
            {/* Drawer Header */}
            <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography variant="h6">Menu</Typography>
              <MuiIconButton onClick={handleToggle}>
                <CloseIcon />
              </MuiIconButton>
            </MuiBox>

            {/* Navigation Items */}
            <MuiBox sx={{ p: 2 }}>
              {navItems.map((item) => (
                <MuiButton
                  key={item.title}
                  fullWidth
                  variant="text"
                  startIcon={<item.icon size={20} color={item.title === 'Rating' ? '#FFD700' : '#4B5563'} />}
                  onClick={() => {
                    navigate(item.route);
                    handleToggle();
                  }}
                  sx={{ mb: 1 }}
                >
                  {item.title}
                </MuiButton>
              ))}
            </MuiBox>
          </MuiBox>
        </Drawer>
      )}
    </Box>
  );
};

export default TopBar;