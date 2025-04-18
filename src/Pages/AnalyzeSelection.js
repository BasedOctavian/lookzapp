import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { orange, purple, blue, green } from '@mui/material/colors'; // Added green for new card
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import '../App.css';

// Define the analysis options
const analysisOptions = [
  {
    title: 'Looksmatch',
    route: '/looksmatch',
    description: 'Find the user who looks most similar to you.',
    color: orange[500],
    emojis: '👥',
  },
  {
    title: 'Face Scan',
    route: '/analysis',
    description: 'Scan your face to get a personalized rating.',
    color: purple[500],
    emojis: '📊',
  },
  {
    title: 'Autism Feature Analysis',
    route: '/autism-analytic',
    description: 'Analyze features commonly associated with autism.',
    color: blue[500], // Using blue for distinction
    emojis: '🧠', // Brain emoji to represent analysis
  },
  {
    title: 'GeekedGuess',
    route: '/geeked-guess',
    description: 'Analyze how open your eyes are and get insights about your alertness.',
    color: green[500], // Using green for distinction
    emojis: '👀', // Eyes emoji to represent eye analysis
  },
];

function AnalyzeSelection() {
  const navigate = useNavigate();

  // Handle navigation when an option is selected
  const handleSelection = (route) => {
    navigate(route);
  };

  return (
    <>
      <TopBar />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          p: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%', maxWidth: 'lg' }}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            color="primary"
            gutterBottom
            sx={{ fontWeight: 700, fontFamily: 'Matt Bold' }}
          >
            Select Analysis
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            fontFamily={'Matt Bold'}
            color="text.secondary"
            paragraph
          >
            Choose an analysis option to proceed.
          </Typography>
          <Grid container spacing={2} justifyContent="center" alignItems="stretch">
            {analysisOptions.map((option) => (
              <Grid item xs={12} sm={6} key={option.title}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'scale(1.05)' },
                    bgcolor: option.color,
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelection(option.route)}
                    sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: option.color,
                      }}
                    >
                      <Typography variant="h1" sx={{ color: 'white' }}>
                        {option.emojis}
                      </Typography>
                    </Box>
                    <CardContent sx={{ color: 'white', textAlign: 'center', flexGrow: 1 }}>
                      <Typography variant="h6" component="div" sx={{ fontFamily: 'Matt Bold' }}>
                        {option.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'Matt Light' }}>
                        {option.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
      <Footer />
    </>
  );
}

export default AnalyzeSelection;