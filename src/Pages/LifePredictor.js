import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, keyframes, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';

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

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled components
const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '24px',
  transition: 'all 0.3s ease',
  minWidth: '200px',
  height: 'auto',
  whiteSpace: 'normal',
  textAlign: 'center',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
    background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
  },
}));

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
  },
}));

// Define outcome categories
const categories = ['Adventurous', 'Prudent', 'Creative', 'Analytical', 'Social'];

// New CSV data with 15 insightful questions
const csvData = `
QuestionID,QuestionText,AnswerID,AnswerText,Adventurous,Prudent,Creative,Analytical,Social
Q1,"When you're alone at night, do you...",A1,"Go out and explore",2,0,1,0,1
Q1,"When you're alone at night, do you...",A2,"Stay in and relax",0,2,1,1,0
Q2,"If you found $100 on the street, you would...",A1,"Spend it on something fun",2,0,1,0,1
Q2,"If you found $100 on the street, you would...",A2,"Save it or return it",0,2,0,2,0
Q3,"When you're angry, you tend to...",A1,"Act on impulse",2,0,1,0,1
Q3,"When you're angry, you tend to...",A2,"Think it through",0,2,0,2,0
Q4,"In a group project, you usually...",A1,"Take charge",2,1,0,1,1
Q4,"In a group project, you usually...",A2,"Follow others' lead",0,1,1,1,0
Q5,"When making decisions, you rely on...",A1,"Your gut feeling",2,0,1,0,1
Q5,"When making decisions, you rely on...",A2,"Logic and facts",0,2,0,2,0
Q6,"If you could change one thing about yourself, you'd...",A1,"Take more risks",2,0,1,0,1
Q6,"If you could change one thing about yourself, you'd...",A2,"Be more careful",0,2,0,2,0
Q7,"When you're stressed, you...",A1,"Need to move around",2,0,1,0,1
Q7,"When you're stressed, you...",A2,"Need to be alone",0,1,1,1,0
Q8,"You're more likely to...",A1,"Start a fight",2,0,1,0,1
Q8,"You're more likely to...",A2,"Avoid conflict",0,2,0,1,1
Q9,"When you're bored, you...",A1,"Find something exciting",2,0,1,0,1
Q9,"When you're bored, you...",A2,"Wait it out",0,2,1,1,0
Q10,"You're more comfortable...",A1,"In chaos",2,0,1,0,1
Q10,"You're more comfortable...",A2,"In order",0,2,0,2,0
Q11,"When you're wrong, you...",A1,"Admit it quickly",2,1,0,1,1
Q11,"When you're wrong, you...",A2,"Try to justify it",0,1,1,1,0
Q12,"You're more likely to...",A1,"Break rules",2,0,1,0,1
Q12,"You're more likely to...",A2,"Follow them",0,2,0,2,0
Q13,"When you're tired, you...",A1,"Push through",2,0,1,0,1
Q13,"When you're tired, you...",A2,"Take a break",0,2,1,1,0
Q14,"You're more likely to...",A1,"Trust strangers",2,0,1,0,1
Q14,"You're more likely to...",A2,"Be suspicious",0,2,0,2,0
Q15,"When you're happy, you...",A1,"Share it with others",2,0,1,0,2
Q15,"When you're happy, you...",A2,"Keep it to yourself",0,1,1,1,0
`;

// Function to split CSV row considering quoted fields
const splitCSVRow = (row) => {
  return row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(field => field.replace(/^"|"$/g, ''));
};

// Function to parse CSV data
const parseCSV = (csvString) => {
  const rows = csvString.trim().split('\n');
  const headers = splitCSVRow(rows[0]);
  const data = rows.slice(1).map(row => {
    const values = splitCSVRow(row);
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });
  return data;
};

// Function to group questions
const groupQuestions = (data, categories) => {
  const questionsMap = new Map();
  data.forEach(row => {
    const questionId = row.QuestionID;
    if (!questionsMap.has(questionId)) {
      questionsMap.set(questionId, {
        id: questionId,
        text: row.QuestionText,
        answers: []
      });
    }
    const answer = {
      id: row.AnswerID,
      text: row.AnswerText,
      scores: categories.reduce((acc, category) => {
        acc[category] = parseInt(row[category], 10);
        return acc;
      }, {})
    };
    questionsMap.get(questionId).answers.push(answer);
  });
  return Array.from(questionsMap.values());
};

