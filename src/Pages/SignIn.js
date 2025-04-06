import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import SignInForm from '../Components/SignIn/SignInForm'; // Adjust path as needed
import AuthLayout from '../Components/SignIn/AuthLayout'; // Adjust path as needed
import AuthCard  from '../Components/SignIn/AuthCard'; // Adjust path as needed
import useSnackbar from '../hooks/SignIn/useSnackbar'; // Adjust path as needed


function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const handleSignIn = async (email, password) => {
    setIsLoading(true);
    try {
      await signIn(email, password);
      showSnackbar('Signed in successfully! Welcome back!', 'success');
      navigate('/');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Sign In"
        form={<SignInForm onSubmit={handleSignIn} isLoading={isLoading} />}
        linkText="Don’t have an account?"
        linkHref="/createaccount"
        linkLabel="Sign Up"
      />
      {SnackbarComponent}
    </AuthLayout>
  );
}

export default SignIn;