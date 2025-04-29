import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTopRatedData } from './useTopRatedData'; // Assuming it's in the same directory

export function useInfluencerBadges(influencerId) {
  // **State Management**
  const [influencerData, setInfluencerData] = useState(null);
  const [fetching, setFetching] = useState(true);

  // **Global Data**
  const { data: globalData, loading: globalLoading } = useTopRatedData();

  // **Normalize Influencer ID**
  const strInfluencerId = influencerId ? String(influencerId) : null;

  // **Fetch Influencer Data**
  useEffect(() => {
    const fetchInfluencerData = async () => {
      setFetching(true);
      if (strInfluencerId) {
        try {
          const influencerDocRef = doc(db, 'streamers', strInfluencerId);
          const influencerDocSnap = await getDoc(influencerDocRef);
          if (influencerDocSnap.exists()) {
            setInfluencerData({ id: strInfluencerId, ...influencerDocSnap.data() });
          } else {
            setInfluencerData(null);
          }
        } catch (error) {
          console.error('Error fetching influencer data:', error);
          setInfluencerData(null);
        }
      } else {
        setInfluencerData(null);
      }
      setFetching(false);
    };

    fetchInfluencerData();
  }, [strInfluencerId]);

  // **Compute Influencer Info**
  const influencerInfo = useMemo(() => {
    if (!influencerData) return null;
    const timesRanked = influencerData.timesRanked || 0;
    const averageRating = timesRanked > 0 ? (influencerData.ranking || 0) / timesRanked : 0;
    const featureAverages = {};
    const FEATURES = ["eyes", "smile", "jawline", "hair", "body"];
    FEATURES.forEach((feature) => {
      const field = `${feature}Rating`;
      featureAverages[`${feature}Average`] = timesRanked > 0
        ? (influencerData[field] || 0) / timesRanked
        : 0;
    });
    return {
      averageRating,
      ...featureAverages,
      timesRanked,
      createdAt: influencerData.createdAt,
    };
  }, [influencerData]);

  // **Compute Global Thresholds (Top and Bottom Percentiles)**
  const thresholds = useMemo(() => {
    if (!globalData || globalData.length === 0) return { top: {}, bottom: {} };

    const numUsers = globalData.length;
    const top10PercentIndex = Math.ceil(numUsers * 0.1) - 1; // Top 10%
    const top1PercentIndex = Math.ceil(numUsers * 0.01) - 1; // Top 1%
    const bottom5PercentIndex = Math.floor(numUsers * 0.05); // Bottom 5% (tightened from 10%)
    const bottom1PercentIndex = Math.floor(numUsers * 0.01); // Bottom 1%

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
        jawline: getThreshold('jawlineAverage', true),
        hair: getThreshold('hairAverage', true),
        body: getThreshold('bodyAverage', true),
        overall: overallThreshold(true),
      },
      bottom: {
        eyes: getThreshold('eyesAverage', false),
        smile: getThreshold('smileAverage', false),
        jawline: getThreshold('jawlineAverage', false),
        hair: getThreshold('hairAverage', false),
        body: getThreshold('bodyAverage', false),
        overall: overallThreshold(false),
      },
    };
  }, [globalData]);

  // **Badge Definitions (Positive and Negative Combined)**
  const badgeDefinitions = [
    // **Positive Badges**
    {
      name: 'Captivating Eyes',
      emoji: '🧿',
      qualifies: (info) => info.eyesAverage > 2.5,
      description: 'Awarded for an average eye rating above 2.5, highlighting standout eyes.',
    },
    {
      name: 'Dazzling Smile',
      emoji: '😁',
      qualifies: (info) => info.smileAverage > 2.5,
      description: 'Given for an average smile rating above 2.5, recognizing a beaming smile.',
    },
    {
      name: 'Chiseled Jawline',
      emoji: '🗿',
      qualifies: (info) => info.jawlineAverage > 2.5,
      description: 'For an average jawline rating above 2.5, celebrating a strong jawline.',
    },
    {
      name: 'Luscious Locks',
      emoji: '💇',
      qualifies: (info) => info.hairAverage > 2.5,
      description: 'Awarded for an average hair rating above 2.5, praising great hair.',
    },
    {
      name: 'Fit Physique',
      emoji: '💪',
      qualifies: (info) => info.bodyAverage > 2.5,
      description: 'Given for an average body rating above 2.5, honoring a fit physique.',
    },
    {
      name: 'Top Tier',
      emoji: '🏆',
      qualifies: (info) => info.averageRating > 8.0,
      description: 'For an average overall rating above 8.0, marking a highly rated user.',
    },
    {
      name: 'Elite',
      emoji: '👑',
      qualifies: (info) => info.averageRating > 9.0,
      description: 'For an exceptional average rating above 9.0, the best of the best.',
    },
    {
      name: 'Popular',
      emoji: '🌟',
      qualifies: (info) => info.timesRanked > 100,
      description: 'Awarded for being rated more than 100 times, showing popularity.',
    },
    {
      name: 'Celebrity',
      emoji: '🎉',
      qualifies: (info) => info.timesRanked > 500,
      description: 'For users rated over 500 times, recognizing widespread fame.',
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
      description: 'Awarded to new users in their first month, a warm welcome badge.',
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
      description: 'Given to users who joined over a year ago, honoring loyalty.',
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
      description: 'For users with over two years on the platform, true long-term members.',
    },
    {
      name: 'Top Eyes',
      emoji: '👁️',
      qualifies: (info, thresholds) => info.eyesAverage > thresholds.top.eyes,
      description: 'For an average eye rating in the top 10% of all users platform-wide.',
    },
    {
      name: 'Smile Star',
      emoji: '😄',
      qualifies: (info, thresholds) => info.smileAverage > thresholds.top.smile,
      description: 'Awarded for a smile rating in the top 10% compared to all users.',
    },
    {
      name: 'Jawline King/Queen',
      emoji: '👑',
      qualifies: (info, thresholds) => info.jawlineAverage > thresholds.top.jawline,
      description: 'For a jawline rating in the top 10% globally.',
    },
    {
      name: 'Hair Icon',
      emoji: '💈',
      qualifies: (info, thresholds) => info.hairAverage > thresholds.top.hair,
      description: 'Given for a hair rating in the top 10% across the platform.',
    },
    {
      name: 'Physique Phenom',
      emoji: '🏋️',
      qualifies: (info, thresholds) => info.bodyAverage > thresholds.top.body,
      description: 'For a physique rating in the top 10% of all users.',
    },
    {
      name: 'Most Attractive',
      emoji: '💎',
      qualifies: (info, thresholds) => info.averageRating > thresholds.top.overall,
      description: 'For an overall rating in the top 1%, the ultimate honor.',
    },

    // **Negative Badges (Made More Sparse)**
    {
      name: 'Eyesore',
      emoji: '👀',
      qualifies: (info) => info.eyesAverage < 1.0, // Tightened from < 1.5
      description: 'Awarded for an average eye rating below 1.0. Those eyes are a rare disaster!',
    },
    {
      name: 'Frown Town',
      emoji: '🙁',
      qualifies: (info) => info.smileAverage < 1.0, // Tightened from < 1.5
      description: 'Given for an average smile rating below 1.0. A rare frown worth forgetting.',
    },
    {
      name: 'Bad Hair Day',
      emoji: '💇‍♂️',
      qualifies: (info) => info.hairAverage < 1.0, // Tightened from < 1.5
      description: 'Awarded for an average hair rating below 1.0. A rare hair catastrophe!',
    },
    {
      name: 'Out of Shape',
      emoji: '🛋️',
      qualifies: (info) => info.bodyAverage < 1.0, // Tightened from < 1.5
      description: 'Given for an average body rating below 1.0. A rare couch potato champion!',
    },
    {
      name: 'Bottom Tier',
      emoji: '⬇️',
      qualifies: (info) => info.averageRating < 1.5, // Tightened from < 2.0
      description: 'For an average overall rating below 1.5. A rare bottom-dweller!',
    },
    {
      name: 'Bottom 5% Eyes',
      emoji: '👁️‍🗨️',
      qualifies: (info, thresholds) => info.eyesAverage <= thresholds.bottom.eyes, // Now bottom 5%
      description: 'For an eye rating in the bottom 5%. A rare eye sore!',
    },
    {
      name: 'Bottom 5% Smile',
      emoji: '😞',
      qualifies: (info, thresholds) => info.smileAverage <= thresholds.bottom.smile, // Now bottom 5%
      description: 'For a smile rating in the bottom 5%. A rare grimace!',
    },
    {
      name: 'Bottom 5% Hair',
      emoji: '💇‍♀️',
      qualifies: (info, thresholds) => info.hairAverage <= thresholds.bottom.hair, // Now bottom 5%
      description: 'For a hair rating in the bottom 5%. A rare mess!',
    },
    {
      name: 'Bottom 5% Body',
      emoji: '🏋️‍♂️',
      qualifies: (info, thresholds) => info.bodyAverage <= thresholds.bottom.body, // Now bottom 5%
      description: 'For a body rating in the bottom 5%. A rare physique flop!',
    },
    {
      name: 'Least Attractive',
      emoji: '💔',
      qualifies: (info, thresholds) => info.averageRating <= thresholds.bottom.overall, // Still bottom 1%
      description: 'For an overall rating in the bottom 1%. The rarest badge of shame!',
    },
    {
      name: 'Consistently Unimpressive',
      emoji: '😕',
      qualifies: (info) => info.timesRanked > 200 && info.averageRating < 2.0, // Tightened from > 100, < 3.0
      description: 'Rated over 200 times with an average below 2.0. A rare master of mediocrity!',
    },
    {
      name: 'Veteran of Mediocrity',
      emoji: '🕰️',
      qualifies: (info) => {
        if (!info.createdAt) return false;
        const createdAt = new Date(info.createdAt);
        const now = new Date();
        const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 730 && info.averageRating < 2.0; // Tightened from > 365, < 3.0
      },
      description: 'Over two years on the platform with an average below 2.0. A rare legacy of failure!',
    },
  ];

  // **Compute Earned Badges**
  const earnedBadges = useMemo(() => {
    if (!influencerInfo || !thresholds) return [];
    return badgeDefinitions.filter((badge) => badge.qualifies(influencerInfo, thresholds));
  }, [influencerInfo, thresholds]);

  // **Loading State**
  const loading = globalLoading || fetching;

  return { earnedBadges, loading };
}