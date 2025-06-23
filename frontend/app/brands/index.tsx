import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Button,
  Pressable,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
// import { RootStackParamList } from "@/app/_layout";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";

const BrandsListScreen = () => {
  const [brands, setBrands] = useState<any[]>([]); // Adjusted the type to accept any kind of brand data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  //   const router = useRouter()
  const router = useRouter();

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/brands`);
        if (!response.ok) {
          throw new Error("Failed to fetch brands");
        }
        const data = await response.json();
        // console.log("Fetched brandss:", data[0].logo); // Debugging line to check fetched data
        setBrands(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const renderBrand = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.brandContainer}
      onPress={() => router.push(`/brands/${item.id}`)}
    >
      {/* <Text style={styles.brandName}>{}</Text> */}
      {item.logo ? (
        <Image style={styles.tinyLogo} source={{ uri: item.logo }} />
      ) : null}
      <Text style={styles.brandName}>{item.name}</Text>
      <Text style={styles.brandDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#346beb" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Brands List</Text>
      <Button
        title="Create New Brand"
        onPress={() => router.push("/brands/create")}
      />
      {/* <Pressable
        style={styles.button}
        onPress={() => router.push("CreateBrand")}
      >
        <Text style={styles.buttonText}>Create New Brand</Text>
      </Pressable> */}

      <FlatList
        data={brands}
        keyExtractor={(item) => item.id}
        renderItem={renderBrand}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  brandContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  brandName: { fontSize: 20 },
  brandDescription: { fontSize: 14, color: "#666" },
  errorText: { color: "red", fontSize: 16 },
  tinyLogo: {
    width: 50,
    height: 50,
  },
  // button: {},
  // buttonText: {},
});

export default BrandsListScreen;
