import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
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
      return userCredential.user;
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

  return { user, loading, signUp, signIn, signOut: signOutUser };
}