import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function useAdminInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all influencers from Firestore on mount
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, 'streamers'));
        const influencersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Remove undereyes property if it exists
          if (data.undereyes !== undefined) {
            delete data.undereyes;
          }
          return {
            id: doc.id,
            ...data,
          };
        });
        setInfluencers(influencersData);
      } catch (err) {
        setError('Error fetching influencers: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfluencers();
  }, []);

  // Update a specific influencer's field(s) in Firestore
  const updateInfluencer = async (id, updates) => {
    try {
      // Remove undereyes property if it exists in updates
      if (updates.undereyes !== undefined) {
        delete updates.undereyes;
      }
      
      const db = getFirestore();
      const docRef = doc(db, 'streamers', id);
      await updateDoc(docRef, updates);
      // Update local state to reflect changes immediately
      setInfluencers((prev) =>
        prev.map((inf) => (inf.id === id ? { ...inf, ...updates } : inf))
      );
    } catch (err) {
      setError('Error updating influencer: ' + err.message);
      throw err;
    }
  };

  // Upload a photo to Firebase Storage and update the photo_url in Firestore
  const uploadPhoto = async (id, file) => {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `streamers/${id}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateInfluencer(id, { photo_url: photoURL });
    } catch (err) {
      setError('Error uploading photo: ' + err.message);
      throw err;
    }
  };

  return { influencers, loading, error, updateInfluencer, uploadPhoto };
}

export default useAdminInfluencers;