import { Suspense } from "react";
import { AdminApp } from "@/components/admin/AdminApp";

export default function AdminPage() {
  return (
    <Suspense>
      <AdminApp />
    </Suspense>
  );
}
