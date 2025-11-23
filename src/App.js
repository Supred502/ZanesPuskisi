import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Home/Hero";
import ProductsGrid from "./components/Home/ProductsGrid";
import InspirationsGrid from "./components/Home/InspirationsGrid";
import AdminPanel from "./components/Home/AdminPanel";
import ProductPage from "./components/Pages/ProductPage";
import InspirationPage from "./components/Pages/InspirationPage";
import CommentsAllPage from "./components/Pages/CommentPage";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
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
      <ProductsGrid />
      <InspirationsGrid />
    </div>
  );
}

export default App;
