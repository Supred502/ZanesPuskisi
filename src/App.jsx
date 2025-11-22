import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import ProductsGrid from "./components/ProductsGrid.jsx";
import InspirationsGrid from "./components/InspirationsGrid.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CommentsAllPage from "./components/CommentsAllPage.jsx";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    // Simple path-based rendering to support a standalone comments page at /comments
    window.location.pathname === "/comments" ? (
      <CommentsAllPage />
    ) : (
      <div>
        <Navbar user={user} />
        <Hero />
        <AdminPanel user={user} />
        <ProductsGrid />
        <InspirationsGrid />
      </div>
    )
  );
}

export default App;
