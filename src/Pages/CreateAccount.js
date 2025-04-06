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
import ProfilePictureForm from '../Components/SignUp/ProfilePictureForm';

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
        title={`Sign Up - Step ${currentStep} of 3`}
        form={getForm()}
        linkText="Already have an account?"
        linkHref="/signin"
        linkLabel="Sign In"
      />
      {SnackbarComponent}
    </AuthLayout>
  );
}

export default CreateAccount;