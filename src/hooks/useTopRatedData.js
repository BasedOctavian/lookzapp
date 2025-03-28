import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Define the list of features to calculate averages for
const FEATURES = ["eyes", "smile", "jawline", "hair", "body"];

export function useTopRatedData() {
  // State for users and streamers data
  const [usersData, setUsersData] = useState([]);
  const [streamersData, setStreamersData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStreamers, setLoadingStreamers] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from Firestore
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = snapshot.docs.map((doc) => {
          const data = doc.data();
          const timesRanked = data.timesRanked || 0;
          const averageRating = timesRanked > 0 ? (data.ranking || 0) / timesRanked : 0;
          
          // Calculate averages for each feature
          const featureAverages = {};
          FEATURES.forEach((feature) => {
            const field = `${feature}Rating`;
            featureAverages[`${feature}Average`] = timesRanked > 0 
              ? (data[field] || 0) / timesRanked 
              : 0;
          });

          return {
            id: doc.id,
            displayName: data.displayName || "Unknown User",
            type: "user",
            averageRating,
            ...featureAverages,
            totalRatings: timesRanked,
          };
        });
        setUsersData(users);
        setLoadingUsers(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError(err.message);
        setLoadingUsers(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribeUsers();
  }, []);

  // Fetch streamers from Firestore
  useEffect(() => {
    const unsubscribeStreamers = onSnapshot(
      collection(db, "streamers"),
      (snapshot) => {
        const streamers = snapshot.docs.map((doc) => {
          const data = doc.data();
          const timesRanked = data.timesRanked || 0;
          const averageRating = timesRanked > 0 ? (data.ranking || 0) / timesRanked : 0;
          
          // Calculate averages for each feature
          const featureAverages = {};
          FEATURES.forEach((feature) => {
            const field = `${feature}Rating`;
            featureAverages[`${feature}Average`] = timesRanked > 0 
              ? (data[field] || 0) / timesRanked 
              : 0;
          });

          return {
            id: doc.id,
            displayName: data.name || "Unknown Influencer",
            type: "streamer",
            averageRating,
            ...featureAverages,
            totalRatings: timesRanked,
          };
        });
        setStreamersData(streamers);
        setLoadingStreamers(false);
      },
      (err) => {
        console.error("Error fetching streamers:", err);
        setError(err.message);
        setLoadingStreamers(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribeStreamers();
  }, []);

  // Combine users and streamers into a single list
  const combinedData = useMemo(() => {
    return [...usersData, ...streamersData];
  }, [usersData, streamersData]);

  // Combined loading state
  const loading = loadingUsers || loadingStreamers;

  return { data: combinedData, loading, error };
}