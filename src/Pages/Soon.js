import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  keyframes,
  styled,
  Paper,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import ChatIcon from '@mui/icons-material/Chat';
import VideocamIcon from '@mui/icons-material/Videocam';
import GamesIcon from '@mui/icons-material/Games';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Topbar from '../Components/TopBar';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: 300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
    '& .feature-icon': {
      filter: 'drop-shadow(0 0 12px rgba(9, 194, 247, 0.4))'
    }
  },
}));

const StyledButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  animation: `${gradientFlow} 6s ease infinite`,
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(120deg, transparent, rgba(250, 14, 164, 0.2), transparent)',
    transition: '0.5s'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
    '&:before': {
      left: '100%'
    }
  }
});

function Soon() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const featuresRef = useRef(null);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const titles = [
    'Social Face Analysis',
    'Interactive Video Chat',
    'Rating & Matching',
    'Social Gaming'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
        setIsFading(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureElements = featuresRef.current?.querySelectorAll('.feature-card');
    featureElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: FaceIcon,
      title: 'Advanced Face Analysis',
      description: 'AI-powered facial recognition and beauty analysis with social sharing capabilities',
    },
    {
      icon: ChatIcon,
      title: 'Real-time Video Chat',
      description: 'Seamless video communication with built-in face analysis features',
    },
    {
      icon: VideocamIcon,
      title: 'Rating System',
      description: 'Interactive rating and matching system for social connections',
    },
    {
      icon: GamesIcon,
      title: 'Social Games',
      description: 'Engaging games and challenges to connect with other users',
    },
  ];

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      // Add email to Firestore
      await addDoc(collection(db, 'waitlist'), {
        email,
        timestamp: serverTimestamp(),
        status: 'pending'
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Thank you for joining the waitlist!',
        severity: 'success'
      });

      // Reset form
      setEmail('');
      setShowEmailInput(false);
    } catch (error) {
      console.error('Error adding email to waitlist:', error);
      setSnackbar({
        open: true,
        message: 'Error joining waitlist. Please try again.',
        severity: 'error'
      });
    }
  };

  return (
    <>
    <Topbar />
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
          linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
        `,
        color: '#fff',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic gradient background */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(45deg, 
              rgba(9, 194, 247, 0.05) 0%, 
              rgba(250, 14, 164, 0.05) 50%,
              rgba(9, 194, 247, 0.05) 100%)
          `,
          animation: `${gradientFlow} 12s ease infinite`,
          backgroundSize: '200% 200%',
          opacity: 0.3,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: 10,
            mt: 6,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
              borderRadius: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              animation: `${neonGlow} 2s infinite`,
              boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <img
              src="/lookzapp trans 2.png"
              alt="LookzApp"
              style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
            />
          </Box>

          <Box sx={{ 
            position: 'relative', 
            height: '120px', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: isMobile ? '2.5rem' : '3.5rem',
                lineHeight: 1.1,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                opacity: isFading ? 0 : 1,
                transition: 'opacity 0.5s ease',
              }}
            >
              {titles[currentTitleIndex]}
              <Typography component="span" variant="inherit" sx={{
                display: 'block',
                fontWeight: 400,
                fontSize: '1.5rem',
                mt: 1.5,
                background: 'linear-gradient(45deg, #fa0ea4 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Coming Soon
              </Typography>
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{
              maxWidth: 800,
              mx: 'auto',
              mb: 5,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
              textShadow: '0 0 10px rgba(9, 194, 247, 0.2)'
            }}
          >
            Lookzapp is revolutionizing social interaction with AI-powered face analysis, 
            real-time video chat, and engaging social games. Connect, analyze, and have fun 
            in a whole new way.
          </Typography>

          {!showEmailInput ? (
            <StyledButton
              variant="contained"
              size="large"
              onClick={() => setShowEmailInput(true)}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                borderRadius: '12px',
                textTransform: 'none',
              }}
            >
              Join the Waitlist →
            </StyledButton>
          ) : (
            <Box
              component="form"
              onSubmit={handleEmailSubmit}
              sx={{
                maxWidth: 400,
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                error={!!emailError}
                helperText={emailError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#09c2f7',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#ff4444',
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <StyledButton
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    flex: 1,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '12px',
                    textTransform: 'none',
                  }}
                >
                  Submit
                </StyledButton>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setShowEmailInput(false)}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '12px',
                    textTransform: 'none',
                    color: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <Grid 
          container 
          spacing={4} 
          sx={{ mt: 4 }}
          ref={featuresRef}
        >
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StyledPaper 
                elevation={0}
                className="feature-card"
                sx={{
                  opacity: 0,
                  transform: 'translateY(20px)',
                  transition: 'all 0.5s ease-out',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <feature.icon 
                  className="feature-icon"
                  sx={{
                    fontSize: 48,
                    color: '#09c2f7',
                    mb: 3,
                    filter: 'drop-shadow(0 0 8px rgba(9, 194, 247, 0.3))',
                    transition: 'all 0.3s ease',
                  }} 
                />
                <Typography variant="h5" sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  color: '#6ce9ff',
                  textShadow: '0 0 10px rgba(9, 194, 247, 0.3)'
                }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
                }}>
                  {feature.description}
                </Typography>
              </StyledPaper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer Section */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          py: 3,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem',
          animation: `${fadeIn} 1s ease-out`,
          opacity: 0,
          animationFillMode: 'forwards',
        }}
      >
        <Typography variant="body2" onClick={() => navigate('/octavian')}>
          © 2025 Octavian Ideas. All rights reserved.
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    </>
  );
}

export default Soon;