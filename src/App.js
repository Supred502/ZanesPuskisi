import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Home/Hero";
import ProductsGrid from "./components/Home/ProductsGrid";
import InspirationsGrid from "./components/Home/InspirationsGrid";
import AdminPanel from "./components/Home/AdminPanel";
import ProductPage from "./components/Pages/ProductPage";
import InspirationPage from "./components/Pages/InspirationPage";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdminUser } from "./utils/isAdminUid";

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

  return (
    <div>
      <Navbar user={user} />
      <Hero />
      {isAdminUser(user) && <AdminPanel user={user} />}
      <ProductsGrid />
      <InspirationsGrid />
    </div>
  );
}

export default App;
