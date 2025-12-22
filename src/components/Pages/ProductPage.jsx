import React from "react";
import ProductsGrid from "../Home/ProductsGrid.jsx";

export default function ProductPage({ user }) {
	return (
		<main>
			<ProductsGrid user={user} />
		</main>
	);
}
