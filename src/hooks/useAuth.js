import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  ActionCodeSettings
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, displayName, gender, ethnicity, eyeColor, height, weight, profilePictureFile = null) => {
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Configure email verification settings
      const actionCodeSettings = {
        url: 'https://lookzapp.com/signin',
        handleCodeInApp: true,
        dynamicLinkDomain: 'lookzapp.page.link'
      };

      // Send email verification with custom settings
      await sendEmailVerification(user, actionCodeSettings);

      // Handle profile picture upload if provided
      let profilePictureURL = null;
      if (profilePictureFile) {
        const fileExtension = profilePictureFile.name.split('.').pop();
        const storageRef = ref(storage, `profilePictures/${user.uid}.${fileExtension}`);
        await uploadBytes(storageRef, profilePictureFile);
        profilePictureURL = await getDownloadURL(storageRef);
      }

      // Simplify ethnicity for database storage
      const simplifiedEthnicity = simplifyEthnicity(ethnicity);

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email: user.email,
        createdAt: serverTimestamp(),
        gender,
        ethnicity: simplifiedEthnicity,
        eyeColor,
        height: Number(height),
        weight: Number(weight),
        profilePicture: profilePictureURL,
        ranking: 0,
        timesRanked: 0,
        bodyRating: 0,
        eyesRating: 0,
        facialRating: 0,
        hairRating: 0,
        smileRating: 0,
        emailVerified: false
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  const simplifyEthnicity = (ethnicity) => {
    switch (ethnicity) {
      case 'European':
        return 'euro';
      case 'African':
        return 'african';
      case 'East Asian':
      case 'South Asian':
        return 'asian';
      case 'Hispanic/Latino':
        return 'hispanic';
      case 'Middle Eastern':
      case 'Native American':
      case 'Pacific Islander':
      case 'Other':
        return 'other';
      default:
        return 'other';
    }
  };

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        const actionCodeSettings = {
          url: 'https://lookzapp.com/signin',
          handleCodeInApp: true,
          dynamicLinkDomain: 'lookzapp.page.link'
        };
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  return { 
    user, 
    loading, 
    signUp, 
    signIn, 
    signOut: signOutUser,
    resendVerificationEmail 
  };
}