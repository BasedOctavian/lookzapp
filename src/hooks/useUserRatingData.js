import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useUserRatingData(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user document from Firestore when userId changes
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

  // Calculate the average rating (cumulative ranking divided by timesRanked)
  const rating = useMemo(() => {
    if (!userData) return 0;
    const totalRanking = userData.ranking || 0;
    const timesRanked = userData.timesRanked || 0;
    return timesRanked > 0 ? totalRanking / timesRanked : 0;
  }, [userData]);

  /**
   * Submit a new rating.
   *
   * @param {number} newRating - The overall rating submitted (e.g., 7).
   * @param {string} selectedFeature - The feature being rated.
   *   Expected values: "eyesRating", "smileRating", "facialRating", "hairRating", or "bodyRating".
   *   (If the UI shows "Jawline", it will be mapped to "facialRating".)
   */
  const submitRating = async (newRating, selectedFeature) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
  
    // Map selectedFeature to the corresponding rating field, ensuring case matches database fields
    const featureKey = selectedFeature === 'Jawline' ? 'facialRating' : `${selectedFeature.toLowerCase()}Rating`;
  
    // Get current ratings for each feature (default to 0)
    const currentEyes = userData?.eyesRating || 0;
    const currentSmile = userData?.smileRating || 0;
    const currentFacial = userData?.facialRating || 0;
    const currentHair = userData?.hairRating || 0;
    const currentBody = userData?.bodyRating || 0;
    const currentTimesRanked = userData?.timesRanked || 0;
    const currentRanking = userData?.ranking || 0;
  
    let selectedPoints;
    let otherPoints;
    if (newRating < 5) {
      // For low ratings: selected feature gets 0 points; others get newRating/4 each
      selectedPoints = 0;
      otherPoints = newRating / 4;
    } else if (newRating === 5) {
      // For a neutral rating: selected gets 3 points; others get (5 - 3)/4 = 0.5 each
      selectedPoints = 3;
      otherPoints = (5 - 3) / 4; // 0.5
    } else {
      // For high ratings: selected gets 3 + 0.6 * (newRating - 5); others share the rest
      selectedPoints = 3 + 0.6 * (newRating - 5);
      otherPoints = (newRating - selectedPoints) / 4;
    }
  
    // Update each feature rating based on whether it is the selected feature
    const updatedEyes = featureKey === 'eyesRating' ? currentEyes + selectedPoints : currentEyes + otherPoints;
    const updatedSmile = featureKey === 'smileRating' ? currentSmile + selectedPoints : currentSmile + otherPoints;
    const updatedFacial = featureKey === 'facialRating' ? currentFacial + selectedPoints : currentFacial + otherPoints;
    const updatedHair = featureKey === 'hairRating' ? currentHair + selectedPoints : currentHair + otherPoints;
    const updatedBody = featureKey === 'bodyRating' ? currentBody + selectedPoints : currentBody + otherPoints;
  
    // Calculate the cumulative ranking as the sum of all feature ratings
    const updatedTimesRanked = currentTimesRanked + 1;
    const updatedRanking = currentRanking + newRating
  
    // Update Firestore with the new ratings
    await updateDoc(userDocRef, {
      eyesRating: updatedEyes,
      smileRating: updatedSmile,
      facialRating: updatedFacial,
      hairRating: updatedHair,
      bodyRating: updatedBody,
      ranking: updatedRanking,
      timesRanked: updatedTimesRanked,
    });
  
    // Update local state for immediate UI feedback
    setUserData((prev) => ({
      ...prev,
      eyesRating: updatedEyes,
      smileRating: updatedSmile,
      facialRating: updatedFacial,
      hairRating: updatedHair,
      bodyRating: updatedBody,
      ranking: updatedRanking,
      timesRanked: updatedTimesRanked,
    }));
  };

  return { userData, rating, submitRating, loading };
}
