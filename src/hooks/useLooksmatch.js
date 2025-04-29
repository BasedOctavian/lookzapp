import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useLooksmatch(uid) {
  const [looksmatch, setLooksmatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLooksmatch = async () => {
      if (!uid) {
        setLooksmatch(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch authenticated user's document
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setLooksmatch(null);
          setLoading(false);
          return;
        }

        const userData = userDocSnap.data();
        const { gender, timesRanked: userTimesRanked = 0 } = userData;

        if (!gender) {
          setLooksmatch(null);
          setLoading(false);
          return;
        }

        // Calculate authenticated user's average feature ratings
        const userFeatures = calculateAverageFeatures(userData, userTimesRanked);

        // Determine opposite gender
        const oppositeGender = gender === 'male' ? 'female' : 'male';

        // Query both 'users' and 'streamers' collections for opposite gender
        const usersQuery = query(collection(db, 'users'), where('gender', '==', oppositeGender));
        const streamersQuery = query(collection(db, 'streamers'), where('gender', '==', oppositeGender));

        const [usersSnapshot, streamersSnapshot] = await Promise.all([
          getDocs(usersQuery),
          getDocs(streamersQuery),
        ]);

        // Combine candidates from both collections
        const candidates = [
          ...usersSnapshot.docs.map((doc) => ({ id: doc.id, collection: 'users', ...doc.data() })),
          ...streamersSnapshot.docs.map((doc) => ({ id: doc.id, collection: 'streamers', ...doc.data() })),
        ];

        // Find the candidate with the closest feature ratings
        let closestCandidate = null;
        let minDistance = Infinity;

        candidates.forEach((candidate) => {
          if (candidate.id === uid) return; // Skip the authenticated user
          const { timesRanked: candidateTimesRanked = 0 } = candidate;
          if (candidateTimesRanked === 0) return; // Skip unrated candidates

          const candidateFeatures = calculateAverageFeatures(candidate, candidateTimesRanked);
          const distance = calculateEuclideanDistance(userFeatures, candidateFeatures);

          if (distance < minDistance) {
            minDistance = distance;
            closestCandidate = {
              ...candidate,
              rating: candidate.ranking / candidateTimesRanked,
            };
          }
        });

        setLooksmatch(closestCandidate);
      } catch (error) {
        setLooksmatch(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLooksmatch();
  }, [uid]);

  return { looksmatch, loading };
}

// Helper function to calculate average feature ratings
function calculateAverageFeatures(data, timesRanked) {
  if (timesRanked === 0) {
    return { body: 0, eyes: 0, facial: 0, hair: 0, smile: 0 };
  }

  return {
    body: (data.bodyRating || 0) / timesRanked,
    eyes: (data.eyesRating || 0) / timesRanked,
    facial: (data.facialRating || 0) / timesRanked,
    hair: (data.hairRating || 0) / timesRanked,
    smile: (data.smileRating || 0) / timesRanked,
  };
}

// Helper function to calculate Euclidean distance between two feature sets
function calculateEuclideanDistance(features1, features2) {
  const features = ['body', 'eyes', 'facial', 'hair', 'smile'];
  return Math.sqrt(
    features.reduce((sum, feature) => {
      const diff = (features1[feature] || 0) - (features2[feature] || 0);
      return sum + diff * diff;
    }, 0)
  );
}