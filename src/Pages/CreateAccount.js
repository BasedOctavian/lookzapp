import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Button,
  TextField,
  Typography,
  Link,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Snackbar,
  Alert,
  InputLabel,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

function CreateAccount() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    gender: '',
    ethnicity: '',
    eyeColor: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    profilePictureFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [model, setModel] = useState(null);
  const canvasRef = useRef(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend('webgl');
      const loadedModel = await facemesh.load();
      setModel(loadedModel);
    };
    loadModel().catch((error) => {
      console.error('Error loading FaceMesh model:', error);
      showSnackbar('Failed to load face detection model', 'error');
    });
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !model) return;

    setIsDetecting(true);

    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Resize image to avoid large textures on mobile
      const maxDimension = 640;
      let width = image.width;
      let height = image.height;
      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      const predictions = await model.estimateFaces(canvas);

      if (predictions.length > 0) {
        setFormData({ ...formData, profilePictureFile: file });
        showSnackbar('Face detected, picture accepted', 'success');
      } else {
        showSnackbar('No face detected, please upload a different picture', 'error');
      }
    } catch (error) {
      console.error('Error detecting face:', error);
      showSnackbar('Error detecting face', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.displayName) {
        showSnackbar('Please fill in all fields', 'error');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (
        !formData.gender ||
        !formData.ethnicity ||
        !formData.eyeColor ||
        !formData.heightFeet ||
        !formData.heightInches ||
        !formData.weight
      ) {
        showSnackbar('Please fill in all fields', 'error');
        return;
      }
      if (
        isNaN(formData.heightFeet) ||
        isNaN(formData.heightInches) ||
        isNaN(formData.weight)
      ) {
        showSnackbar('Height and weight must be numbers', 'error');
        return;
      }
      const feet = Number(formData.heightFeet);
      const inches = Number(formData.heightInches);
      if (feet < 0 || feet > 8 || inches < 0 || inches >= 12) {
        showSnackbar('Height must be between 0 ft and 8 ft 11 in', 'error');
        return;
      }
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDetecting) {
      showSnackbar('Please wait for face detection to complete', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const totalHeightInches =
        Number(formData.heightFeet) * 12 + Number(formData.heightInches);
      await signUp(
        formData.email,
        formData.password,
        formData.displayName,
        formData.gender,
        formData.ethnicity,
        formData.eyeColor,
        totalHeightInches,
        formData.weight,
        formData.profilePictureFile
      );
      showSnackbar("You've successfully signed up!", 'success');
      navigate('/analysis');
    } catch (error) {
      showSnackbar(error.message, 'error');
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
            Sign Up - Step {currentStep} of 3
          </Typography>

          {currentStep === 1 && (
            <Stack spacing={2}>
              <TextField
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Display Name"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={nextStep}
              >
                Next
              </Button>
            </Stack>
          )}

          {currentStep === 2 && (
            <Stack spacing={2}>
              <FormControl component="fieldset" required>
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                </RadioGroup>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Ethnicity</InputLabel>
                <Select
                  label="Ethnicity"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleChange}
                >
                  <MenuItem value="" disabled>
                    Select ethnicity
                  </MenuItem>
                  <MenuItem value="European">European</MenuItem>
                  <MenuItem value="African">African</MenuItem>
                  <MenuItem value="East Asian">East Asian</MenuItem>
                  <MenuItem value="South Asian">South Asian</MenuItem>
                  <MenuItem value="Middle Eastern">Middle Eastern</MenuItem>
                  <MenuItem value="Hispanic/Latino">Hispanic/Latino</MenuItem>
                  <MenuItem value="Native American">Native American</MenuItem>
                  <MenuItem value="Pacific Islander">Pacific Islander</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Eye Color</InputLabel>
                <Select
                  label="Eye Color"
                  name="eyeColor"
                  value={formData.eyeColor}
                  onChange={handleChange}
                >
                  <MenuItem value="" disabled>
                    Select eye color
                  </MenuItem>
                  <MenuItem value="blue">Blue</MenuItem>
                  <MenuItem value="green">Green</MenuItem>
                  <MenuItem value="brown">Brown</MenuItem>
                  <MenuItem value="hazel">Hazel</MenuItem>
                  <MenuItem value="gray">Gray</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Height (feet)"
                  type="number"
                  name="heightFeet"
                  value={formData.heightFeet}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 8 }}
                />
                <TextField
                  label="Height (inches)"
                  type="number"
                  name="heightInches"
                  value={formData.heightInches}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 11 }}
                />
              </Stack>
              <TextField
                label="Weight (pounds)"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={prevStep}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={nextStep}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          )}

          {currentStep === 3 && (
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Profile Picture (optional)</FormLabel>
                <Button variant="outlined" component="label">
                  Upload Profile Picture
                  <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                </Button>
                <FormHelperText>
                  Please upload a picture with a clearly detectable face.
                </FormHelperText>
                {isDetecting && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} />
                    <Typography>Detecting face...</Typography>
                  </Stack>
                )}
                {formData.profilePictureFile && (
                  <Typography color="green">Face detected, picture accepted</Typography>
                )}
              </FormControl>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={prevStep}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isLoading || isDetecting}
                >
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </Button>
              </Stack>
            </Stack>
          )}

          <Typography align="center" color="textSecondary">
            Already have an account?{' '}
            <Link href="/signin" underline="hover">
              Sign In
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

export default CreateAccount;