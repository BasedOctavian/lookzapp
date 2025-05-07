import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  TextField,
  styled,
  keyframes,
} from '@mui/material';

// Define keyframes
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

// Define styled components
const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  animation: `${gradientFlow} 6s ease infinite`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  },
});

const StyledImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(11, 43, 77, 0.2)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  background: 'linear-gradient(45deg, rgba(13, 17, 44, 0.7), rgba(102, 4, 62, 0.7))',
  backdropFilter: 'blur(16px)',
  [theme.breakpoints.up('md')]: {
    maxWidth: '600px',
    maxHeight: '600px',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: '800px',
    maxHeight: '800px',
  }
}));

const StyledInstructionText = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: '3',
  textAlign: 'center',
  background: 'rgba(13, 17, 44, 0.95)',
  backdropFilter: 'blur(8px)',
  padding: theme.spacing(2, 3),
  borderRadius: '16px',
  border: '1px solid rgba(250, 14, 164, 0.3)',
  animation: `${fadeIn} 0.5s ease-out`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  maxWidth: '90%',
  width: 'auto',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 0 0 2px rgba(9, 194, 247, 0.4)',
    },
  },
  '& .MuiOutlinedInput-input': {
    fontSize: '1.1rem',
    padding: '12px 16px',
  },
}));

const GuessCounter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  right: '20px',
  background: 'rgba(13, 17, 44, 0.95)',
  backdropFilter: 'blur(8px)',
  padding: theme.spacing(1, 2),
  borderRadius: '16px',
  border: '1px solid rgba(250, 14, 164, 0.3)',
  zIndex: 3,
}));

const ProgressBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  height: '4px',
  background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
  transition: 'width 0.3s ease',
}));

const CelebBlur = () => {
  const navigate = useNavigate();
  const [celebs, setCelebs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blurLevel, setBlurLevel] = useState(30); // Increased initial blur
  const [guessCount, setGuessCount] = useState(0);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // Fetch and shuffle celebrities on mount
  useEffect(() => {
    const fetchCelebs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'blurredCelebs'));
        const celebsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const shuffled = celebsData.sort(() => Math.random() - 0.5);
        setCelebs(shuffled);
      } catch (error) {
        console.error('Error fetching celebrities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCelebs();
  }, []);

  const handleGuess = () => {
    const currentCeleb = celebs[currentIndex];
    if (!currentCeleb) return;

    const normalizedGuess = guess.trim().toLowerCase().replace(/\./g, '');
    const normalizedName = currentCeleb.name.trim().toLowerCase().replace(/\./g, '');

    if (normalizedGuess === normalizedName) {
      setMessage('Correct! 🎉');
      setBlurLevel(0);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setBlurLevel(30);
        setGuessCount(0);
        setMessage('');
        setGuess('');
        setShowHint(false);
      }, 1500);
    } else {
      const newGuessCount = guessCount + 1;
      setGuessCount(newGuessCount);
      // More dramatic blur reduction in early guesses
      const newBlurLevel = Math.max(30 - (newGuessCount * 8) - (newGuessCount <= 5 ? 5 : 0), 3);
      setBlurLevel(newBlurLevel);
      setMessage('Try again! 💭');
      setGuess('');
      
      // Show hint after 6 guesses
      if (newGuessCount === 6) {
        setShowHint(true);
      }
    }
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
    setBlurLevel(30);
    setGuessCount(0);
    setMessage('');
    setGuess('');
    setShowHint(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleGuess();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)',
        color: '#fff',
        py: 8,
        position: 'relative',
      }}
    >
      <TopBar />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 'xl', mx: 'auto' }}>
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4,
            }}
          >
            Guess the Celebrity
          </Typography>
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
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
            onClick={() => navigate('/')}
          >
            <img
              src="/lookzapp trans 2.png"
              alt="LookzApp"
              style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
            />
          </Box>
          {isLoading ? (
            <CircularProgress />
          ) : celebs.length > 0 && currentIndex < celebs.length ? (
            <StyledImageContainer>
              <Box
                component="img"
                src={celebs[currentIndex].photo_url}
                alt="Blurred Celebrity"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: `blur(${blurLevel}px)`,
                  transition: 'filter 0.3s ease',
                  padding: '20px',
                }}
              />
              <StyledInstructionText>
                {message ? (
                  <Typography
                    variant="h6"
                    sx={{
                      color: message.includes('Correct') ? 'success.main' : 'error.main',
                      fontWeight: 600,
                    }}
                  >
                    {message} (Guess {guessCount + 1})
                  </Typography>
                ) : (
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                    Who is this celebrity? (Guess {guessCount + 1})
                  </Typography>
                )}
                {showHint && (
                  <Typography variant="body1" sx={{ color: '#09c2f7', mt: 1 }}>
                    Hint: {celebs[currentIndex].hint || 'First letter: ' + celebs[currentIndex].name[0]}
                  </Typography>
                )}
              </StyledInstructionText>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 3,
                  display: 'flex',
                  gap: 2,
                  width: '90%',
                  maxWidth: '600px',
                }}
              >
                <StyledTextField
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your guess"
                  variant="outlined"
                  fullWidth
                  autoFocus
                />
                <GradientButton onClick={handleGuess} sx={{ py: 1.5, px: 4 }}>
                  Submit
                </GradientButton>
                <GradientButton onClick={handleSkip} sx={{ py: 1.5, px: 4 }}>
                  Skip
                </GradientButton>
              </Box>
              <ProgressBar sx={{ width: `${((currentIndex + 1) / celebs.length) * 100}%` }} />
            </StyledImageContainer>
          ) : (
            <Typography variant="h5">
              No more celebrities to guess.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CelebBlur;