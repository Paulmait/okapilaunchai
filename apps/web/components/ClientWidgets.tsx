"use client";

import dynamic from "next/dynamic";

// Dynamically import widgets to avoid hydration issues
const FeedbackWidget = dynamic(() => import("./FeedbackWidget"), {
  ssr: false
});

const NpsWidget = dynamic(() => import("./NpsWidget"), {
  ssr: false
});

export default function ClientWidgets() {
  return (
    <>
      <FeedbackWidget />
      <NpsWidget />
    </>
  );
}
