import { Suspense } from "react";
import OrdersPage from "../../../src/views/OrdersPage";

export default function Page() {
	return (
		<Suspense fallback={<div className="fd-card">Loading orders...</div>}>
			<OrdersPage />
		</Suspense>
	);
}
