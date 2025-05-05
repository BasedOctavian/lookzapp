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
  Paper
} from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import PsychologyIcon from '@mui/icons-material/Psychology';
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

function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const featuresRef = useRef(null);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const titles = [
    'Facial Intelligence',
    'Neural Analysis',
    'AI-Powered Insights',
    'Smart Face Mapping',
    'Voice Pattern Analysis'
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
      title: 'Neural Facial Mapping',
      description: 'Deep learning-powered analysis of 128 facial landmarks',
    },
    {
      icon: CameraAltIcon,
      title: 'Real-time AR Preview',
      description: 'Instant visualization with augmented reality overlay',
    },
    {
      icon: SpeedIcon,
      title: 'Precision Metrics',
      description: 'Golden ratio scoring with deviation analysis',
    },
    {
      icon: PsychologyIcon,
      title: 'Voice Analysis',
      description: 'Advanced voice pattern analysis for emotional and behavioral insights',
    },
  ];

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
                by Lookzapp
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
            Next-generation facial and voice analytics powered by convolutional neural networks.
            Receive detailed symmetry analysis, voice pattern insights, and beauty predictions in real-time.
          </Typography>

          <StyledButton
            variant="contained"
            size="large"
            onClick={() => navigate('/scan')}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: '12px',
              textTransform: 'none',
            }}
          >
            Start Free Scan →
          </StyledButton>
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
    </Box>
    </>
  );
}

export default LandingPage;