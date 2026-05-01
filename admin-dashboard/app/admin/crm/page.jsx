import { Suspense } from "react";
import CrmPage from "../../../src/views/CrmPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="fd-card">Loading CRM...</div>}>
      <CrmPage />
    </Suspense>
  );
}
