import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

// Create context
interface AuthContextType {
  token: string | null;
  user: any; // We will store decoded token here if necessary
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        const decodedUser = jwtDecode(savedToken); // Decode JWT token
        setUser(decodedUser);
      }
    };

    loadToken();
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    const decodedUser = jwtDecode(newToken); // Decoding token if needed
    setUser(decodedUser);
    AsyncStorage.setItem("token", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    AsyncStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
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
