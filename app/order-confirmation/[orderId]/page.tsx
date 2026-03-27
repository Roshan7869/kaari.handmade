import OrderConfirmation from "@/pages-legacy/OrderConfirmation";
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function OrderConfirmationPage() {
  return (
    <ProtectedRoute>
      <OrderConfirmation />
    </ProtectedRoute>
  );
}
