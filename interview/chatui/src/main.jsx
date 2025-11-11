import React from "react";
import { createRoot } from "react-dom/client";
import { ChatKit, useChatKit } from "@openai/chatkit-react";

const WORKFLOW_ID = "wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22";

function App() {
  const { control } = useChatKit({
    workflowId: WORKFLOW_ID,
    version: "3",
    api: {
      async getClientSecret() {
        const res = await fetch("/interview/api/chatkit/session", { method: "POST" });
        if (!res.ok) throw new Error("Failed to fetch client_secret");
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <ChatKit control={control} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
