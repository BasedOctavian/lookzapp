import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, FieldPath } from 'firebase/firestore';
import { db } from '../firebase';

export function useInfluencerDailyRatings(influencerId) {
  const [dailyRatings, setDailyRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDailyRatings = async () => {
      if (!influencerId) {
        if (isMounted) {
          setDailyRatings([]);
          setLoading(false);
        }
        return;
      }

      try {
        const dailyRatingsRef = collection(db, 'streamers', influencerId, 'dailyRatings');
        const q = query(dailyRatingsRef, orderBy(FieldPath.documentId(), 'asc'));
        const querySnapshot = await getDocs(q);
        if (isMounted) {
          const ratings = querySnapshot.docs.map((doc) => ({
            date: doc.id,
            averageRating: parseFloat(doc.data().averageRating),
          }));
          setDailyRatings(ratings);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching daily ratings:', error);
          setDailyRatings([]);
          setLoading(false);
        }
      }
    };

    fetchDailyRatings();

    return () => {
      isMounted = false;
    };
  }, [influencerId]);

  return { dailyRatings, loading };
}