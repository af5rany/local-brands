import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";


const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dg4l2eelg/image/upload";
const UPLOAD_PRESET = "UnsignedPreset";

export interface UploadState {
  uri: string;
  progress: number;
  status: "idle" | "compressing" | "uploading" | "success" | "error";
  cloudUrl?: string;
  error?: string;
}

export const useCloudinaryUpload = () => {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});

  const uploadImage = useCallback(
    async (uri: string): Promise<string | null> => {
      // 1. Initial State
      setUploads((prev) => ({
        ...prev,
        [uri]: { uri, progress: 0, status: "compressing" },
      }));

      try {
        // 2. Compress Image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }], // Resize to a maximum width of 1200px
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );

        setUploads((prev) => ({
          ...prev,
          [uri]: { ...prev[uri], status: "uploading" },
        }));

        // 3. Prepare Form Data
        const formData = new FormData();
        const filename = manipulatedImage.uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("file", {
          uri: manipulatedImage.uri,
          name: filename,
          type: type,
        } as any);
        formData.append("upload_preset", UPLOAD_PRESET);

        // 4. Upload with Progress (using XMLHttpRequest for progress tracking)
        const cloudUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", CLOUDINARY_URL);

          xhr.upload.onprogress = (event) => {
            const progress = event.lengthComputable
              ? Math.round((event.loaded * 100) / event.total)
              : 0;
            setUploads((prev) => ({
              ...prev,
              [uri]: { ...prev[uri], progress },
            }));
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              if (data?.secure_url) {
                resolve(data.secure_url);
              } else {
                reject(new Error("Invalid response from Cloudinary"));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(formData);
        });

        setUploads((prev) => ({
          ...prev,
          [uri]: { ...prev[uri], status: "success", cloudUrl, progress: 100 },
        }));
        return cloudUrl;
      } catch (error: any) {
        console.error("Cloudinary upload error:", error);
        setUploads((prev) => ({
          ...prev,
          [uri]: {
            ...prev[uri],
            status: "error",
            error: error.message || "Upload failed",
          },
        }));
        return null;
      }
    },
    [],
  );

  const pickAndUpload = useCallback(
    async (options: ImagePicker.ImagePickerOptions = {}) => {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error("Permission to access camera roll is required!");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
        ...options,
      });

      if (result.canceled || !result.assets) {
        return null;
      }

      const uris = result.assets.map((asset) => asset.uri);
      const uploadPromises = uris.map((uri) => uploadImage(uri));

      return Promise.all(uploadPromises);
    },
    [uploadImage],
  );

  const clearUpload = useCallback((uri: string) => {
    setUploads((prev) => {
      const newUploads = { ...prev };
      delete newUploads[uri];
      return newUploads;
    });
  }, []);

  return {
    uploads,
    uploadImage,
    pickAndUpload,
    clearUpload,
    isUploading: Object.values(uploads).some(
      (u) => u.status === "uploading" || u.status === "compressing",
    ),
  };
};
