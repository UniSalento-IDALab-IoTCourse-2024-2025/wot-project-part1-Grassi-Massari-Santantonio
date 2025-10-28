import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  ip: string | null;
  isLoading: boolean;
  signIn: (ip: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [ip, setIp] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedIp = await AsyncStorage.getItem('ip');
      setIp(storedIp);
      setLoading(false);
    })();
  }, []);

  const signIn = async (newIp: string) => {
    setLoading(true);
    await AsyncStorage.setItem('ip', newIp.trim());
    setIp(newIp.trim());
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await AsyncStorage.removeItem('ip');
    setIp(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ ip, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
};