import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useUserRatingData(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore when userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData({ id: userId, ...userDocSnap.data() });
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [userId]);

  // Calculate the user's average rating using useMemo
  const rating = useMemo(() => {
    if (!userData) return 0;
    const ratingValue = userData.ranking || 0; // Default to 0 if rating is missing
    const timesRanked = userData.timesRanked || 0; // Default to 0 if timesRanked is missing
    return timesRanked > 0 ? ratingValue / timesRanked : 0; // Calculate average or return 0
  }, [userData]);

  // Function to submit a new rating
  const submitRating = async (newRating) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    const currentRating = userData?.ranking || 0;
    const currentTimesRanked = userData?.timesRanked || 0;
    const updatedRating = currentRating + newRating;
    const updatedTimesRanked = currentTimesRanked + 1;

    // Update Firestore
    await updateDoc(userDocRef, {
      ranking: updatedRating,
      timesRanked: updatedTimesRanked,
    });

    // Update local state for immediate UI feedback
    setUserData((prev) => ({
      ...prev,
      rating: updatedRating,
      timesRanked: updatedTimesRanked,
    }));
  };

  return { userData, rating, submitRating, loading };
}