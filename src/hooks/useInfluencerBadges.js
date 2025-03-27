import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useInfluencerBadges(influencerId) {
  const [influencerData, setInfluencerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize influencerId to a string (or null if invalid)
  const strInfluencerId = influencerId ? String(influencerId) : null;

  // Fetch influencer data from the 'streamers' collection when influencerId changes
  useEffect(() => {
    const fetchInfluencerData = async () => {
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
      setLoading(false);
    };

    fetchInfluencerData();
  }, [strInfluencerId]);

  // Define badge criteria for influencers
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

  // Compute earned badges based on influencer data
  const earnedBadges = useMemo(() => {
    if (!influencerData) return [];
    return badgeDefinitions.filter((badge) => badge.qualifies(influencerData));
  }, [influencerData]);

  return { earnedBadges, loading };
}