import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import getApiUrl from "@/helpers/getApiUrl";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/product";

export interface ImageSearchResult {
  searching: boolean;
  results: Product[];
  error: string | null;
  searchedImageUri: string | null;
  searchByImage: (uri: string) => Promise<Product[]>;
  pickFromGallery: () => Promise<Product[] | null>;
  takePhoto: () => Promise<Product[] | null>;
  clear: () => void;
}

export const useImageSearch = (): ImageSearchResult => {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchedImageUri, setSearchedImageUri] = useState<string | null>(null);
  const { token } = useAuth();

  const searchByImage = useCallback(
    async (uri: string): Promise<Product[]> => {
      setSearching(true);
      setError(null);
      setSearchedImageUri(uri);
      try {
        // Compress to 512px — CLIP resizes to 224 internally, so we don't need hi-res
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 512 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );

        const formData = new FormData();
        formData.append("image", {
          uri: compressed.uri,
          name: "search.jpg",
          type: "image/jpeg",
        } as any);

        const res = await fetch(`${getApiUrl()}/image-search?limit=20`, {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`);
        }

        const data = await res.json();
        const items: Product[] = data.items || [];
        setResults(items);
        return items;
      } catch (e: any) {
        const msg = e?.message || "Visual search failed";
        setError(msg);
        setResults([]);
        return [];
      } finally {
        setSearching(false);
      }
    },
    [token],
  );

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Gallery permission denied");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return searchByImage(result.assets[0].uri);
  }, [searchByImage]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission denied");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return searchByImage(result.assets[0].uri);
  }, [searchByImage]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchedImageUri(null);
  }, []);

  return {
    searching,
    results,
    error,
    searchedImageUri,
    searchByImage,
    pickFromGallery,
    takePhoto,
    clear,
  };
};
