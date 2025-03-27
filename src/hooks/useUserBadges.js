import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useUserBadges(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize userId to a string (or null if invalid)
  const strUserId = userId ? String(userId) : null;

  // Fetch user data from Firestore when userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (strUserId) {
        try {
          const userDocRef = doc(db, 'users', strUserId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData({ id: strUserId, ...userDocSnap.data() });
          } else {
            console.log(`No document found for userId: ${strUserId}`);
            setUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        console.log('userId is null or invalid:', userId);
        setUserData(null);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [strUserId]);

  // Define badge criteria
  const badgeDefinitions = [
    {
      name: 'Captivating Eyes',
      emoji: '🧿',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const featureRating = data.eyesRating || 0;
        return timesRanked > 0 && featureRating / timesRanked > 2.5;
      },
    },
    {
      name: 'Dazzling Smile',
      emoji: '😁',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const featureRating = data.smileRating || 0;
        return timesRanked > 0 && featureRating / timesRanked > 2.5;
      },
    },
    {
      name: 'Chiseled Jawline',
      emoji: '🗿',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const featureRating = data.facialRating || 0;
        return timesRanked > 0 && featureRating / timesRanked > 2.5;
      },
    },
    {
      name: 'Luscious Locks',
      emoji: '💇',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const featureRating = data.hairRating || 0;
        return timesRanked > 0 && featureRating / timesRanked > 2.5;
      },
    },
    {
      name: 'Fit Physique',
      emoji: '💪',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const featureRating = data.bodyRating || 0;
        return timesRanked > 0 && featureRating / timesRanked > 2.5;
      },
    },
    {
      name: 'Top Tier',
      emoji: '🏆',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const ranking = data.ranking || 0;
        return timesRanked > 0 && ranking / timesRanked > 8.0;
      },
    },
    {
      name: 'Elite',
      emoji: '👑',
      qualifies: (data) => {
        const timesRanked = data.timesRanked || 0;
        const ranking = data.ranking || 0;
        return timesRanked > 0 && ranking / timesRanked > 9.0;
      },
    },
    {
      name: 'Popular',
      emoji: '🌟',
      qualifies: (data) => (data.timesRanked || 0) > 100,
    },
    {
      name: 'Celebrity',
      emoji: '🎉',
      qualifies: (data) => (data.timesRanked || 0) > 500,
    },
    {
      name: 'Newbie',
      emoji: '🐣',
      qualifies: (data) => {
        if (!data.createdAt) return false;
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 30;
      },
    },
    {
      name: 'Veteran',
      emoji: '🕰️',
      qualifies: (data) => {
        if (!data.createdAt) return false;
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 365;
      },
    },
    {
      name: 'Old Timer',
      emoji: '⏳',
      qualifies: (data) => {
        if (!data.createdAt) return false;
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 730;
      },
    },
  ];

  // Compute earned badges based on user data
  const earnedBadges = useMemo(() => {
    if (!userData) return [];
    return badgeDefinitions.filter((badge) => badge.qualifies(userData));
  }, [userData]);

  return { earnedBadges, loading };
}