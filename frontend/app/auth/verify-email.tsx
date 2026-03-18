// import React, { useEffect, useState } from "react";
// import { SafeAreaView } from "react-native-safe-area-context";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   ActivityIndicator,
//   Image,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import getApiUrl from "@/helpers/getApiUrl";
// import { useRouter, useLocalSearchParams } from "expo-router";

// type Status = "verifying" | "success" | "error";

// const VerifyEmailScreen = () => {
//   const router = useRouter();
//   const { token } = useLocalSearchParams<{ token: string }>();
//   const [status, setStatus] = useState<Status>("verifying");
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     if (!token) {
//       setStatus("error");
//       setMessage("No verification token found in the link.");
//       return;
//     }
//     verify();
//   }, [token]);

//   const verify = async () => {
//     setStatus("verifying");
//     try {
//       const res = await fetch(`${getApiUrl()}/auth/verify-email`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setStatus("success");
//         setMessage(data.message || "Your email has been verified!");
//       } else {
//         setStatus("error");
//         setMessage(data.message || "Verification failed.");
//       }
//     } catch {
//       setStatus("error");
//       setMessage("Something went wrong. Please try again.");
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <Image
//           source={require("@/assets/images/local-sooq.png")}
//           style={styles.logo}
//           resizeMode="contain"
//         />

//         {status === "verifying" && (
//           <>
//             <ActivityIndicator size="large" color="#346beb" style={styles.icon} />
//             <Text style={styles.title}>Verifying your email…</Text>
//           </>
//         )}

//         {status === "success" && (
//           <>
//             <View style={[styles.iconCircle, { backgroundColor: "#d1fae5" }]}>
//               <Ionicons name="checkmark-circle" size={48} color="#10b981" />
//             </View>
//             <Text style={styles.title}>Email Verified!</Text>
//             <Text style={styles.subtitle}>{message}</Text>
//             <Pressable
//               style={styles.button}
//               onPress={() => router.replace("/auth/login")}
//             >
//               <Text style={styles.buttonText}>Continue to Login</Text>
//             </Pressable>
//           </>
//         )}

//         {status === "error" && (
//           <>
//             <View style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]}>
//               <Ionicons name="close-circle" size={48} color="#ef4444" />
//             </View>
//             <Text style={styles.title}>Verification Failed</Text>
//             <Text style={styles.subtitle}>{message}</Text>
//             <Pressable style={styles.button} onPress={verify}>
//               <Text style={styles.buttonText}>Try Again</Text>
//             </Pressable>
//             <Pressable
//               style={styles.secondaryButton}
//               onPress={() => router.replace("/auth/login")}
//             >
//               <Text style={styles.secondaryButtonText}>Go to Login</Text>
//             </Pressable>
//           </>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#fff" },
//   container: {
//     flex: 1,
//     padding: 24,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   logo: { width: 140, height: 80, marginBottom: 32 },
//   iconCircle: {
//     width: 88,
//     height: 88,
//     borderRadius: 44,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   icon: { marginBottom: 20 },
//   title: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#1e293b",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 15,
//     color: "#64748b",
//     textAlign: "center",
//     marginBottom: 32,
//     lineHeight: 22,
//   },
//   button: {
//     backgroundColor: "#346beb",
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//     borderRadius: 12,
//     alignItems: "center",
//     width: "100%",
//     marginBottom: 12,
//   },
//   buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
//   secondaryButton: {
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//     borderRadius: 12,
//     alignItems: "center",
//     width: "100%",
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//   },
//   secondaryButtonText: { color: "#64748b", fontSize: 16, fontWeight: "600" },
// });

// export default VerifyEmailScreen;
