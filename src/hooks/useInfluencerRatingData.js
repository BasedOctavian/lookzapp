import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useInfluencerRatingData(influencerId) {
  const [influencerData, setInfluencerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize influencerId to a string (or null if invalid)
  const strInfluencerId = influencerId ? String(influencerId) : null;

  // Fetch influencer data from Firestore when influencerId changes
  useEffect(() => {
    const fetchInfluencerData = async () => {
      if (strInfluencerId) {
        try {
          const influencerDocRef = doc(db, 'streamers', strInfluencerId);
          const influencerDocSnap = await getDoc(influencerDocRef);
          if (influencerDocSnap.exists()) {
            setInfluencerData({ id: strInfluencerId, ...influencerDocSnap.data() });
          } else {
            console.log(`No document found for influencerId: ${strInfluencerId}`);
            setInfluencerData(null);
          }
        } catch (error) {
          console.error('Error fetching influencer data:', error);
          setInfluencerData(null);
        }
      } else {
        console.log('influencerId is null or invalid:', influencerId);
        setInfluencerData(null);
      }
      setLoading(false);
    };

    fetchInfluencerData();
  }, [strInfluencerId]); // Depend on strInfluencerId

  // Calculate the influencer's average rating
  const rating = useMemo(() => {
    if (!influencerData) return 0;
    const totalRanking = influencerData.ranking || 0;
    const timesRanked = influencerData.timesRanked || 0;
    return timesRanked > 0 ? totalRanking / timesRanked : 0;
  }, [influencerData]);

  const submitRating = async (newRating, featureAllocations) => {
    if (!strInfluencerId) {
      console.error('Invalid influencerId:', influencerId);
      return;
    }
    const influencerDocRef = doc(db, 'streamers', strInfluencerId);

    const keyMapping = {
      'Eyes': 'eyesRating',
      'Smile': 'smileRating',
      'Jawline': 'facialRating',
      'Hair': 'hairRating',
      'Body': 'bodyRating',
    };

    const mappedAllocations = {};
    for (const [feature, score] of Object.entries(featureAllocations)) {
      const mappedKey = keyMapping[feature];
      if (mappedKey) mappedAllocations[mappedKey] = score;
    }

    const currentEyes = influencerData?.eyesRating || 0;
    const currentSmile = influencerData?.smileRating || 0;
    const currentFacial = influencerData?.facialRating || 0;
    const currentHair = influencerData?.hairRating || 0;
    const currentBody = influencerData?.bodyRating || 0;
    const currentTimesRanked = influencerData?.timesRanked || 0;
    const currentRanking = influencerData?.ranking || 0;

    const updatedEyes = currentEyes + (mappedAllocations.eyesRating || 0);
    const updatedSmile = currentSmile + (mappedAllocations.smileRating || 0);
    const updatedFacial = currentFacial + (mappedAllocations.facialRating || 0);
    const updatedHair = currentHair + (mappedAllocations.hairRating || 0);
    const updatedBody = currentBody + (mappedAllocations.bodyRating || 0);
    const updatedTimesRanked = currentTimesRanked + 1;
    const updatedRanking = currentRanking + newRating;
    const updatedAverageRating = updatedTimesRanked > 0 ? updatedRanking / updatedTimesRanked : 0;

    try {
      // Update the main influencer document
      await updateDoc(influencerDocRef, {
        eyesRating: updatedEyes,
        smileRating: updatedSmile,
        facialRating: updatedFacial,
        hairRating: updatedHair,
        bodyRating: updatedBody,
        ranking: updatedRanking,
        timesRanked: updatedTimesRanked,
      });

      // Set the daily average rating
      const currentDate = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'streamers', strInfluencerId, 'dailyRatings', currentDate), {
        averageRating: updatedAverageRating, // Store as number
      });

      // Update local state
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
    } catch (error) {
      console.error('Error submitting rating:', error);
      // Optionally, handle the error (e.g., show a notification to the user)
    }
  };

  return { influencerData, rating, submitRating, loading };
}