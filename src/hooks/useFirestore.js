// src/hooks/useFirestore.js
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useFirestore = (collectionName, queryConstraints = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const q = queryConstraints.length > 0 
        ? query(collectionRef, ...queryConstraints)
        : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(results);
          setLoading(false);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Firestore setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
};

// Specific hooks for common queries
export const useStudents = () => {
  return useFirestore('students');
};

export const useNotes = (course, semester) => {
  const constraints = course && semester 
    ? [where('course', '==', course), where('semester', '==', semester), orderBy('uploadedAt', 'desc')]
    : [];
  return useFirestore('notes', constraints);
};

export const useAnnouncements = (course, semester) => {
  const constraints = course && semester
    ? [
        where('targetCourses', 'array-contains', course),
        where('targetSemesters', 'array-contains', semester),
        orderBy('createdAt', 'desc')
      ]
    : [orderBy('createdAt', 'desc')];
  return useFirestore('announcements', constraints);
};