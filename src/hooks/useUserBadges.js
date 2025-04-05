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

  // Compute thresholds for global badges (top and bottom percentiles)
  const thresholds = useMemo(() => {
    if (!globalData || globalData.length === 0) return { top: {}, bottom: {} };

    const numUsers = globalData.length;
    const top10PercentIndex = Math.ceil(numUsers * 0.1) - 1; // Top 10%
    const top1PercentIndex = Math.ceil(numUsers * 0.01) - 1; // Top 1%
    const bottom5PercentIndex = Math.floor(numUsers * 0.05); // Bottom 5% (tightened from 10%)
    const bottom1PercentIndex = Math.floor(numUsers * 0.01); // Bottom 1% (unchanged)

    const getThreshold = (feature, isTop) => {
      const sorted = [...globalData].sort((a, b) => isTop ? b[feature] - a[feature] : a[feature] - b[feature]);
      const index = isTop ? top10PercentIndex : bottom5PercentIndex;
      return sorted[index]?.[feature] || 0;
    };

    const overallThreshold = (isTop) => {
      const sorted = [...globalData].sort((a, b) => isTop ? b.averageRating - a.averageRating : a.averageRating - b.averageRating);
      const index = isTop ? top1PercentIndex : bottom1PercentIndex;
      return sorted[index]?.averageRating || 0;
    };

    return {
      top: {
        eyes: getThreshold('eyesAverage', true),
        smile: getThreshold('smileAverage', true),
        facial: getThreshold('facialAverage', true),
        hair: getThreshold('hairAverage', true),
        body: getThreshold('bodyAverage', true),
        overall: overallThreshold(true),
      },
      bottom: {
        eyes: getThreshold('eyesAverage', false),
        smile: getThreshold('smileAverage', false),
        facial: getThreshold('facialAverage', false),
        hair: getThreshold('hairAverage', false),
        body: getThreshold('bodyAverage', false),
        overall: overallThreshold(false),
      },
    };
  }, [globalData]);

  // Define badge criteria (positive and negative)
  const badgeDefinitions = [
    // **Positive Badges**
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
    {
      name: 'Top Eyes',
      emoji: '👁️',
      qualifies: (info, thresholds) => info.eyesAverage > thresholds.top.eyes,
      description: 'Eye rating in the top 10% of all users platform-wide.',
    },
    {
      name: 'Smile Star',
      emoji: '😄',
      qualifies: (info, thresholds) => info.smileAverage > thresholds.top.smile,
      description: 'Smile rating in the top 10% compared to all users.',
    },
    {
      name: 'Jawline King/Queen',
      emoji: '👑',
      qualifies: (info, thresholds) => info.facialAverage > thresholds.top.facial,
      description: 'Facial rating in the top 10% globally.',
    },
    {
      name: 'Hair Icon',
      emoji: '💈',
      qualifies: (info, thresholds) => info.hairAverage > thresholds.top.hair,
      description: 'Hair rating in the top 10% across the platform.',
    },
    {
      name: 'Physique Phenom',
      emoji: '🏋️',
      qualifies: (info, thresholds) => info.bodyAverage > thresholds.top.body,
      description: 'Physique rating in the top 10% of all users.',
    },
    {
      name: 'Most Attractive',
      emoji: '💎',
      qualifies: (info, thresholds) => info.averageRating > thresholds.top.overall,
      description: 'Overall rating in the top 1%, the ultimate honor.',
    },
    // **Negative Badges (Made More Sparse)**
    {
      name: 'Eyesore',
      emoji: '👀',
      qualifies: (info) => info.eyesAverage < 1.0, // Tightened from < 1.5
      description: 'Awarded for an average eye rating below 1.0. Those eyes are a disaster!',
    },
    {
      name: 'Frown Town',
      emoji: '🙁',
      qualifies: (info) => info.smileAverage < 1.0, // Tightened from < 1.5
      description: 'Given for an average smile rating below 1.0. Your frown is legendary.',
    },
    {
      name: 'Weak Jawline',
      emoji: '😐',
      qualifies: (info) => info.facialAverage < 1.0, // Tightened from < 1.5
      description: 'For an average facial rating below 1.0. Your jawline’s practically invisible!',
    },
    {
      name: 'Bad Hair Day',
      emoji: '💇‍♂️',
      qualifies: (info) => info.hairAverage < 1.0, // Tightened from < 1.5
      description: 'Awarded for an average hair rating below 1.0. A total hair catastrophe!',
    },
    {
      name: 'Out of Shape',
      emoji: '🛋️',
      qualifies: (info) => info.bodyAverage < 1.0, // Tightened from < 1.5
      description: 'Given for an average body rating below 1.0. Couch potato status achieved.',
    },
    {
      name: 'Bottom Tier',
      emoji: '⬇️',
      qualifies: (info) => info.averageRating < 1.5, // Tightened from < 2.0
      description: 'For an average overall rating below 1.5. You’re the bottom of the bottom.',
    },
    {
      name: 'Bottom 5% Eyes',
      emoji: '👁️‍🗨️',
      qualifies: (info, thresholds) => info.eyesAverage <= thresholds.bottom.eyes, // Now bottom 5%
      description: 'For an eye rating in the bottom 5%. A rare level of eye repulsion.',
    },
    {
      name: 'Bottom 5% Smile',
      emoji: '😞',
      qualifies: (info, thresholds) => info.smileAverage <= thresholds.bottom.smile, // Now bottom 5%
      description: 'For a smile rating in the bottom 5%. Your smile’s a rare disaster.',
    },
    {
      name: 'Bottom 5% Facial',
      emoji: '😑',
      qualifies: (info, thresholds) => info.facialAverage <= thresholds.bottom.facial, // Now bottom 5%
      description: 'For a facial rating in the bottom 5%. Your face is uniquely forgettable.',
    },
    {
      name: 'Bottom 5% Hair',
      emoji: '💇‍♀️',
      qualifies: (info, thresholds) => info.hairAverage <= thresholds.bottom.hair, // Now bottom 5%
      description: 'For a hair rating in the bottom 5%. Hair so bad it’s rare.',
    },
    {
      name: 'Bottom 5% Body',
      emoji: '🏋️‍♂️',
      qualifies: (info, thresholds) => info.bodyAverage <= thresholds.bottom.body, // Now bottom 5%
      description: 'For a body rating in the bottom 5%. A rare physique flop.',
    },
    {
      name: 'Least Attractive',
      emoji: '💔',
      qualifies: (info, thresholds) => info.averageRating <= thresholds.bottom.overall, // Still bottom 1%
      description: 'For an overall rating in the bottom 1%. The rarest badge of shame.',
    },
    {
      name: 'Consistently Unimpressive',
      emoji: '😕',
      qualifies: (info) => info.timesRanked > 200 && info.averageRating < 2.0, // Tightened from > 100, < 3.0
      description: 'Rated over 200 times with an average below 2.0. A rare talent for mediocrity!',
    },
    {
      name: 'Veteran of Mediocrity',
      emoji: '🕰️',
      qualifies: (info) => {
        if (!info.createdAt) return false;
        const createdAt = new Date(info.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 730 && info.averageRating < 2.0; // Tightened to > 2 years, < 2.0
      },
      description: 'Over two years on the platform with an average below 2.0. A rare legacy of failure!',
    },
  ];

  // Compute earned badges using userInfo and thresholds
 // Compute earned badges using userInfo and thresholds
const earnedBadges = useMemo(() => {
  if (!userInfo || !thresholds || userInfo.timesRanked <= 3) return [];
  return badgeDefinitions.filter((badge) => badge.qualifies(userInfo, thresholds));
}, [userInfo, thresholds]);


  // Combined loading state
  const loading = fetching || globalLoading;

  return { earnedBadges, loading };
}