import { createContext, useContext, useState, useEffect } from "react";
 
const AuthContext = createContext();
 

const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    
    return {
      ...payload, 
      userId: payload.userId,
      username: payload.username,
      role: payload.roles ? payload.roles.toLowerCase() : null, 
      email: payload.sub 
    };
  } catch (e) {
    console.error("Error decoding JWT:", e);
    return null;
  }
};
 
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
 
const DASHBOARD_ROUTES = {
  admin: "/admin",
  traveler: "/traveler",
  hotel_manager: "/hotel-manager",
  travel_agent: "/travel-agent",
};
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const savedTokenLS = localStorage.getItem("travora_auth_token");
    const savedUserLS = localStorage.getItem("travora_user_data");
 
    const savedTokenSS = sessionStorage.getItem("travora_auth_token");
    const savedUserSS = sessionStorage.getItem("travora_user_data");
 
    let loadedToken = null;
    let loadedUser = null;
 
    
    if (savedTokenLS && savedUserLS) {
      loadedToken = savedTokenLS;
      loadedUser = JSON.parse(savedUserLS);
    } else if (savedTokenSS && savedUserSS) {
      
      loadedToken = savedTokenSS;
      loadedUser = JSON.parse(savedUserSS);
    }
 
    if (loadedToken && loadedUser) {
      const decodedToken = decodeJwt(loadedToken);
 
      if (decodedToken) {
        
        
        setUser({
          ...loadedUser, 
          userId: loadedUser.userId || decodedToken.userId,
          username: loadedUser.username || decodedToken.username,
          contactNumber: loadedUser.contactNumber || decodedToken.contactNumber,
          role: loadedUser.role || (decodedToken.roles ? decodedToken.roles.toLowerCase() : null),
          email: loadedUser.email || decodedToken.sub,
        });
        setToken(loadedToken);
        setIsAuthenticated(true);
      } else {
        
        console.error("Stored token is invalid. Clearing authentication data.");
        logout(); 
      }
    }
    setLoading(false);
  }, []); 
 
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    console.log(JSON.stringify({ email, password }));
    try {
      const response = await fetch("http://localhost:8060/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log("Login API Response (raw):", response);
      const result = await response.json();
      console.log("Login API Result (parsed):", result);
 
      if (response.status === 200) {
        const receivedToken = result.data.token;
        const receivedEmail = result.data.email;
        const receivedRole = result.data.role; 
 
        
        const decodedToken = decodeJwt(receivedToken);
 
        if (!decodedToken) {
          throw new Error("Failed to decode JWT token.");
        }
 
        
        const userData = {
          userId: decodedToken.userId,
          email: receivedEmail, 
          role: receivedRole.toLowerCase(), 
          token: receivedToken, 
          username: decodedToken.username,
          contactNumber: decodedToken.contactNumber,
        };
 
        setToken(receivedToken);
        setUser(userData);
        setIsAuthenticated(true);
 
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("travora_auth_token", receivedToken);
        storage.setItem("travora_user_data", JSON.stringify(userData));
 
        if (rememberMe) {
          sessionStorage.removeItem('travora_auth_token');
          sessionStorage.removeItem('travora_user_data');
        } else {
          localStorage.removeItem('travora_auth_token');
          localStorage.removeItem('travora_user_data');
        }
 
        console.log("Logged in User Data (stored):", JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        throw new Error(result.data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };
 
  const signup = async ({ name, email, password, role, contactNumber }) => {
    const payload = {
      name: name?.trim(),
      email: email?.trim(),
      password,
      role: role?.trim().toUpperCase(),
      contactNumber: contactNumber?.trim(),
    };
    setLoading(true);
    try {
      console.log(
        JSON.stringify({ name, email, password, role, contactNumber })
      );
      const response = await fetch("http://localhost:8060/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
 
      const result = await response.json();
      console.log(result);
      if (response.status === 201) {
        return { success: true, message: result.data.message };
      } else {
        throw new Error(result.data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };
 
  const logout = async () => {
    try {
      const tokenToSend = localStorage.getItem('travora_auth_token') || sessionStorage.getItem('travora_auth_token');
      if (tokenToSend) {
        await fetch('http://localhost:8060/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenToSend}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('travora_auth_token');
      localStorage.removeItem('travora_user_data');
      sessionStorage.removeItem('travora_auth_token');
      sessionStorage.removeItem('travora_user_data');
    }
  };
 
  const navigateToDashboard = () => {
    if (user && user.role) {
      return DASHBOARD_ROUTES[user.role] || "/traveler";
    }
    return "/";
  };
 
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    navigateToDashboard,
  };
 
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};