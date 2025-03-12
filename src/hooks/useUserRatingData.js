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
  
    // Map selectedFeature to the corresponding rating field
    const featureKey = selectedFeature === 'Jawline' ? 'facialRating' : `${selectedFeature.toLowerCase()}Rating`;
  
    // Get current ratings for each feature (default to 0)
    const currentEyes = userData?.eyesRating || 0;
    const currentSmile = userData?.smileRating || 0;
    const currentFacial = userData?.facialRating || 0;
    const currentHair = userData?.hairRating || 0;
    const currentBody = userData?.bodyRating || 0;
    const currentTimesRanked = userData?.timesRanked || 0;
    const currentRanking = userData?.ranking || 0;
  
    // Calculate points using the new formula
    const p_selected = 1.2 * (newRating - 5);
    const p_other = (newRating - p_selected) / 4;
  
    // Update each feature rating based on whether it is the selected feature
    const updatedEyes = featureKey === 'eyesRating' ? currentEyes + p_selected : currentEyes + p_other;
    const updatedSmile = featureKey === 'smileRating' ? currentSmile + p_selected : currentSmile + p_other;
    const updatedFacial = featureKey === 'facialRating' ? currentFacial + p_selected : currentFacial + p_other;
    const updatedHair = featureKey === 'hairRating' ? currentHair + p_selected : currentHair + p_other;
    const updatedBody = featureKey === 'bodyRating' ? currentBody + p_selected : currentBody + p_other;
  
    // Update ranking and timesRanked
    const updatedTimesRanked = currentTimesRanked + 1;
    const updatedRanking = currentRanking + newRating;
  
    // Update Firestore
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
