import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTopRatedData } from './useTopRatedData'; // Assuming it's in the same directory

export function useInfluencerBadges(influencerId) {
  // State for specific influencer data and fetching status
  const [influencerData, setInfluencerData] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Get global data from useTopRatedData hook
  const { data: globalData, loading: globalLoading } = useTopRatedData();

  // Normalize influencerId to a string (or null if invalid)
  const strInfluencerId = influencerId ? String(influencerId) : null;

  // Fetch influencer data from the 'streamers' collection when influencerId changes
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
      setFetching(false);
    };

    fetchInfluencerData();
  }, [strInfluencerId]);

  // Compute influencer info (averages and other necessary fields)
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

  // Compute thresholds for global badges (top 10% and top 1%)
  const thresholds = useMemo(() => {
    if (!globalData || globalData.length === 0) return {};

    const numUsers = globalData.length;
    const top10PercentIndex = Math.ceil(numUsers * 0.1); // Index for top 10%
    const top1PercentIndex = Math.ceil(numUsers * 0.01); // Index for top 1%

    const getThreshold = (feature) => {
      const sorted = [...globalData].sort((a, b) => b[feature] - a[feature]);
      return sorted[top10PercentIndex - 1]?.[feature] || 0;
    };

    const overallThreshold = () => {
      const sorted = [...globalData].sort((a, b) => b.averageRating - a.averageRating);
      return sorted[top1PercentIndex - 1]?.averageRating || 0;
    };

    return {
      eyes: getThreshold('eyesAverage'),
      smile: getThreshold('smileAverage'),
      jawline: getThreshold('jawlineAverage'),
      hair: getThreshold('hairAverage'),
      body: getThreshold('bodyAverage'),
      overall: overallThreshold(),
    };
  }, [globalData]);

  // Define all badge definitions (local and global)
  const badgeDefinitions = [
    // **Badges Calculable from User Document Alone**
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
    // **Badges Requiring Global Rankings**
    {
      name: 'Top Eyes',
      emoji: '👁️',
      qualifies: (info, thresholds) => info.eyesAverage > thresholds.eyes,
      description: 'For an average eye rating in the top 10% of all users platform-wide.',
    },
    {
      name: 'Smile Star',
      emoji: '😄',
      qualifies: (info, thresholds) => info.smileAverage > thresholds.smile,
      description: 'Awarded for a smile rating in the top 10% compared to all users.',
    },
    {
      name: 'Jawline King/Queen',
      emoji: '👑',
      qualifies: (info, thresholds) => info.jawlineAverage > thresholds.jawline,
      description: 'For a jawline rating in the top 10% globally.',
    },
    {
      name: 'Hair Icon',
      emoji: '💈',
      qualifies: (info, thresholds) => info.hairAverage > thresholds.hair,
      description: 'Given for a hair rating in the top 10% across the platform.',
    },
    {
      name: 'Physique Phenom',
      emoji: '🏋️',
      qualifies: (info, thresholds) => info.bodyAverage > thresholds.body,
      description: 'For a physique rating in the top 10% of all users.',
    },
    {
      name: 'Most Attractive',
      emoji: '💎',
      qualifies: (info, thresholds) => info.averageRating > thresholds.overall,
      description: 'For an overall rating in the top 1%, the ultimate honor.',
    },
  ];

  // Compute earned badges based on influencer info and global thresholds
  const earnedBadges = useMemo(() => {
    if (!influencerInfo || !thresholds) return [];
    return badgeDefinitions.filter((badge) => badge.qualifies(influencerInfo, thresholds));
  }, [influencerInfo, thresholds]);

  // Overall loading state: true if either global data or influencer data is still loading
  const loading = globalLoading || fetching;

  return { earnedBadges, loading };
}