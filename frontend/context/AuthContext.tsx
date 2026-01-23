import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode"; // For decoding JWT
import getApiUrl from "@/helpers/getApiUrl"; // Helper to get API URL
import { JwtPayload } from "@/types/jwt-payload.interface";

// Create context
interface AuthContextType {
  token: string | null;
  user: any; // User data
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); // User data
  const [loading, setLoading] = useState(true);

  // Function to check if token is valid (exists and not expired)
  const isTokenValid = (tokenToCheck?: string): boolean => {
    const currentToken = tokenToCheck || token;

    if (!currentToken) {
      return false;
    }

    try {
      const decodedToken = jwtDecode<JwtPayload>(currentToken);
      const currentTime = Date.now() / 1000; // Convert to seconds

      // Check if token has expired
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        console.log("Token has expired");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  };

  // Function to clear expired token
  const clearExpiredToken = async () => {
    console.log("Clearing expired token");
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");

        if (savedToken) {
          // Check if token is valid before using it
          if (!isTokenValid(savedToken)) {
            console.log("Saved token is invalid or expired");
            await clearExpiredToken();
            setLoading(false);
            return;
          }

          setToken(savedToken);

          // Decode userId from token
          const decodedToken = jwtDecode<JwtPayload>(savedToken);
          const userId = decodedToken.userId;

          // Fetch user data using userId
          const response = await fetch(`${getApiUrl()}/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              // Token might be invalid on server side
              console.log("Token rejected by server");
              await clearExpiredToken();
              setLoading(false);
              return;
            }
            throw new Error("Failed to fetch user data");
          }

          const userData = await response.json();
          setUser(userData); // Set the fetched user data
        }
      } catch (error) {
        console.error("Failed to load token or user data", error);
        // Clear potentially corrupted token
        await clearExpiredToken();
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  // Set up token expiration check interval
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (!isTokenValid()) {
        console.log("Token expired, logging out");
        logout();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const login = async (newToken: string) => {
    try {
      // Validate token before storing
      if (!isTokenValid(newToken)) {
        throw new Error("Invalid or expired token");
      }

      setToken(newToken);
      await AsyncStorage.setItem("token", newToken);

      // Decode userId from token
      const decodedToken = jwtDecode<JwtPayload>(newToken);
      const userId = decodedToken.userId;

      // Fetch user data using userId
      const response = await fetch(`${getApiUrl()}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      setUser(userData); // Set the fetched user data
    } catch (error) {
      console.error("Failed to login", error);
      throw error; // Re-throw so calling component can handle
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        isTokenValid: () => isTokenValid(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
