import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export function useUserData() {
  const { user } = useAuth(); // Get the current authenticated user
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore when the user changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData({ id: user.uid, ...userDocSnap.data() });
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  // Calculate the user's rating using useMemo
  const rating = useMemo(() => {
    if (!userData) return 0; // Return 0 if no user data is available
    const ratingValue = userData.ranking || 0; // Default to 0 if rating is missing
    console.log('Rating value:', ratingValue);
    const timesRanked = userData.timesRanked || 0; // Default to 0 if timesRanked is missing
    return timesRanked > 0 ? ratingValue / timesRanked : 0; // Calculate rating or return 0 if timesRanked is 0
  }, [userData]);

  // Return userData, the calculated rating, and loading state
  return { userData, rating, loading };
}