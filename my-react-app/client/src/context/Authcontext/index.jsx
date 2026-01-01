import React, { useEffect , useContext, useState } from 'react'; 
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Authcontext = React.createContext();

export function useAuth() {
  return React.useContext(Authcontext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = React.useState(null);   
  const [loggedIn, setLoggedIn] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(false);
        setLoggedIn(true);
      } else {
        setCurrentUser(null);
        setLoading(false);
        setLoggedIn(false);
      }
    });
    return () => unsubscribe();;
  }, []);

  const value = {
    currentUser,
    loggedIn,
    loading
  };

  return (
    <Authcontext.Provider value={value}>
      {!loading && children}
    </Authcontext.Provider>
  );

}