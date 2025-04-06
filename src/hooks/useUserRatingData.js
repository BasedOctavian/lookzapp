import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useUserRatingData(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const rating = useMemo(() => {
    if (!userData) return 0;
    const totalRanking = userData.ranking || 0;
    const timesRanked = userData.timesRanked || 0;
    return timesRanked > 0 ? totalRanking / timesRanked : 0;
  }, [userData]);

  /**
   * Submit a new rating and store the average rating in dailyRatings.
   *
   * @param {number} newRating - The overall rating submitted (e.g., 8).
   * @param {Object} featureAllocations - An object with points allocated to each feature.
   *   Expected keys: 'Eyes', 'Smile', 'Jawline', 'Hair', 'Body'.
   *   Values are the points (e.g., { Eyes: 2.4, Smile: 1.6, ... }).
   */
  const submitRating = async (newRating, featureAllocations) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);

    // Define mapping from feature names to Firestore field names
    const keyMapping = {
      'Eyes': 'eyesRating',
      'Smile': 'smileRating',
      'Jawline': 'facialRating',
      'Hair': 'hairRating',
      'Body': 'bodyRating',
    };

    // Map featureAllocations to match Firestore field names
    const mappedAllocations = {};
    for (const [feature, score] of Object.entries(featureAllocations)) {
      const mappedKey = keyMapping[feature];
      if (mappedKey) mappedAllocations[mappedKey] = score;
    }

    // Get current cumulative ratings (default to 0 if undefined)
    const currentEyes = userData?.eyesRating || 0;
    const currentSmile = userData?.smileRating || 0;
    const currentFacial = userData?.facialRating || 0;
    const currentHair = userData?.hairRating || 0;
    const currentBody = userData?.bodyRating || 0;
    const currentTimesRanked = userData?.timesRanked || 0;
    const currentRanking = userData?.ranking || 0;

    // Update each feature's cumulative rating with the allocated points
    const updatedEyes = currentEyes + (mappedAllocations.eyesRating || 0);
    const updatedSmile = currentSmile + (mappedAllocations.smileRating || 0);
    const updatedFacial = currentFacial + (mappedAllocations.facialRating || 0);
    const updatedHair = currentHair + (mappedAllocations.hairRating || 0);
    const updatedBody = currentBody + (mappedAllocations.bodyRating || 0);

    // Update overall ranking and times ranked
    const updatedTimesRanked = currentTimesRanked + 1;
    const updatedRanking = currentRanking + newRating;

    // Calculate the new average rating
    const updatedAverageRating = updatedTimesRanked > 0 ? updatedRanking / updatedTimesRanked : 0;

    // Update Firestore with the new cumulative ratings
    await updateDoc(userDocRef, {
      eyesRating: updatedEyes,
      smileRating: updatedSmile,
      facialRating: updatedFacial,
      hairRating: updatedHair,
      bodyRating: updatedBody,
      ranking: updatedRanking,
      timesRanked: updatedTimesRanked,
    });

    // Store the average rating in the dailyRatings sub-collection
    const currentDate = new Date().toISOString().split('T')[0]; // e.g., '2023-10-17'
    await setDoc(doc(db, 'users', userId, 'dailyRatings', currentDate), {
      averageRating: updatedAverageRating.toFixed(1),
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