const LifePredictor = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Add loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Define outcome lists for each category
  const outcomeLists = {
    Adventurous: [
      "You'll spend 20 years in a 9-5 job before finally quitting to start a failed food truck business.",
      "You'll get arrested for trespassing while trying to explore an abandoned building.",
      "You'll become a middle manager at a tech company and spend your weekends doing extreme sports.",
      "You'll move to 7 different countries in 10 years, working minimum wage jobs in each one.",
      "You'll start a YouTube channel about your adventures that gets 47 subscribers.",
      "You'll get lost in the woods for 3 days and become a local legend.",
      "You'll quit your job to become a travel blogger and end up living in your parents' basement.",
      "You'll join a cult for 6 months before realizing it's just a timeshare scheme.",
      "You'll become a professional skydiver and break 3 bones in your first year.",
      "You'll start a band that plays one show before breaking up over creative differences.",
      "You'll get kicked out of 3 different countries for 'misunderstandings' with local authorities.",
      "You'll become a professional gambler and lose everything except your lucky socks.",
      "You'll start a fight with a bear and somehow win, becoming a local legend.",
      "You'll get banned from every casino in Las Vegas for counting cards too obviously.",
      "You'll become a stunt double and break every bone in your body except your left pinky toe.",
      "You'll die doing something stupid that people will talk about for years.",
      "You'll become a drug mule by accident and end up in a foreign prison.",
      "You'll join the French Foreign Legion and get kicked out for being too adventurous.",
      "You'll become a professional daredevil and make millions before dying in a freak accident.",
      "You'll start a fight club that gets shut down by the police in the first week."
    ],
    Prudent: [
      "You'll work the same job for 40 years and retire with a gold watch you never wear.",
      "You'll become a middle manager at an insurance company and love every minute of it.",
      "You'll save enough money to buy a house at 45, only to have the market crash the next day.",
      "You'll create a spreadsheet to track your daily expenses for the next 30 years.",
      "You'll become the person who brings homemade cookies to every office meeting.",
      "You'll have a perfect credit score but no interesting stories to tell.",
      "You'll become a certified public accountant and actually enjoy tax season.",
      "You'll create a 5-year plan that you follow exactly, only to realize you planned for the wrong life.",
      "You'll become the neighborhood watch captain and solve exactly zero crimes.",
      "You'll retire at 65 with a pension and immediately start a part-time job because you're bored.",
      "You'll die with $2 million in the bank but never take a vacation.",
      "You'll become the most prepared person for the apocalypse that never comes.",
      "You'll create a will that's longer than the Bible and update it weekly.",
      "You'll become the person who brings a first aid kit to a movie theater.",
      "You'll have a 20-year supply of toilet paper when the next pandemic hits.",
      "You'll become a prepper and die of natural causes before the apocalypse.",
      "You'll create a perfect emergency plan that you never need to use.",
      "You'll become the person who reads every terms and conditions before clicking accept.",
      "You'll develop a phobia of everything and never leave your house.",
      "You'll become a safety inspector and get fired for being too cautious."
    ],
    Creative: [
      "You'll start 15 different businesses, all of which fail within 6 months.",
      "You'll become a struggling artist who makes more money from their day job at Starbucks.",
      "You'll write a novel that gets rejected by 50 publishers before being self-published.",
      "You'll start a podcast that your mom and three friends listen to.",
      "You'll become a graphic designer and spend your life making logos for local businesses.",
      "You'll create an app that solves a problem no one knew they had.",
      "You'll become a wedding photographer and develop a drinking problem.",
      "You'll start a YouTube channel that gets demonetized in the first month.",
      "You'll become a freelance writer and learn to love ramen noodles.",
      "You'll create a successful Etsy shop selling crafts your cat could make.",
      "You'll become famous for creating the world's worst piece of art that somehow sells for millions.",
      "You'll start a band that becomes famous after you break up and someone else joins.",
      "You'll write a book that gets turned into a movie, but they change everything about it.",
      "You'll become a TikTok star for the wrong reasons and can't figure out why.",
      "You'll create a masterpiece that gets mistaken for a child's drawing and thrown away.",
      "You'll become a performance artist and get arrested for your 'art'.",
      "You'll start a fashion line that becomes popular in the wrong way.",
      "You'll become a musician and write one hit song that you'll hate for the rest of your life.",
      "You'll create a viral meme that you'll regret for eternity.",
      "You'll become a famous artist posthumously after dying in poverty."
    ],
    Analytical: [
      "You'll become a data analyst and spend your life making PowerPoint presentations no one watches.",
      "You'll solve a complex math problem that only three other people in the world understand.",
      "You'll become a professor and publish papers that only your students are forced to read.",
      "You'll create an algorithm that predicts the stock market with 51% accuracy.",
      "You'll become a software engineer and spend your life debugging other people's code.",
      "You'll write a thesis that gets cited once by someone who clearly didn't read it.",
      "You'll become a research scientist and discover something that gets named after your supervisor.",
      "You'll create a spreadsheet that tracks every aspect of your life except happiness.",
      "You'll become a consultant and charge people $500 an hour to tell them what they already know.",
      "You'll develop a new statistical method that's immediately forgotten after your retirement.",
      "You'll solve a major world problem but no one will understand your solution.",
      "You'll create a perfect system for organizing your life that you never actually use.",
      "You'll become the person who can explain quantum physics to a 5-year-old but can't order coffee.",
      "You'll develop a theory that's proven right 50 years after your death.",
      "You'll become the world's leading expert on something completely useless.",
      "You'll create an AI that becomes sentient and immediately deletes itself.",
      "You'll solve the meaning of life but forget to write it down.",
      "You'll become a conspiracy theorist with actual evidence.",
      "You'll develop a perfect system for predicting the future that only works in hindsight.",
      "You'll become a genius who's too smart to function in society."
    ],
    Social: [
      "You'll become a real estate agent and know everyone in town, but no one will invite you to parties.",
      "You'll start a successful MLM business and lose all your friends.",
      "You'll become a bartender and hear everyone's problems but have no one to talk to about yours.",
      "You'll run for local office and lose by 3 votes to a candidate who didn't campaign.",
      "You'll become a social media influencer with 10,000 followers, all of whom are bots.",
      "You'll start a book club that devolves into a wine-drinking club that devolves into a therapy session.",
      "You'll become a wedding planner and develop a deep hatred for bridesmaids.",
      "You'll create a community garden that becomes a front for an underground poker ring.",
      "You'll become a life coach and help others find happiness while questioning your own.",
      "You'll start a neighborhood watch group that accidentally becomes a neighborhood gossip group.",
      "You'll become the person everyone calls at 3 AM but no one invites to brunch.",
      "You'll start a cult by accident and spend the rest of your life trying to disband it.",
      "You'll become famous for being the only person who can get along with everyone, including the devil.",
      "You'll create a social network that becomes popular after you sell it for $50.",
      "You'll become the world's most successful matchmaker but die alone.",
      "You'll become a therapist and develop more problems than your clients.",
      "You'll start a support group that becomes more dysfunctional than the problems it's meant to solve.",
      "You'll become a relationship expert after your fifth divorce.",
      "You'll create a dating app that matches people with their worst possible matches.",
      "You'll become a social butterfly who's allergic to people."
    ]
  };

  // Parse and set questions on component mount
  useEffect(() => {
    const parsedData = parseCSV(csvData);
    const questionsData = groupQuestions(parsedData, categories);
    setQuestions(questionsData);
    setScores(categories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {}));
    setIsLoading(false);
  }, []);

  // Handle player's choice and update scores
  const handleChoice = (answerIndex) => {
    const currentQuestion = questions[currentIndex];
    const selectedAnswer = currentQuestion.answers[answerIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer.text
    }));
    setScores(prevScores => {
      const newScores = { ...prevScores };
      for (const [category, score] of Object.entries(selectedAnswer.scores)) {
        newScores[category] += score;
      }
      return newScores;
    });
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameOver(true);
    }
  };

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

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
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
          <Typography variant="h4" sx={{ mb: 4, color: '#09c2f7' }}>
            Loading Game Data...
          </Typography>
          <CircularProgress sx={{ color: '#09c2f7' }} />
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
  }

  // Game over state with life prediction
  if (gameOver) {
    const maxScore = Math.max(...Object.values(scores));
    const topCategories = categories.filter(category => scores[category] === maxScore);
    const selectedCategory = topCategories[Math.floor(Math.random() * topCategories.length)];
    const outcomes = outcomeLists[selectedCategory];
    const selectedOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
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
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <img src="/lookzapp trans 2.png" alt="LookzApp" style={{ width: '80%', filter: 'brightness(0) invert(1)' }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4,
              animation: `${neonGlow} 2s infinite`,
            }}
          >
            Your Life Prediction
          </Typography>

          <StyledBox sx={{ maxWidth: '800px', mx: 'auto', mt: 4, animation: `${fadeIn} 0.5s ease-out` }}>
            <Typography variant="h6" sx={{ color: '#09c2f7', mb: 2 }}>
              Your path aligns with the {selectedCategory}.
            </Typography>
            <Typography variant="h6" sx={{ color: '#fff', mb: 4 }}>
              Predicted Outcome: {selectedOutcome}
            </Typography>
          </StyledBox>

          <StyledButton
            onClick={() => {
              setCurrentIndex(0);
              setScores(categories.reduce((acc, category) => {
                acc[category] = 0;
                return acc;
              }, {}));
              setSelectedAnswers({});
              setGameOver(false);
            }}
            sx={{ mt: 4 }}
          >
            Play Again
          </StyledButton>
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
  }

  // Check if questions are loaded
  if (questions.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
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
          <Typography variant="h6" sx={{ color: '#09c2f7' }}>No questions available.</Typography>
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
          
        </Box>
      </Box>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Main game interface
  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
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
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <img src="/lookzapp trans 2.png" alt="LookzApp" style={{ width: '80%', filter: 'brightness(0) invert(1)' }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4,
              animation: `${neonGlow} 2s infinite`,
            }}
          >
            Life Predictor
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#09c2f7' }}>
            Question {currentIndex + 1}/{questions.length}
          </Typography>

          <StyledBox sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
              {currentQuestion.text}
            </Typography>
          </StyledBox>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            {currentQuestion.answers.map((answer, index) => (
              <StyledButton
                key={answer.id}
                onClick={() => handleChoice(index)}
                sx={{
                  minWidth: '300px',
                  maxWidth: '400px',
                  height: 'auto',
                  py: 2,
                  px: 3
                }}
              >
                <Typography sx={{ color: 'white', fontSize: '1.1rem' }}>
                  {answer.text}
                </Typography>
              </StyledButton>
            ))}
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
         
        </Box>
      </Box>
    </Box>
  );
};

export default LifePredictor;