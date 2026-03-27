import OrderConfirmation from "@/pages/OrderConfirmation";
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function OrderConfirmationPage() {
  return (
    <ProtectedRoute>
      <OrderConfirmation />
    </ProtectedRoute>
  );
}
