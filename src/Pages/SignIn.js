import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Link,
  Snackbar,
  Alert,
} from '@mui/material';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      setSnackbar({
        open: true,
        message: 'Signed in successfully! Welcome back!',
        severity: 'success',
      });
      navigate('/');
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #1A202C, rgb(66, 71, 76))',
        padding: 4,
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: { xs: '90%', md: '400px' } }}>
        <Stack spacing={3}>
          <Typography variant="h5" align="center" color="primary">
            Sign In
          </Typography>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={2}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Stack>
          </form>
          <Typography align="center" color="textSecondary">
            Don’t have an account?{' '}
            <Link href="/createaccount" underline="hover">
              Sign Up
            </Link>
          </Typography>
        </Stack>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SignIn;
