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
  Grid,
  ToggleButtonGroup,
  ToggleButton,
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

const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Custom CircularProgress with label for final score
const CircularProgressWithLabel = (props) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {props.children}
      </Box>
    </Box>
  );
};

// Define styled components
const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  animation: `${gradientFlow} 6s ease infinite`,
  padding: '12px 24px',
  borderRadius: '12px',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
});

const StyledImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  padding: theme.spacing(4),
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(11, 43, 77, 0.2)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  background: 'linear-gradient(45deg, rgba(13, 17, 44, 0.7), rgba(102, 4, 62, 0.7))',
  backdropFilter: 'blur(16px)',
  [theme.breakpoints.up('md')]: {
    maxWidth: '600px',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: '90%',
  },
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

const ProgressBar = styled(Box)(({ theme }) => ({
  height: '6px',
  background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
}));

const difficultySettings = {
  easy: {
    multipleChoiceOptions: 5,
    multipleChoiceChances: 3,
    revealInitialPercentage: 0.5,
    revealMaxGuesses: 5,
    scoreMultiplier: 1,
  },
  medium: {
    multipleChoiceOptions: 10,
    multipleChoiceChances: 2,
    revealInitialPercentage: 0.3,
    revealMaxGuesses: 10,
    scoreMultiplier: 1.5,
  },
  hard: {
    multipleChoiceOptions: 15,
    multipleChoiceChances: 1,
    revealInitialPercentage: 0.1,
    revealMaxGuesses: 15,
    scoreMultiplier: 2,
  },
};

