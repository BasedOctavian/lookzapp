// useEntities.js
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '@chakra-ui/toast';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function useEntities(category, genderFilter) {
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadEntities = async () => {
      setIsLoading(true);
      try {
        let fetchedEntities = [];
        if (category === 'all') {
          const streamersQuery = query(collection(db, 'streamers'));
          const streamersSnapshot = await getDocs(streamersQuery);
          const streamers = streamersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'streamer',
            name: doc.data().name,
            photo_url: doc.data().photo_url,
            ...doc.data(),
          }));
          fetchedEntities = [...fetchedEntities, ...streamers];

          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          const users = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'user',
            name: doc.data().displayName || 'Unknown User',
            photo_url: doc.data().profilePicture || 'default_image_url',
            ...doc.data(),
          }));
          fetchedEntities = [...fetchedEntities, ...users];
        } else if (category === 'other-users') {
          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          const users = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'user',
            name: doc.data().displayName || 'Unknown User',
            photo_url: doc.data().profilePicture || 'default_image_url',
            ...doc.data(),
          }));
          fetchedEntities = [...fetchedEntities, ...users];
        } else {
          const streamersQuery = query(collection(db, 'streamers'), where('category', '==', category));
          const streamersSnapshot = await getDocs(streamersQuery);
          const streamers = streamersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'streamer',
            name: doc.data().name,
            photo_url: doc.data().photo_url,
            ...doc.data(),
          }));
          fetchedEntities = [...fetchedEntities, ...streamers];
        }
        const shuffled = shuffleArray(fetchedEntities);
        setEntities(shuffled);
      } catch (error) {
        console.error('Error fetching entities:', error);
        toast({
          title: 'Fetch Error',
          description: 'Failed to load entities.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setEntities([]);
      }
      setIsLoading(false);
    };
    loadEntities();
  }, [category, toast]);

  const filteredEntities = genderFilter === 'both'
    ? entities
    : entities.filter((entity) => entity.gender === genderFilter);

  return { entities: filteredEntities, isLoading };
}