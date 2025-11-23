import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Home/Hero.jsx";
import ProductsGrid from "./components/Home/ProductsGrid.jsx";
import InspirationsGrid from "./components/Home/InspirationsGrid.jsx";
import AdminPanel from "./components/Home/AdminPanel.jsx";
import ProductPage from "./components/Pages/ProductPage.jsx";
import InspirationPage from "./components/Pages/InspirationPage.jsx";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CommentsAllPage from "./components/Pages/CommentPage.jsx";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const path = window.location.pathname;

  if (path === "/produkti") {
    return (
      <div>
        <Navbar user={user} />
        <ProductPage />
      </div>
    );
  }

  if (path === "/iedvesma") {
    return (
      <div>
        <Navbar user={user} />
        <InspirationPage />
      </div>
    );
  }

  if (path === "/komentari" || path === "/comments") {
    return (
      <div>
        <Navbar user={user} />
        <CommentsAllPage />
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} />
      <Hero />
      <AdminPanel user={user} />
      <ProductsGrid maxRows={3} />
      <InspirationsGrid maxRows={3} />
    </div>
  );
}

export default App;
