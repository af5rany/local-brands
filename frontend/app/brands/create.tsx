import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import getApiUrl from "@/helpers/getApiUrl";
// import { NavigationProp, useNavigation } from "@react-navigation/native";
// import { RootStackParamList } from "@/app/_layout";
import { useRouter } from "expo-router";

type User = {
  id: string;
  name?: string;
  email?: string;
};

const CreateBrandScreen = () => {
  //   const router = useRouter()
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/users`);
      const data = await response.json();
      const formattedUsers = data.map((user: User) => ({
        label: user.name || user.email,
        value: user.id,
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to fetch users.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImagePick = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadToCloudinary(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split("/").pop();
    formData.append("file", {
      uri,
      name: filename,
      type: "image/jpeg",
    } as any);
    formData.append("upload_preset", "UnsignedPreset");
    formData.append("cloud_name", "dg4l2eelg");

    try {
      setLoading(true);
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dg4l2eelg/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (response.ok) {
        setLogoUrl(data.secure_url);
      } else {
        throw new Error(data?.message || "Image upload failed.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "An error occurred while uploading the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async () => {
    Keyboard.dismiss();

    if (!name || !description || !logoUrl || !owner || !location) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const newBrand = {
        name,
        description,
        logo: logoUrl,
        owner,
        location,
      };

      const response = await fetch(`${getApiUrl()}/brands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBrand),
      });

      const data = await response.json();

      if (response.status === 201) {
        router.replace("/brands");
        // console.log("Brand created successfully:", data);
      } else {
        throw new Error(data.message || "Failed to create brand");
      }
    } catch (err: any) {
      console.error("Error creating brand:", err);
      Alert.alert(
        "Error",
        err.message || "An error occurred while creating the brand."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create a New Brand</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Brand Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#A0A0A0"
        />

        <TextInput
          style={styles.input}
          placeholder="Brand Description"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#A0A0A0"
        />

        <TextInput
          style={styles.input}
          placeholder="Brand Location"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor="#A0A0A0"
        />

        <Dropdown
          labelField="label"
          valueField="value"
          data={users}
          value={owner}
          onChange={(item) => setOwner(item.value)}
          placeholder="Select Owner"
          searchPlaceholder="Search users..."
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
        />

        <Pressable style={styles.input} onPress={handleImagePick}>
          <Text style={{ color: "#346beb", textAlign: "center" }}>
            Select Logo Image
          </Text>
        </Pressable>

        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logoImage} />
        ) : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateBrand}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Brand</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 8,
    alignSelf: "center",
  },
  dropdown: {
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 16,
    backgroundColor: "white", // Ensure the dropdown has a proper background color
  },
  button: {
    backgroundColor: "#346beb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#bbb",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  placeholderStyle: {
    color: "#A0A0A0",
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});

export default CreateBrandScreen;
