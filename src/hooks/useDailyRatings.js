// hooks/useDailyRatings.js
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useDailyRatings(userId) {
  const [dailyRatings, setDailyRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyRatings = async () => {
      if (!userId) {
        setDailyRatings([]);
        setLoading(false);
        return;
      }
      try {
        const dailyRatingsRef = collection(db, 'users', userId, 'dailyRatings');
        const querySnapshot = await getDocs(dailyRatingsRef);
        const ratings = querySnapshot.docs
          .map(doc => ({
            date: doc.id,
            averageRating: Number(doc.data().averageRating)
          }))
          .filter(rating => !isNaN(rating.averageRating));
        // Sort by date
        ratings.sort((a, b) => a.date.localeCompare(b.date));
        setDailyRatings(ratings);
      } catch (error) {
        console.error('Error fetching daily ratings:', error);
        setDailyRatings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyRatings();
  }, [userId]);

  return { dailyRatings, loading };
}