const WhoDoneIt = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameStage, setGameStage] = useState('initial'); // 'initial', 'multipleChoice', 'reveal'
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [guessCount, setGuessCount] = useState(0);
  const [revealGuessCount, setRevealGuessCount] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('all');
  const [streak, setStreak] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Add loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'whodidit'));
        const entriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          action: doc.data().action,
          role: doc.data().role,
        }));
        setEntries(entriesData);
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const getFilteredEntries = () => {
    let filtered = [...entries];
    if (category !== 'all') {
      filtered = filtered.filter(entry => entry.role === category);
    }
    return filtered.sort(() => Math.random() - 0.5);
  };

  const getRandomOptions = (entry) => {
    if (!entry) return [];
    const settings = difficultySettings[difficulty];
    const otherEntries = entries.filter(i => i.id !== entry.id && i.role === entry.role);
    const shuffled = otherEntries.sort(() => Math.random() - 0.5);
    const numOptions = settings.multipleChoiceOptions - 1;
    const selected = shuffled.slice(0, Math.min(numOptions, otherEntries.length));
    const options = [entry, ...selected];
    return options.sort(() => Math.random() - 0.5);
  };

  const handleInitialGuess = () => {
    if (!currentEntry || !guess.trim()) return;
    const normalizedGuess = guess.trim().toLowerCase().replace(/\./g, '');
    const normalizedName = currentEntry.name.trim().toLowerCase().replace(/\./g, '');
    const settings = difficultySettings[difficulty];
    if (normalizedGuess === normalizedName) {
      const basePoints = 10;
      const streakBonus = streak * 2;
      const totalPoints = Math.floor((basePoints + streakBonus) * settings.scoreMultiplier);
      setScore(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      setMessage(`Correct! 🎉 +${totalPoints} points${streak > 0 ? ` (Streak: ${streak + 1})` : ''}`);
      setTimeout(() => moveToNextEntry(), 1500);
    } else {
      setStreak(0);
      setGameStage('multipleChoice');
      setShowOptions(true);
      setCurrentOptions(getRandomOptions(currentEntry));
      setMessage('Take a guess from the options!');
    }
    setGuess('');
  };

  const handleNoIdea = () => {
    if (!currentEntry) return;
    setStreak(0);
    setGameStage('multipleChoice');
    setShowOptions(true);
    setCurrentOptions(getRandomOptions(currentEntry));
    setMessage('Choose from these names!');
  };

  const handleSkip = () => {
    setStreak(0);
    moveToNextEntry();
  };

  const handleMultipleChoiceGuess = (selectedName) => {
    if (!currentEntry) return;
    const settings = difficultySettings[difficulty];
    const newGuessCount = guessCount + 1;
    setGuessCount(newGuessCount);

    if (selectedName === currentEntry.name) {
      const points = Math.floor(5 * settings.scoreMultiplier);
      setScore(prev => prev + points);
      setMessage(`Correct! 🎉 +${points} points`);
      setTimeout(() => moveToNextEntry(), 1500);
    } else {
      if (newGuessCount >= settings.multipleChoiceChances) {
        setGameStage('reveal');
        setRevealGuessCount(0);
        const initialRevealed = Math.floor(currentEntry.name.length * settings.revealInitialPercentage);
        setRevealedLetters(initialRevealed);
        setMessage('Guess the name as it reveals!');
      } else {
        setMessage('Wrong! Try again! 💭');
      }
    }
  };

  const handleRevealGuess = () => {
    if (!currentEntry || !guess.trim()) return;
    const settings = difficultySettings[difficulty];
    const normalizedGuess = guess.trim().toLowerCase().replace(/\./g, '');
    const normalizedName = currentEntry.name.trim().toLowerCase().replace(/\./g, '');
    if (normalizedGuess === normalizedName) {
      const points = Math.floor(2 * settings.scoreMultiplier);
      setScore(prev => prev + points);
      setMessage(`Correct! 🎉 +${points} points`);
      setTimeout(() => moveToNextEntry(), 1500);
    } else {
      const newRevealGuessCount = revealGuessCount + 1;
      setRevealGuessCount(newRevealGuessCount);
      if (newRevealGuessCount < settings.revealMaxGuesses) {
        setRevealedLetters(prev => Math.min(prev + 1, currentEntry.name.length));
        setMessage('Nope! Guess again! 💭');
      } else {
        setRevealedLetters(currentEntry.name.length);
        setMessage(`The answer was: ${currentEntry.name}`);
        setTimeout(() => moveToNextEntry(), 2000);
      }
    }
    setGuess('');
  };

  const moveToNextEntry = () => {
    const filtered = getFilteredEntries();
    if (filtered.length === 0) return;
    
    if (round >= 10) {
      setGameOver(true);
      return;
    }

    const nextIndex = (currentIndex + 1) % filtered.length;
    setCurrentIndex(nextIndex);
    setCurrentEntry(filtered[nextIndex]);
    setGameStage('initial');
    resetGameState();
    setRound(prev => prev + 1);
  };

  const resetGameState = () => {
    setGuessCount(0);
    setRevealGuessCount(0);
    setRevealedLetters(0);
    setMessage('');
    setGuess('');
    setShowOptions(false);
    setCurrentOptions([]);
  };

  const getRevealedName = () => {
    if (!currentEntry) return '';
    const name = currentEntry.name;
    return name.split('').map((char, index) => 
      index < revealedLetters ? char : '_'
    ).join(' ');
  };

  const startNewGame = () => {
    setRound(1);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    const filtered = getFilteredEntries();
    setCurrentIndex(0);
    setCurrentEntry(filtered[0]);
    setGameStage('initial');
    resetGameState();
  };

  useEffect(() => {
    if (entries.length > 0 && !currentEntry && gameStarted) {
      const filtered = getFilteredEntries();
      if (filtered.length > 0) {
        setCurrentEntry(filtered[0]);
      }
    }
  }, [entries, gameStarted]);

  if (!showContent) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', 
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <TopBar />
        <Box
          sx={{
            width: 120,
            height: 120,
            background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            animation: `${neonGlow} 2s infinite`,
            boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
          }}
        >
          <img
            src="/lookzapp trans 2.png"
            alt="LookzApp"
            style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
          />
        </Box>
        <CircularProgress 
          sx={{ 
            color: '#09c2f7',
            animation: `${pulse} 1s infinite`,
          }} 
        />
      </Box>
    );
  }

  if (!gameStarted) {
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
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Box
              onClick={() => navigate('/')}
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
                  transform: 'scale(1.05)',
                },
              }}
            >
              <img
                src="/lookzapp trans 2.png"
                alt="LookzApp"
                style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                animation: `${neonGlow} 2s infinite`,
              }}
            >
              Who Done It?
            </Typography>

           

            <Box
              sx={{
                maxWidth: '800px',
                mx: 'auto',
                p: 4,
                background: 'rgba(13, 17, 44, 0.5)',
                borderRadius: '24px',
                border: '1px solid rgba(9, 194, 247, 0.2)',
                backdropFilter: 'blur(16px)',
                animation: `${fadeIn} 0.5s ease-out`,
              }}
            >
              <Box sx={{ mb: 6 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#09c2f7',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <span>Difficulty Level</span>
                </Typography>
                <ToggleButtonGroup
                  value={difficulty}
                  exclusive
                  onChange={(e, newDifficulty) => newDifficulty && setDifficulty(newDifficulty)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: '#fff',
                      borderColor: 'rgba(9, 194, 247, 0.5)',
                      backgroundColor: 'rgba(9, 194, 247, 0.1)',
                      px: 4,
                      py: 1.5,
                      '&.Mui-selected': {
                        background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                        color: '#fff',
                        boxShadow: '0 0 15px rgba(9, 194, 247, 0.5)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                          opacity: 0.9
                        }
                      },
                      '&:hover': {
                        background: 'rgba(9, 194, 247, 0.2)',
                        borderColor: 'rgba(9, 194, 247, 0.8)'
                      }
                    }
                  }}
                >
                  <ToggleButton value="easy">Easy</ToggleButton>
                  <ToggleButton value="medium">Medium</ToggleButton>
                  <ToggleButton value="hard">Hard</ToggleButton>
                </ToggleButtonGroup>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    mt: 2,
                    textAlign: 'center',
                  }}
                >
                  {difficulty === 'easy' ? 'More hints, more time to guess' :
                   difficulty === 'medium' ? 'Balanced challenge with moderate hints' :
                   'Limited hints, quick thinking required'}
                </Typography>
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#09c2f7',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <span>Category</span>
                </Typography>
                <ToggleButtonGroup
                  value={category}
                  exclusive
                  onChange={(e, newCategory) => newCategory && setCategory(newCategory)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: '#fff',
                      borderColor: 'rgba(9, 194, 247, 0.5)',
                      backgroundColor: 'rgba(9, 194, 247, 0.1)',
                      px: 4,
                      py: 1.5,
                      '&.Mui-selected': {
                        background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                        color: '#fff',
                        boxShadow: '0 0 15px rgba(9, 194, 247, 0.5)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
                          opacity: 0.9
                        }
                      },
                      '&:hover': {
                        background: 'rgba(9, 194, 247, 0.2)',
                        borderColor: 'rgba(9, 194, 247, 0.8)'
                      }
                    }
                  }}
                >
                  <ToggleButton value="all">All Categories</ToggleButton>
                  <ToggleButton value="Celeb">Celebrities</ToggleButton>
                  <ToggleButton value="Influencer">Influencers</ToggleButton>
                </ToggleButtonGroup>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    mt: 2,
                    textAlign: 'center',
                  }}
                >
                  {category === 'all' ? 'Mix of all categories for maximum variety' :
                   category === 'Celeb' ? 'Focus on celebrity actions and events' :
                   'Explore the world of social media influencers'}
                </Typography>
              </Box>

              <Box sx={{ mt: 6, animation: `${fadeIn} 0.5s ease-out` }}>
                <GradientButton
                  onClick={() => setGameStarted(true)}
                  sx={{
                    minWidth: '200px',
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    animation: `${pulse} 2s infinite`,
                  }}
                >
                  Start
                </GradientButton>
              </Box>
            </Box>
          </Box>
        </Box>
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
    );
  } else if (gameOver) {
    const maxScore = 10 * 10 * difficultySettings[difficulty].scoreMultiplier; // Max assuming initial guesses
    const scorePercentage = Math.min((score / maxScore) * 100, 100);
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
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h4" sx={{ mb: 4, color: '#09c2f7', animation: `${pulse} 2s infinite` }}>
              Game Over!
            </Typography>
            <Box sx={{ mb: 4 }}>
              <CircularProgressWithLabel
                value={scorePercentage}
                size={120}
                thickness={5}
                sx={{
                  color: score > maxScore * 0.8 ? '#4caf50' : '#09c2f7',
                  animation: `${neonGlow} 2s infinite`,
                }}
              >
                <Typography variant="h5" sx={{ color: '#fff' }}>
                  {score}
                </Typography>
              </CircularProgressWithLabel>
            </Box>
            <Typography variant="h6" sx={{ mb: 4, color: score > maxScore * 0.8 ? '#4caf50' : '#f44336' }}>
              {score > maxScore * 0.8 ? 'Master Detective!' : score > maxScore * 0.5 ? 'Sharp Sleuth!' : 'Keep Investigating!'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#fff' }}>
              Highest Streak: {streak}
            </Typography>
            <GradientButton onClick={startNewGame}>
              Play Again
            </GradientButton>
            <GradientButton onClick={() => setGameStarted(false)} sx={{ ml: 2 }}>
              Change Settings
            </GradientButton>
          </Box>
        </Box>
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
    );
  } else {
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
            <Box
              onClick={() => navigate('/')}
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
                  transform: 'scale(1.05)',
                },
              }}
            >
              <img
                src="/lookzapp trans 2.png"
                alt="LookzApp"
                style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
              />
            </Box>

            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                animation: `${neonGlow} 2s infinite`,
              }}
            >
              Who Did It?
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#09c2f7' }}>
              Round {round}/10 | Score: {score} | Streak: {streak}
            </Typography>

            {isLoading ? (
              <CircularProgress sx={{ color: '#09c2f7' }} />
            ) : currentEntry ? (
              <StyledImageContainer>
                {gameStage === 'initial' && (
                  <Box sx={{ animation: `${fadeIn} 0.5s ease-out` }}>
                    <Typography variant="h5" sx={{ mb: 4, color: '#09c2f7', fontStyle: 'italic' }}>
                      "{currentEntry.action}"
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Who did this?
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      justifyContent: 'center', 
                      flexWrap: 'wrap',
                      px: 2
                    }}>
                      <StyledTextField
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Type your guess here"
                        variant="outlined"
                        sx={{ 
                          width: { xs: '100%', sm: '300px' },
                          minWidth: { xs: '100%', sm: '300px' }
                        }}
                        autoFocus
                      />
                      <GradientButton 
                        onClick={handleInitialGuess}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: { xs: '100%', sm: '120px' }
                        }}
                      >
                        Submit
                      </GradientButton>
                      <GradientButton 
                        onClick={handleNoIdea}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: { xs: '100%', sm: '120px' }
                        }}
                      >
                        No Idea
                      </GradientButton>
                      <GradientButton 
                        onClick={handleSkip}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: { xs: '100%', sm: '120px' }
                        }}
                      >
                        Skip
                      </GradientButton>
                    </Box>
                  </Box>
                )}

                {gameStage === 'multipleChoice' && showOptions && (
                  <Box sx={{ animation: `${fadeIn} 0.5s ease-out` }}>
                    <Typography variant="h5" sx={{ mb: 4, color: '#09c2f7', fontStyle: 'italic' }}>
                      "{currentEntry.action}"
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Choose wisely (Attempt {guessCount + 1}/{difficultySettings[difficulty].multipleChoiceChances}):
                    </Typography>
                    <Grid 
                      container 
                      spacing={2} 
                      sx={{ 
                        maxWidth: '800px', 
                        mx: 'auto',
                        px: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        '& .MuiGrid-item': {
                          width: { xs: '100%', sm: '50%' },
                          minWidth: { xs: '100%', sm: '200px' },
                          display: 'flex',
                          justifyContent: 'center'
                        }
                      }}
                    >
                      {currentOptions.map((option) => (
                        <Grid item xs={12} sm={6} key={option.id}>
                          <GradientButton
                            fullWidth
                            onClick={() => handleMultipleChoiceGuess(option.name)}
                            sx={{ 
                              py: 2,
                              height: '48px',
                              marginRight: '17px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: { xs: '0.9rem', sm: '1rem' },
                              minWidth: { xs: '100%', sm: '200px' },
                              maxWidth: { xs: '300px', sm: 'none' }
                            }}
                          >
                            {option.name}
                          </GradientButton>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {gameStage === 'reveal' && (
                  <Box sx={{ animation: `${fadeIn} 0.5s ease-out` }}>
                    <Typography variant="h5" sx={{ mb: 4, color: '#09c2f7', fontStyle: 'italic' }}>
                      "{currentEntry.action}"
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontFamily: 'monospace',
                        letterSpacing: '2px',
                        color: revealGuessCount >= difficultySettings[difficulty].revealMaxGuesses ? '#4caf50' : '#fff',
                      }}
                    >
                      {getRevealedName()}
                    </Typography>
                    {revealGuessCount < difficultySettings[difficulty].revealMaxGuesses && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        px: 2
                      }}>
                        <StyledTextField
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          placeholder="Guess the full name"
                          variant="outlined"
                          sx={{ 
                            width: { xs: '100%', sm: '300px' },
                            minWidth: { xs: '100%', sm: '300px' }
                          }}
                          autoFocus
                        />
                        <GradientButton 
                          onClick={handleRevealGuess}
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: { xs: '100%', sm: '120px' }
                          }}
                        >
                          Submit
                        </GradientButton>
                      </Box>
                    )}
                    <Box sx={{ mt: 2, width: '80%', mx: 'auto' }}>
                      <ProgressBar sx={{ width: `${(revealGuessCount / difficultySettings[difficulty].revealMaxGuesses) * 100}%` }} />
                      <Typography variant="caption" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>
                        Guesses: {revealGuessCount}/{difficultySettings[difficulty].revealMaxGuesses}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {message && (
                  <Box
                    sx={{
                      mt: 2,
                      animation: `${message.includes('Correct') ? fadeIn : shake} 0.5s ease`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: message.includes('Correct') ? '#4caf50' : '#f44336',
                      }}
                    >
                      {message}
                    </Typography>
                  </Box>
                )}
              </StyledImageContainer>
            ) : (
              <Typography variant="h5" sx={{ animation: `${fadeIn} 0.5s ease-out` }}>
                No more mysteries to solve!
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  }
};

export default WhoDoneIt;