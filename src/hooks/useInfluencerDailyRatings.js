import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useInfluencerDailyRatings(influencerId) {
  const [dailyRatings, setDailyRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyRatings = async () => {
      if (!influencerId) {
        setDailyRatings([]);
        setLoading(false);
        return;
      }

      try {
        const dailyRatingsRef = collection(db, 'streamers', influencerId, 'dailyRatings');
        const q = query(dailyRatingsRef, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const ratings = querySnapshot.docs.map((doc) => ({
          date: doc.id,
          averageRating: parseFloat(doc.data().averageRating),
        }));
        setDailyRatings(ratings);
      } catch (error) {
        console.error('Error fetching daily ratings:', error);
        setDailyRatings([]);
      }
      setLoading(false);
    };

    fetchDailyRatings();
  }, [influencerId]);

  return { dailyRatings, loading };
}