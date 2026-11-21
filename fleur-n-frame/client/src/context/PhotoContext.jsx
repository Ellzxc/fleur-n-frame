import { createContext, useContext, useState, useCallback } from "react";

const PHOTO_COUNT = 4;

const PhotoContext = createContext(null);

export function PhotoProvider({ children }) {
  const [photos, setPhotos] = useState(Array(PHOTO_COUNT).fill(null));
  const [currentIndex, setCurrentIndex] = useState(0);

  const addPhoto = useCallback((dataUrl, index) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = dataUrl;
      return next;
    });
  }, []);

  const setPhotoAt = useCallback((index, dataUrl) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = dataUrl;
      return next;
    });
  }, []);

  const resetPhotos = useCallback(() => {
    setPhotos(Array(PHOTO_COUNT).fill(null));
    setCurrentIndex(0);
  }, []);

  const value = {
    photos,
    currentIndex,
    setCurrentIndex,
    addPhoto,
    setPhotoAt,
    resetPhotos,
    PHOTO_COUNT,
  };

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
}

export function usePhotos() {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error("usePhotos must be used within a PhotoProvider");
  return ctx;
}
