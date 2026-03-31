"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminAuditoriaPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/admin/audiToria/tombo");
  }, [router]);
  return null;
}
