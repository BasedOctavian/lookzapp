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

// CSV data included directly in the file
const csvData = `
QuestionID,QuestionText,AnswerID,AnswerText,Stocks,Crypto,Jobs,Musk,Peterson,Tate,MSM,Rogan,Obama,Trump,Socialism,Capitalism,iPhone,Android,Drake,Kanye,Swift,Beyonce,Messi,Ronaldo,MJ,LeBron
Q1,"When investing money, you prefer...",A1,"Established companies with proven track records",3,-3,2,-2,2,-2,2,-2,2,-2,2,-2,1,-1,1,-1,1,-1,1,-1,1,-1
Q1,"When investing money, you prefer...",A2,"Emerging technologies with high growth potential",-3,3,-2,2,-2,2,-2,2,-2,2,-2,2,-1,1,-1,1,-1,1,-1,1,-1,1
Q2,"In business, you value...",A1,"Sustainable growth and long-term stability",2,-2,3,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q2,"In business, you value...",A2,"Rapid disruption and market transformation",-2,2,-1,3,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q3,"When facing a challenge, you...",A1,"Analyze thoroughly before taking action",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q3,"When facing a challenge, you...",A2,"Trust your instincts and act decisively",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q4,"In leadership, you believe in...",A1,"Building strong systems and processes",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q4,"In leadership, you believe in...",A2,"Inspiring through vision and charisma",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q5,"When making decisions, you prioritize...",A1,"Data and logical analysis",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q5,"When making decisions, you prioritize...",A2,"Intuition and bold moves",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q6,"In innovation, you focus on...",A1,"Refining and perfecting existing solutions",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q6,"In innovation, you focus on...",A2,"Creating entirely new paradigms",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q7,"When communicating, you prefer...",A1,"Clear, structured messaging",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q7,"When communicating, you prefer...",A2,"Emotional, impactful storytelling",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q8,"In competition, you rely on...",A1,"Consistent performance and reliability",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q8,"In competition, you rely on...",A2,"Game-changing moments and flair",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q9,"When building a team, you value...",A1,"Experience and proven track records",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q9,"When building a team, you value...",A2,"Raw talent and potential",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q10,"In your career, you aim to...",A1,"Build a lasting legacy",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q10,"In your career, you aim to...",A2,"Make immediate impact",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q11,"When facing criticism, you...",A1,"Analyze and learn from feedback",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q11,"When facing criticism, you...",A2,"Stay true to your vision",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q12,"In your personal life, you prefer...",A1,"Stability and routine",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q12,"In your personal life, you prefer...",A2,"Spontaneity and change",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q13,"When solving problems, you...",A1,"Follow established best practices",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q13,"When solving problems, you...",A2,"Create innovative solutions",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q14,"In relationships, you value...",A1,"Trust and reliability",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q14,"In relationships, you value...",A2,"Passion and excitement",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
Q15,"When pursuing goals, you focus on...",A1,"Methodical progress",2,-2,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1,-1
Q15,"When pursuing goals, you focus on...",A2,"Breakthrough moments",-2,2,-1,2,-1,2,-1,1,-1,1,-1,2,-1,2,-1,2,-1,2,-1,1,-1,1
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
const groupQuestions = (data, archetypes) => {
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
      scores: archetypes.reduce((acc, archetype) => {
        acc[archetype] = parseInt(row[archetype], 10);
        return acc;
      }, {})
    };
    questionsMap.get(questionId).answers.push(answer);
  });
  return Array.from(questionsMap.values());
};

const LogicalProfile = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [challengedRecommendations, setChallengedRecommendations] = useState({});
  const [showContent, setShowContent] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Define archetypes
  const archetypes = [
    'Stocks', 'Crypto', 'Jobs', 'Musk', 'Peterson', 'Tate', 'MSM', 'Rogan', 'Obama', 'Trump',
    'Socialism', 'Capitalism', 'iPhone', 'Android', 'Drake', 'Kanye', 'Swift', 'Beyonce',
    'Messi', 'Ronaldo', 'MJ', 'LeBron'
  ];

  // Define dichotomies for comparison
  const dichotomies = [
    ['Crypto', 'Stocks'],
    ['Jobs', 'Musk'],
    ['Tate', 'Peterson'],
    ['Rogan', 'MSM'],
    ['Trump', 'Obama'],
    ['Capitalism', 'Socialism'],
    ['iPhone', 'Android'],
    ['Drake', 'Kanye'],
    ['Swift', 'Beyonce'],
    ['Messi', 'Ronaldo'],
    ['MJ', 'LeBron']
  ];

  // Define display names for archetypes
  const dichotomyNames = {
    'Crypto': 'Crypto',
    'Stocks': 'Stocks',
    'Jobs': 'Steve Jobs',
    'Musk': 'Elon Musk',
    'Tate': 'Andrew Tate',
    'Peterson': 'Jordan Peterson',
    'Rogan': 'Joe Rogan',
    'MSM': 'Mainstream Media',
    'Trump': 'Trump',
    'Obama': 'Obama',
    'Capitalism': 'Capitalism',
    'Socialism': 'Socialism',
    'iPhone': 'iPhone',
    'Android': 'Android',
    'Drake': 'Drake',
    'Kanye': 'Kanye',
    'Swift': 'Taylor Swift',
    'Beyonce': 'Beyoncé',
    'Messi': 'Messi',
    'Ronaldo': 'Ronaldo',
    'MJ': 'MJ',
    'LeBron': 'LeBron'
  };

  // Parse and set questions on component mount
  useEffect(() => {
    const parsedData = parseCSV(csvData);
    const questionsData = groupQuestions(parsedData, archetypes);
    setQuestions(questionsData);
    setScores(archetypes.reduce((acc, archetype) => {
      acc[archetype] = 0;
      return acc;
    }, {}));
    setIsLoading(false);
  }, []);

  // Add loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(timer);
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
      for (const [archetype, score] of Object.entries(selectedAnswer.scores)) {
        newScores[archetype] += score;
      }
      return newScores;
    });
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameOver(true);
      // Add delay before showing results
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress sx={{ color: '#09c2f7' }} />
        </Box>
      </Box>
    );
  }

  // Game over state with predicted stances in grid format
  if (gameOver) {
    if (!showResults) {
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

    // Group results by category with improved descriptions
    const categories = {
      'Financial & Technology': {
        pairs: [
          ['Crypto', 'Stocks'],
          ['Jobs', 'Musk'],
          ['iPhone', 'Android']
        ],
        description: 'Your approach to technology and financial decisions'
      },
      'Political & Media': {
        pairs: [
          ['Peterson', 'Tate'],
          ['Rogan', 'MSM'],
          ['Trump', 'Obama'],
          ['Capitalism', 'Socialism']
        ],
        description: 'Your political and media consumption preferences'
      },
      'Entertainment & Sports': {
        pairs: [
          ['Drake', 'Kanye'],
          ['Swift', 'Beyonce'],
          ['Messi', 'Ronaldo'],
          ['MJ', 'LeBron']
        ],
        description: 'Your entertainment and sports preferences'
      }
    };

    // Calculate overall alignment scores with improved weighting
    const alignmentScores = {
      'Conservative': 0,
      'Liberal': 0,
      'Traditional': 0,
      'Progressive': 0
    };

    // Update alignment scores with improved weighting
    if (scores['Trump'] > scores['Obama']) alignmentScores['Conservative'] += 3;
    if (scores['Obama'] > scores['Trump']) alignmentScores['Liberal'] += 3;
    if (scores['Capitalism'] > scores['Socialism']) alignmentScores['Conservative'] += 3;
    if (scores['Socialism'] > scores['Capitalism']) alignmentScores['Liberal'] += 3;
    if (scores['Rogan'] > scores['MSM']) alignmentScores['Conservative'] += 2;
    if (scores['MSM'] > scores['Rogan']) alignmentScores['Liberal'] += 2;
    if (scores['Peterson'] > scores['Tate']) alignmentScores['Traditional'] += 2;
    if (scores['Tate'] > scores['Peterson']) alignmentScores['Progressive'] += 2;

    // Find dominant alignments
    const maxScore = Math.max(...Object.values(alignmentScores));
    const dominantAlignments = Object.entries(alignmentScores)
      .filter(([_, score]) => score === maxScore)
      .map(([alignment]) => alignment);

    // Generate personalized recommendations based on scores
    const getRecommendations = () => {
      const recommendations = [];
      
      // Financial & Technology recommendations
      if (scores['Stocks'] > scores['Crypto']) {
        recommendations.push({
          category: 'Financial',
          title: 'Investment Strategy',
          description: 'Your preference for established companies suggests you value stability and proven track records. Consider focusing on blue-chip stocks and dividend-paying companies that align with your risk-averse nature.',
          challenge: 'While stability is important, consider that the most successful investors often take calculated risks. Your cautious approach might cause you to miss out on significant growth opportunities in emerging markets and innovative technologies.',
        });
      } else {
        recommendations.push({
          category: 'Financial',
          title: 'Investment Strategy',
          description: "Your inclination towards emerging technologies indicates you're comfortable with higher risk for potential higher returns. Consider allocating a portion of your portfolio to growth stocks and innovative sectors.",
          challenge: 'While innovation is exciting, remember that established companies often provide steady returns and stability. Your risk-taking approach might benefit from some balance with proven, reliable investments.',
        });
      }

      // Business approach recommendations
      if (scores['Jobs'] > scores['Musk']) {
        recommendations.push({
          category: 'Business',
          title: 'Business Approach',
          description: 'Your preference for sustainable growth suggests you value long-term stability and consistent performance. Focus on building strong foundations and maintaining high quality standards in your ventures.',
          challenge: 'While sustainable growth is admirable, sometimes rapid innovation and bold moves are necessary to stay ahead. Your methodical approach might benefit from occasionally embracing more disruptive strategies.',
        });
      } else {
        recommendations.push({
          category: 'Business',
          title: 'Business Approach',
          description: 'Your alignment with disruptive innovation suggests you thrive in dynamic environments. Consider pursuing opportunities in emerging markets and technologies where you can make a significant impact.',
          challenge: 'While disruption is powerful, sustainable growth often requires strong foundations and consistent execution. Your innovative approach might benefit from more focus on building lasting systems and processes.',
        });
      }

      // Political & Media recommendations
      if (alignmentScores['Conservative'] > alignmentScores['Liberal']) {
        recommendations.push({
          category: 'Media',
          title: 'Media Consumption',
          description: 'Your conservative leanings suggest you value traditional perspectives and established institutions. Consider following media outlets that provide in-depth analysis and maintain high journalistic standards.',
          challenge: 'While traditional perspectives are valuable, exposing yourself to diverse viewpoints can help you understand different perspectives and make more informed decisions.',
        });
      } else {
        recommendations.push({
          category: 'Media',
          title: 'Media Consumption',
          description: 'Your progressive inclinations suggest you value diverse perspectives and social change. Consider following media outlets that focus on innovation, social justice, and forward-thinking solutions.',
          challenge: 'While progressive ideas are important, understanding traditional perspectives can help you build bridges and create more effective solutions that work for everyone.',
        });
      }

      // Entertainment recommendations
      if (scores['Drake'] > scores['Kanye']) {
        recommendations.push({
          category: 'Entertainment',
          title: 'Entertainment Preferences',
          description: 'Your preference for mainstream success suggests you value broad appeal and consistent quality. Consider exploring content that balances commercial success with artistic integrity.',
          challenge: 'While mainstream success is impressive, sometimes the most innovative and boundary-pushing content comes from artists who prioritize creative expression over commercial appeal.',
        });
      } else {
        recommendations.push({
          category: 'Entertainment',
          title: 'Entertainment Preferences',
          description: 'Your preference for innovative expression suggests you value artistic experimentation. Consider exploring content that pushes boundaries and challenges conventional norms.',
          challenge: 'While artistic innovation is valuable, mainstream success often comes from understanding and connecting with a broader audience. Consider exploring content that balances creativity with accessibility.',
        });
      }

      return recommendations;
    };

    const recommendations = getRecommendations();

    const handleChallenge = (index) => {
      setChallengedRecommendations(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    };

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
            Your Logical Profile Results
          </Typography>

          {/* Overall Alignment Section */}
          <StyledBox sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 6, animation: `${fadeIn} 0.5s ease-out` }}>
            <Typography variant="h5" sx={{ color: '#09c2f7', mb: 3 }}>
              Your Overall Alignment
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              {dominantAlignments.map((alignment) => (
                <Box
                  key={alignment}
                  sx={{
                    background: 'linear-gradient(45deg, rgba(9, 194, 247, 0.2), rgba(250, 14, 164, 0.2))',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(9, 194, 247, 0.3)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#09c2f7' }}>
                    {alignment}
                  </Typography>
                </Box>
              ))}
            </Box>
          </StyledBox>

          {/* Personalized Recommendations Section */}
          <StyledBox sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 6, animation: `${fadeIn} 0.5s ease-out` }}>
            <Typography variant="h5" sx={{ color: '#09c2f7', mb: 3 }}>
              Personalized Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {recommendations.map((rec, index) => (
                <Box
                  key={index}
                  sx={{
                    background: 'rgba(13, 17, 44, 0.5)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(9, 194, 247, 0.2)',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#09c2f7', mb: 1 }}>
                    {rec.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#fff', opacity: 0.9, mb: 2 }}>
                    {challengedRecommendations[index] ? rec.challenge : rec.description}
                  </Typography>
                  <Button
                    onClick={() => handleChallenge(index)}
                    sx={{
                      color: '#09c2f7',
                      border: '1px solid #09c2f7',
                      borderRadius: '20px',
                      px: 2,
                      py: 0.5,
                      '&:hover': {
                        background: 'rgba(9, 194, 247, 0.1)',
                        border: '1px solid #09c2f7',
                      },
                    }}
                  >
                    {challengedRecommendations[index] ? 'Show Original' : 'Challenge This'}
                  </Button>
                </Box>
              ))}
            </Box>
          </StyledBox>

          {/* Detailed Results Sections */}
          {Object.entries(categories).map(([category, { pairs, description }]) => (
            <StyledBox key={category} sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 4, animation: `${fadeIn} 0.5s ease-out` }}>
              <Typography variant="h5" sx={{ color: '#09c2f7', mb: 2 }}>
                {category}
              </Typography>
              <Typography variant="body1" sx={{ color: '#fff', mb: 3, opacity: 0.8 }}>
                {description}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {pairs.map(([left, right]) => {
                  const leftScore = scores[left];
                  const rightScore = scores[right];
                  const total = Math.abs(leftScore) + Math.abs(rightScore);
                  const leftPercentage = total === 0 ? 50 : (Math.abs(leftScore) / total) * 100;
                  const rightPercentage = 100 - leftPercentage;
                  const circlePosition = leftScore > rightScore ? leftPercentage : rightPercentage;
                  const dominantSide = leftScore > rightScore ? 'left' : 'right';
                  
                  return (
                    <Box
                      key={`${left}-${right}`}
                      sx={{
                        background: 'rgba(13, 17, 44, 0.5)',
                        borderRadius: '16px',
                        padding: '16px',
                        border: '1px solid rgba(9, 194, 247, 0.2)',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                        {dichotomyNames[left]} vs {dichotomyNames[right]}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ color: '#09c2f7' }}>
                            {dichotomyNames[left]} ({leftPercentage.toFixed(0)}%)
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ color: '#fa0ea4' }}>
                            {dichotomyNames[right]} ({rightPercentage.toFixed(0)}%)
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          height: '8px',
                          background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
                          borderRadius: '4px',
                          position: 'relative',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${circlePosition}%`,
                            top: '-4px',
                            width: '16px',
                            height: '16px',
                            background: '#fff',
                            borderRadius: '50%',
                            transform: 'translateX(-50%)',
                            boxShadow: '0 0 8px rgba(9, 194, 247, 0.5)',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </StyledBox>
          ))}

          {/* Your Answers Section */}
          <StyledBox sx={{ maxWidth: '800px', mx: 'auto', mt: 4, mb: 4, animation: `${fadeIn} 0.5s ease-out` }}>
            <Typography variant="h5" sx={{ color: '#09c2f7', mb: 3 }}>
              Your Answers
            </Typography>
            <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 2 }}>
              {questions.map((question) => (
                <Box
                  key={question.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    background: 'rgba(13, 17, 44, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid rgba(9, 194, 247, 0.2)',
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: 500, mb: 1 }}>
                    {question.text}
                  </Typography>
                  <Typography sx={{ color: '#09c2f7' }}>
                    Your answer: {selectedAnswers[question.id] || 'Not answered'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </StyledBox>

          <StyledButton
            onClick={() => {
              setCurrentIndex(0);
              setScores(archetypes.reduce((acc, archetype) => {
                acc[archetype] = 0;
                return acc;
              }, {}));
              setSelectedAnswers({});
              setGameOver(false);
            }}
            sx={{ mt: 4 }}
          >
            Play Again
          </StyledButton>

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
      </Box>
    );
  }

  // Check if questions are loaded
  if (questions.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" sx={{ color: '#09c2f7' }}>No questions available.</Typography>
        </Box>
      </Box>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Add loading screen effect
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
            Preference Profile
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
      </Box>
    </Box>
  );
};

export default LogicalProfile;