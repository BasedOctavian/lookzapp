import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTopRatedData } from './useTopRatedData'; // Adjust path as needed

export function useUserBadges(userId) {
  const [userData, setUserData] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Fetch global data using useTopRatedData hook
  const { data: globalData, loading: globalLoading } = useTopRatedData();

  // Normalize userId to a string (or null if invalid)
  const strUserId = userId ? String(userId) : null;

  // Fetch user data from Firestore when userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      setFetching(true); // Start fetching
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
      setFetching(false); // Done fetching
    };

    fetchUserData();
  }, [strUserId]);

  // Compute user info with averages for consistency
  const userInfo = useMemo(() => {
    if (!userData) return null;
    const timesRanked = userData.timesRanked || 0;
    const averageRating = timesRanked > 0 ? (userData.ranking || 0) / timesRanked : 0;
    const featureAverages = {};
    const FEATURES = ["eyes", "smile", "facial", "hair", "body"]; // "facial" maps to jawline-related badges
    FEATURES.forEach((feature) => {
      const field = `${feature}Rating`;
      featureAverages[`${feature}Average`] = timesRanked > 0
        ? (userData[field] || 0) / timesRanked
        : 0;
    });
    return {
      averageRating,
      ...featureAverages,
      timesRanked,
      createdAt: userData.createdAt,
    };
  }, [userData]);

  // Compute thresholds for global badges (top 10% and top 1%)
  const thresholds = useMemo(() => {
    if (!globalData || globalData.length === 0) return {};

    const numUsers = globalData.length;
    const top10PercentIndex = Math.ceil(numUsers * 0.1) - 1; // Top 10% threshold
    const top1PercentIndex = Math.ceil(numUsers * 0.01) - 1; // Top 1% threshold

    const getThreshold = (feature) => {
      const sorted = [...globalData].sort((a, b) => b[feature] - a[feature]);
      return sorted[top10PercentIndex]?.[feature] || 0;
    };

    const overallThreshold = () => {
      const sorted = [...globalData].sort((a, b) => b.averageRating - a.averageRating);
      return sorted[top1PercentIndex]?.averageRating || 0;
    };

    return {
      eyes: getThreshold('eyesAverage'),
      smile: getThreshold('smileAverage'),
      facial: getThreshold('facialAverage'), // Matches "facialRating" field
      hair: getThreshold('hairAverage'),
      body: getThreshold('bodyAverage'),
      overall: overallThreshold(),
    };
  }, [globalData]);

  // Define badge criteria (local and global)
  const badgeDefinitions = [
    // **Local Badges (Based on User Data Alone)**
    {
      name: 'Captivating Eyes',
      emoji: '🧿',
      qualifies: (info) => info.eyesAverage > 2.5,
      description: 'Average eye rating above 2.5, highlighting standout eyes.',
    },
    {
      name: 'Dazzling Smile',
      emoji: '😁',
      qualifies: (info) => info.smileAverage > 2.5,
      description: 'Average smile rating above 2.5, recognizing a beaming smile.',
    },
    {
      name: 'Chiseled Jawline',
      emoji: '🗿',
      qualifies: (info) => info.facialAverage > 2.5,
      description: 'Average facial rating above 2.5, celebrating a strong jawline.',
    },
    {
      name: 'Luscious Locks',
      emoji: '💇',
      qualifies: (info) => info.hairAverage > 2.5,
      description: 'Average hair rating above 2.5, praising great hair.',
    },
    {
      name: 'Fit Physique',
      emoji: '💪',
      qualifies: (info) => info.bodyAverage > 2.5,
      description: 'Average body rating above 2.5, honoring a fit physique.',
    },
    {
      name: 'Top Tier',
      emoji: '🏆',
      qualifies: (info) => info.averageRating > 8.0,
      description: 'Average overall rating above 8.0, marking a highly rated user.',
    },
    {
      name: 'Elite',
      emoji: '👑',
      qualifies: (info) => info.averageRating > 9.0,
      description: 'Average rating above 9.0, the best of the best.',
    },
    {
      name: 'Popular',
      emoji: '🌟',
      qualifies: (info) => info.timesRanked > 100,
      description: 'Rated more than 100 times, showing popularity.',
    },
    {
      name: 'Celebrity',
      emoji: '🎉',
      qualifies: (info) => info.timesRanked > 500,
      description: 'Rated over 500 times, recognizing widespread fame.',
    },
    {
      name: 'Newbie',
      emoji: '🐣',
      qualifies: (info) => {
        if (!info.createdAt) return false;
        const createdAt = new Date(info.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 30;
      },
      description: 'For new users in their first month.',
    },
    {
      name: 'Veteran',
      emoji: '🕰️',
      qualifies: (info) => {
        if (!info.createdAt) return false;
        const createdAt = new Date(info.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 365;
      },
      description: 'For users over a year old, honoring loyalty.',
    },
    {
      name: 'Old Timer',
      emoji: '⏳',
      qualifies: (info) => {
        if (!info.createdAt) return false;
        const createdAt = new Date(info.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 730;
      },
      description: 'For users over two years, true long-term members.',
    },
    // **Global Badges (Requiring Rankings)**
    {
      name: 'Top Eyes',
      emoji: '👁️',
      qualifies: (info, thresholds) => info.eyesAverage > thresholds.eyes,
      description: 'Eye rating in the top 10% of all users platform-wide.',
    },
    {
      name: 'Smile Star',
      emoji: '😄',
      qualifies: (info, thresholds) => info.smileAverage > thresholds.smile,
      description: 'Smile rating in the top 10% compared to all users.',
    },
    {
      name: 'Jawline King/Queen',
      emoji: '👑',
      qualifies: (info, thresholds) => info.facialAverage > thresholds.facial,
      description: 'Facial rating in the top 10% globally.',
    },
    {
      name: 'Hair Icon',
      emoji: '💈',
      qualifies: (info, thresholds) => info.hairAverage > thresholds.hair,
      description: 'Hair rating in the top 10% across the platform.',
    },
    {
      name: 'Physique Phenom',
      emoji: '🏋️',
      qualifies: (info, thresholds) => info.bodyAverage > thresholds.body,
      description: 'Physique rating in the top 10% of all users.',
    },
    {
      name: 'Most Attractive',
      emoji: '💎',
      qualifies: (info, thresholds) => info.averageRating > thresholds.overall,
      description: 'Overall rating in the top 1%, the ultimate honor.',
    },
  ];

  // Compute earned badges using userInfo and thresholds
  const earnedBadges = useMemo(() => {
    if (!userInfo || !thresholds) return [];
    return badgeDefinitions.filter((badge) => badge.qualifies(userInfo, thresholds));
  }, [userInfo, thresholds]);

  // Combined loading state
  const loading = fetching || globalLoading;

  return { earnedBadges, loading };
}