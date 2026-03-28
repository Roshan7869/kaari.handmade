import DummyPayment from "@/pages-legacy/DummyPayment";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DummyPaymentPage() {
  return (
    <ProtectedRoute>
      <DummyPayment />
    </ProtectedRoute>
  );
}
