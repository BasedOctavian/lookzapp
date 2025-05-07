import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import AuthLayout from '../Components/SignIn/AuthLayout';
import AuthCard from '../Components/SignIn/AuthCard';
import useSnackbar from '../hooks/SignIn/useSnackbar';
import BasicInfoForm from '../Components/SignUp/BasicInfoForm';
import PhysicalInfoForm from '../Components/SignUp/PhysicalInfoForm';
import { Typography, Box, Button, styled } from '@mui/material';

// Styled Components
const ButtonContainer = styled(Box)({
  display: 'flex',
  gap: '16px',
  justifyContent: 'center',
  '& > button': {
    flex: '1 1 0',
    maxWidth: '160px'
  }
});

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  color: '#fff',
  fontWeight: 600,
  padding: '10px 20px',
  borderRadius: '10px',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  fontSize: '0.95rem',
  whiteSpace: 'nowrap',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
  }
});

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
  }
}));

const PhotoContainer = styled(Box)({
  width: '100%',
  height: '300px',
  minHeight: '300px',
  maxHeight: '300px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
  borderRadius: '12px',
  border: '2px solid rgba(9, 194, 247, 0.3)',
  boxShadow: '0 0 20px rgba(9, 194, 247, 0.2)',
  overflow: 'hidden',
  backgroundColor: 'rgba(13, 17, 44, 0.5)',
  position: 'relative',
});

const PhotoPreview = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  position: 'absolute',
  top: 0,
  left: 0,
});

const VideoPreview = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  position: 'absolute',
  top: 0,
  left: 0,
});

const UploadOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  zIndex: 1,
});

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
  const [model, setModel] = useState(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar, SnackbarComponent } = useSnackbar();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePictureChange = (file) => {
    setFormData({ ...formData, profilePictureFile: file });
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

  const handleSubmit = async () => {
    if (!formData.profilePictureFile) {
      showSnackbar('Please upload a profile picture', 'error');
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
      showSnackbar("Account created! Please check your email to verify your account before signing in.", 'success');
      navigate('/signin');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getForm = () => {
    if (currentStep === 1) {
      return (
        <BasicInfoForm
          formData={formData}
          onChange={handleChange}
          onNext={nextStep}
        />
      );
    } else if (currentStep === 2) {
      return (
        <PhysicalInfoForm
          formData={formData}
          onChange={handleChange}
          onPrev={prevStep}
          onNext={nextStep}
        />
      );
    } else if (currentStep === 3) {
      return (
        <ProfilePictureForm
          model={model}
          onProfilePictureChange={handleProfilePictureChange}
          showSnackbar={showSnackbar}
          onPrev={prevStep}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          profilePictureFile={formData.profilePictureFile}
        />
      );
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title={
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h3"
              sx={{
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.5rem' }
              }}
            >
              Sign Up
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mt: 1,
                color: '#6ce9ff',
                textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
                fontWeight: 500
              }}
            >
              Step {currentStep} of 3
            </Typography>
          </Box>
        }
        form={getForm()}
        linkText="Already have an account?"
        linkHref="/signin"
        linkLabel="Sign In"
      />
      {SnackbarComponent}
    </AuthLayout>
  );
}

function ProfilePictureForm({
  model,
  onProfilePictureChange,
  showSnackbar,
  onPrev,
  onSubmit,
  isLoading,
  profilePictureFile,
}) {
  const [isChangingPhoto, setIsChangingPhoto] = useState(!profilePictureFile);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (selectedMethod === 'webcam' && !webcamStream) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [selectedMethod]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      showSnackbar("Failed to access webcam. Please ensure it's connected and permissions are granted.", 'error');
      setSelectedMethod(null);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
  };

  const detectFace = async (imageData) => {
    if (!model) {
      showSnackbar('Face detection model not loaded', 'error');
      return false;
    }

    try {
      const predictions = await model.estimateFaces(imageData);
      return predictions.length > 0;
    } catch (error) {
      console.error('Error detecting face:', error);
      return false;
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const hasFace = await detectFace(canvas);
      if (!hasFace) {
        showSnackbar('No face detected in the photo. Please try again.', 'error');
        return;
      }

      canvas.toBlob((blob) => {
        setCapturedImage(blob);
        stopWebcam();
      }, 'image/jpeg');
    }
  };

  const confirmPhoto = async () => {
    if (capturedImage) {
      const file = new File([capturedImage], 'webcam_photo.jpg', { type: 'image/jpeg' });
      onProfilePictureChange(file);
      setCapturedImage(null);
      setSelectedMethod(null);
      setIsChangingPhoto(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startWebcam();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const hasFace = await detectFace(canvas);
        if (!hasFace) {
          showSnackbar('No face detected in the photo. Please try again.', 'error');
          return;
        }
        
        onProfilePictureChange(file);
        setSelectedMethod(null);
        setIsChangingPhoto(false);
      };
    }
  };

  const handleChangePhoto = () => {
    setIsChangingPhoto(true);
    setSelectedMethod(null);
    stopWebcam();
  };

  return (
    <StyledBox>
      {profilePictureFile && !isChangingPhoto ? (
        <Box sx={{ textAlign: 'center' }}>
          <PhotoContainer>
            <PhotoPreview
              src={URL.createObjectURL(profilePictureFile)}
              alt="Profile Preview"
            />
          </PhotoContainer>
          <GradientButton onClick={handleChangePhoto}>
            Change Photo
          </GradientButton>
        </Box>
      ) : (
        <Box>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              color: '#6ce9ff',
              textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
              mb: 3
            }}
          >
            Select how to add your profile picture:
          </Typography>
          <ButtonContainer sx={{ mb: 3 }}>
            <GradientButton
              onClick={() => setSelectedMethod('upload')}
              disabled={selectedMethod === 'upload'}
            >
              Upload File
            </GradientButton>
            <GradientButton
              onClick={() => setSelectedMethod('webcam')}
              disabled={selectedMethod === 'webcam'}
            >
              Use Webcam
            </GradientButton>
          </ButtonContainer>

          {selectedMethod === 'upload' && (
            <Box sx={{ textAlign: 'center' }}>
              <PhotoContainer>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    position: 'absolute',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
                <UploadOverlay>
                  <Typography 
                    sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      textAlign: 'center',
                    }}
                  >
                    Click to upload photo
                  </Typography>
                </UploadOverlay>
              </PhotoContainer>
            </Box>
          )}

          {selectedMethod === 'webcam' && (
            <Box sx={{ textAlign: 'center' }}>
              {capturedImage ? (
                <Box>
                  <PhotoContainer>
                    <PhotoPreview
                      src={URL.createObjectURL(capturedImage)}
                      alt="Captured Preview"
                    />
                  </PhotoContainer>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <GradientButton onClick={retakePhoto}>
                      Retake
                    </GradientButton>
                    <GradientButton onClick={confirmPhoto}>
                      Use This Photo
                    </GradientButton>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <PhotoContainer>
                    <VideoPreview
                      ref={videoRef}
                      autoPlay
                    />
                  </PhotoContainer>
                  <GradientButton onClick={capturePhoto}>
                    Capture Photo
                  </GradientButton>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <ButtonContainer sx={{ mt: 4 }}>
        <GradientButton onClick={onPrev} disabled={isLoading}>
          Previous
        </GradientButton>
        <GradientButton onClick={onSubmit} disabled={isLoading || !profilePictureFile}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </GradientButton>
      </ButtonContainer>
    </StyledBox>
  );
}

export default CreateAccount;