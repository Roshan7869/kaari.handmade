import Checkout from "@/pages-legacy/Checkout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  );
}
