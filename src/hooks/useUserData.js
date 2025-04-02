import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData({ id: user.uid, ...userDocSnap.data() });
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  const rating = useMemo(() => {
    if (!userData) return 0;
    const ratingValue = userData.ranking || 0;
    const timesRanked = userData.timesRanked || 0;
    return timesRanked > 0 ? ratingValue / timesRanked : 0;
  }, [userData]);

  const bestFeature = useMemo(() => {
    if (!userData || userData.timesRanked === 0) return { name: 'None', average: 0 };
    const features = [
      { name: 'Eyes', field: 'eyesRating' },
      { name: 'Smile', field: 'smileRating' },
      { name: 'Jawline', field: 'facialRating' },
      { name: 'Hair', field: 'hairRating' },
      { name: 'Body', field: 'bodyRating' },
    ];
    const featureAverages = features.map(feature => ({
      name: feature.name,
      average: (userData[feature.field] || 0) / userData.timesRanked
    }));
    return featureAverages.reduce((prev, current) =>
      prev.average > current.average ? prev : current
    );
  }, [userData]);

  return { userData, rating, bestFeature, loading };
}