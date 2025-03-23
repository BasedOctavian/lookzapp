import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useInfluencerRatingData(influencerId) {
  const [influencerData, setInfluencerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch influencer data from Firestore when influencerId changes
  useEffect(() => {
    const fetchInfluencerData = async () => {
      // Check if influencerId is a string and not empty
      console.log('influencerId', influencerId);
      if (typeof influencerId === 'string' && influencerId) {
        const influencerDocRef = doc(db, 'streamers', influencerId);
        const influencerDocSnap = await getDoc(influencerDocRef);
        if (influencerDocSnap.exists()) {
          setInfluencerData({ id: influencerId, ...influencerDocSnap.data() });
        } else {
          setInfluencerData(null); // Reset if influencer doesn't exist
        }
      } else {
        console.error('Invalid influencerId:', influencerId);
        setInfluencerData(null); // Reset data if influencerId is invalid
      }
      setLoading(false);
    };

    fetchInfluencerData();
  }, [influencerId]);

  // Calculate the influencer's average rating
  const rating = useMemo(() => {
    if (!influencerData) return 0;
    const totalRanking = influencerData.ranking || 0;
    const timesRanked = influencerData.timesRanked || 0;
    return timesRanked > 0 ? totalRanking / timesRanked : 0;
  }, [influencerData]);

  /**
   * Submit a new rating for the influencer and update Firestore.
   *
   * @param {number} newRating - The overall rating submitted (e.g., 8).
   * @param {Object} featureAllocations - Points allocated to each feature from RatingScale.
   *   Expected keys from RatingScale: 'Eyes', 'Smile', 'Jawline', 'Hair', 'Body'.
   *   Values are the points (e.g., { Eyes: 2.4, Smile: 1.6, ... }).
   */
  const submitRating = async (newRating, featureAllocations) => {
    // Validate influencerId
    const strInfluencerId = influencerId.toString();
    if (typeof strInfluencerId !== 'string' || !influencerId) {
      console.error('Invalid influencerId:', influencerId);
      return;
    }
    const influencerDocRef = doc(db, 'streamers', strInfluencerId);

    // Define the key mapping from RatingScale to Firestore fields
    const keyMapping = {
      'Eyes': 'eyesRating',
      'Smile': 'smileRating',
      'Jawline': 'facialRating',
      'Hair': 'hairRating',
      'Body': 'bodyRating',
    };

    // Transform featureAllocations keys to match Firestore field names
    const mappedAllocations = {};
    for (const [feature, score] of Object.entries(featureAllocations)) {
      const mappedKey = keyMapping[feature];
      if (mappedKey) {
        mappedAllocations[mappedKey] = score;
      } else {
        console.warn(`No mapping found for feature: ${feature}`);
      }
    }

    // Get current cumulative ratings, defaulting to 0 if undefined
    const currentEyes = influencerData?.eyesRating || 0;
    const currentSmile = influencerData?.smileRating || 0;
    const currentFacial = influencerData?.facialRating || 0;
    const currentHair = influencerData?.hairRating || 0;
    const currentBody = influencerData?.bodyRating || 0;
    const currentTimesRanked = influencerData?.timesRanked || 0;
    const currentRanking = influencerData?.ranking || 0;

    // Update cumulative feature ratings with mapped values
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

    // Update the influencer's document in Firestore
    await updateDoc(influencerDocRef, {
      eyesRating: updatedEyes,
      smileRating: updatedSmile,
      facialRating: updatedFacial,
      hairRating: updatedHair,
      bodyRating: updatedBody,
      ranking: updatedRanking,
      timesRanked: updatedTimesRanked,
    });

    // Store the daily average rating in the 'dailyRatings' sub-collection
    const currentDate = new Date().toISOString().split('T')[0]; // e.g., '2023-10-17'
    await setDoc(doc(db, 'streamers', strInfluencerId, 'dailyRatings', currentDate), {
      averageRating: updatedAverageRating.toFixed(1),
    });

    // Update local state for immediate UI feedback
    setInfluencerData((prev) => ({
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

  return { influencerData, rating, submitRating, loading };
}