import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { red, blue } from '@mui/material/colors';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import '../App.css';

// Define the games with titles, routes, descriptions, colors, and emojis
const games = [
  {
    title: 'Two Truths & a Lie',
    route: '/two-truths',
    description: 'Guess which statement is a lie among three about another user.',
    color: red[500],
    emojis: '🤔',
  },
  {
    title: 'GeoLocate',
    route: '/geo-locate',
    description: 'Try to guess the location of another user within 500 miles.',
    color: blue[500],
    emojis: '🌍',
  },
];

function GamesSelection() {
  const navigate = useNavigate();

  // Handle navigation to the selected game's route
  const handleSelection = (route) => {
    navigate(route);
  };

  return (
    <>
      <TopBar />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%', maxWidth: 'lg' }}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            color="primary"
            gutterBottom
            sx={{ fontWeight: 700, fontFamily: 'Matt Bold' }}
          >
            Select a Game
          </Typography>
          <Typography variant="subtitle1" align="center" fontFamily={'Matt Bold'} color="text.secondary" paragraph>
            Choose a game to play and have fun!
          </Typography>
          <Grid container spacing={2} justifyContent="center" alignItems="stretch">
            {games.map((game) => (
              <Grid item xs={12} sm={6} key={game.title}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'scale(1.05)' },
                    bgcolor: game.color,
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelection(game.route)}
                    sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: game.color,
                      }}
                    >
                      <Typography variant="h1" sx={{ color: 'white' }}>
                        {game.emojis}
                      </Typography>
                    </Box>
                    <CardContent sx={{ color: 'white', textAlign: 'center', flexGrow: 1 }}>
                      <Typography variant="h6" component="div" sx={{ fontFamily: 'Matt Bold' }}>
                        {game.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'Matt Light' }}>
                        {game.description}
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

export default GamesSelection;