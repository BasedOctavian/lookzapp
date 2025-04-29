import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useUserDocument(userId) {
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDocument = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = { id: userDocSnap.id, ...userDocSnap.data() };
          setUserDoc(userData);
        } else {
          console.log('No user document found for ID:', userId);
        }
      } catch (err) {
        console.error('Error fetching user document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDocument();
  }, [userId]);

  return { userDoc, loading, error };
} 