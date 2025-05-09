import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  useTheme,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Divider,
  SwipeableDrawer
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import SearchIcon from '@mui/icons-material/Search';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import FaceIcon from '@mui/icons-material/Face';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import GavelIcon from '@mui/icons-material/Gavel';
import FlagIcon from '@mui/icons-material/Flag';

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const NavText = styled(Typography)(({ theme }) => ({
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -4,
    left: 0,
    width: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
    transition: 'width 0.3s ease'
  },
  '&:hover': {
    '&:after': {
      width: '100%'
    }
  }
}));

const MenuItem = styled(ListItem)(({ theme, isheader }) => ({
  cursor: isheader ? 'default' : 'pointer',
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  backgroundColor: isheader ? 'rgba(9, 194, 247, 0.1)' : 'transparent',
  '&:hover': {
    background: isheader ? 'rgba(9, 194, 247, 0.1)' : 'linear-gradient(90deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))',
    '& .MuiListItemText-primary': {
      color: isheader ? '#09c2f7' : '#09c2f7',
      textShadow: isheader ? 'none' : '0 0 8px rgba(9, 194, 247, 0.5)'
    },
    '& .MuiSvgIcon-root': {
      color: isheader ? '#09c2f7' : '#fa0ea4'
    }
  },
  '&:active': {
    transform: isheader ? 'none' : 'scale(0.98)'
  }
}));

const MenuIconWrapper = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  color: 'rgba(255,255,255,0.7)'
}));

const Topbar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate('/signin');
    }
  };

  const menuItems = [
    { 
      text: 'Available Now',
      isheader: true
    },
    { 
      text: 'Attractiveness', 
      icon: <CameraAltIcon />,
      action: () => navigate('/scan/attractiveness')
    },
    { 
      text: 'Predict a Crime', 
      icon: <GavelIcon />,
      action: () => navigate('/scan/crime')
    },
    { 
      text: 'Sum Me Up', 
      icon: <FaceIcon />,
      action: () => navigate('/scan/summary')
    },
    { divider: true },
    { 
      text: 'Requires Account',
      isheader: true
    },
    { 
      text: 'Autism', 
      icon: <PsychologyIcon />,
      action: () => navigate('/scan/autism')
    },
    { 
      text: 'Lying Skill', 
      icon: <EmojiEmotionsIcon />,
      action: () => navigate('/scan/lying')
    },
    { divider: true },
    { 
      text: 'In Development',
      isheader: true
    },
    { 
      text: 'Sus Score', 
      icon: <FlagIcon />,
      action: () => navigate('/scan/sus')
    },
    { 
      text: 'Substances', 
      icon: <VisibilityIcon />,
      action: () => navigate('/scan/substances')
    },
    { divider: true },
    { 
      text: 'Navigation',
      isheader: true
    },
    { 
      text: 'Home', 
      icon: <AccountCircleIcon />,
      action: () => navigate('/')
    },
    { 
      text: "What's Next", 
      icon: <QuestionMarkIcon />,
      action: () => navigate('/soon')
    }
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'rgba(13, 17, 44, 0.25)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(250, 14, 164, 0.1)',
        height: '70px',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(13, 17, 44, 0.4)',
          borderBottom: '1px solid rgba(250, 14, 164, 0.2)'
        }
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        height: '100%',
        px: 2
      }}>
        {/* Left Menu Button */}
        <IconButton
          onClick={() => setIsDrawerOpen(true)}
          sx={{
            color: 'rgba(255,255,255,0.9)',
            '&:hover': {
              color: '#09c2f7'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Center Logo */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 48,
            height: 48,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(45deg, rgba(9, 194, 247, 0.2), rgba(250, 14, 164, 0.2))',
            animation: `${neonGlow} 2s infinite`,
            '&:hover': {
              transform: 'translateX(-50%) scale(1.05)',
              boxShadow: '0 0 15px rgba(9, 194, 247, 0.4)'
            }
          }}
        >
          <img
            src="/favicon-96x96.png"
            alt="Lookzapp"
            style={{ 
              width: '70%', 
              height: '70%', 
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        </Box>

        {/* Right Auth Icon */}
        <IconButton
          onClick={handleAuthClick}
          sx={{
            color: 'rgba(255,255,255,0.9)',
            '&:hover': {
              color: '#09c2f7'
            }
          }}
        >
          {user ? <LogoutIcon /> : <AccountCircleIcon />}
        </IconButton>

        {/* Mobile Drawer */}
        <SwipeableDrawer
          anchor="left"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpen={() => setIsDrawerOpen(true)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '80%',
              maxWidth: 300,
              background: 'rgba(13, 17, 44, 0.95)',
              backdropFilter: 'blur(16px)',
              borderRight: '1px solid rgba(250, 14, 164, 0.3)'
            }
          }}
        >
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid rgba(250, 14, 164, 0.2)'
            }}>
              <img
                src="/favicon-96x96.png"
                alt="LookzApp"
                style={{ 
                  width: 40, 
                  height: 40, 
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  marginRight: 16
                }}
              />
              <Typography variant="h6" sx={{ color: '#fff' }}>
                LookzApp
              </Typography>
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto' }}>
              {menuItems.map((item, index) => (
                item.divider ? (
                  <Divider key={index} sx={{ borderColor: 'rgba(250, 14, 164, 0.15)', my: 1 }} />
                ) : (
                  <MenuItem 
                    key={index}
                    onClick={item.action}
                    isheader={item.isheader}
                  >
                    {item.icon && <MenuIconWrapper>{item.icon}</MenuIconWrapper>}
                    <ListItemText 
                      primary={item.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: item.isheader ? '#09c2f7' : 'rgba(255,255,255,0.9)',
                          fontSize: item.isheader ? '0.9rem' : '1rem',
                          fontWeight: item.isheader ? 600 : 500,
                          textTransform: item.isheader ? 'uppercase' : 'none',
                          letterSpacing: item.isheader ? '1px' : 'normal'
                        }
                      }}
                    />
                  </MenuItem>
                )
              ))}
            </List>
          </Box>
        </SwipeableDrawer>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;