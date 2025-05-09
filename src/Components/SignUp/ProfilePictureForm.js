import React, { useState, useRef } from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  Button,
  FormHelperText,
  Typography,
  CircularProgress,
  styled
} from '@mui/material';
import exif from 'exif-js';

const AuthButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  animation: 'gradientFlow 6s ease infinite',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  },
  '&.Mui-disabled': {
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)'
  }
});

const OutlinedButton = styled(Button)({
  color: '#09c2f7',
  borderColor: 'rgba(9, 194, 247, 0.3)',
  '&:hover': {
    borderColor: '#09c2f7',
    backgroundColor: 'rgba(9, 194, 247, 0.1)',
  }
});

function ProfilePictureForm({
  model,
  onProfilePictureChange,
  showSnackbar,
  onPrev,
  onSubmit,
  isLoading,
  profilePictureFile,
}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const canvasRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showSnackbar('No file selected', 'error');
      return;
    }
    if (!model) {
      console.error('Model is not loaded');
      showSnackbar('Face detection model is not available', 'error');
      return;
    }

    setIsDetecting(true);

    try {
      // Load the image
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      // Get EXIF orientation
      const orientation = await new Promise((resolve) => {
        exif.getData(file, function () {
          const orient = exif.getTag(this, 'Orientation') || 1; // Default to 1 if not found
          resolve(orient);
        });
      });

      // Set up canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const maxDimension = 640;
      let width = image.width;
      let height = image.height;

      // Resize image
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

      // Adjust canvas for EXIF orientation
      switch (orientation) {
        case 2: // Flip horizontally
          ctx.transform(-1, 0, 0, 1, width, 0);
          break;
        case 3: // Rotate 180°
          ctx.transform(-1, 0, 0, -1, width, height);
          break;
        case 4: // Flip vertically
          ctx.transform(1, 0, 0, -1, 0, height);
          break;
        case 5: // Rotate 90° CW + Flip vertically
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, 1, 1, 0, 0, 0);
          break;
        case 6: // Rotate 90° CW
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, 1, -1, 0, height, 0);
          break;
        case 7: // Rotate 90° CCW + Flip vertically
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, -1, -1, 0, height, width);
          break;
        case 8: // Rotate 90° CCW
          canvas.width = height;
          canvas.height = width;
          ctx.transform(0, -1, 1, 0, 0, width);
          break;
        default: // Orientation 1 or undefined
          break;
      }

      // Draw the image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Perform face detection
      const predictions = await model.estimateFaces(canvas);

      if (predictions.length > 0) {
        onProfilePictureChange(file);
        showSnackbar('Face detected, picture accepted', 'success');
      } else {
        showSnackbar('No face detected, please upload a different picture', 'error');
      }
    } catch (error) {
      console.error('Error in face detection process:', error);
      showSnackbar(`Error detecting face: ${error.message}`, 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <FormControl required>
        <FormLabel sx={{ 
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 500,
          fontSize: '0.875rem',
          mb: 1
        }}>
          Profile Picture
        </FormLabel>
        <OutlinedButton variant="outlined" component="label">
          Upload Profile Picture
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </OutlinedButton>
        <FormHelperText sx={{ 
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.75rem',
          mt: 1
        }}>
          Please upload a picture with a clearly detectable face. This is required.
        </FormHelperText>
        {isDetecting && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} sx={{ color: '#09c2f7' }} />
            <Typography sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.875rem'
            }}>
              Detecting face...
            </Typography>
          </Stack>
        )}
        {profilePictureFile && (
          <Typography sx={{ 
            color: '#09c2f7',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            Face detected, picture accepted
          </Typography>
        )}
      </FormControl>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Stack direction="row" spacing={2}>
        <OutlinedButton
          variant="outlined"
          size="large"
          fullWidth
          onClick={onPrev}
        >
          Previous
        </OutlinedButton>
        <AuthButton
          variant="contained"
          size="large"
          fullWidth
          onClick={onSubmit}
          disabled={isLoading || isDetecting || !profilePictureFile}
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </AuthButton>
      </Stack>
    </Stack>
  );
}

export default ProfilePictureForm;