import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase'; // Ensure storage is imported
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign up with email, password, display name, and optional profile picture
  const signUp = async (email, password, displayName = '', profilePictureFile = null) => {
    try {
      // Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      let profilePictureURL = null;

      // If a profile picture is provided, upload it to Firebase Storage
      if (profilePictureFile) {
        const fileExtension = profilePictureFile.name.split('.').pop();
        const storageRef = ref(storage, `profilePictures/${user.uid}.${fileExtension}`);
        await uploadBytes(storageRef, profilePictureFile);
        profilePictureURL = await getDownloadURL(storageRef);
      }

      // Store user data in Firestore, including the profile picture URL if available
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email: user.email,
        createdAt: serverTimestamp(),
        ranking: 5,
        timesRanked: 1,
        profilePicture: profilePictureURL // Will be null if no file is uploaded
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return { user, loading, signUp, signIn, signOut: signOutUser };
}