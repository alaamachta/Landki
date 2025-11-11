import { Thread } from "@assistant-ui/react";
import { useEdgeRuntime } from "@assistant-ui/react";
import { useState } from "react";

const workflowId = import.meta.env.VITE_WORKFLOW_ID;
const workflowVersion = import.meta.env.VITE_WORKFLOW_VERSION || "2";

function App() {
  const [error, setError] = useState(null);

  // Configure the Edge Runtime for OpenAI ChatKit
  const runtime = useEdgeRuntime({
    api: "/api/chat",
    // Additional configuration can be added here
  });

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h1>Landki Interview</h1>
        </div>
        <div style={{ padding: "2rem", color: "#ef4444" }}>
          <p>Error: {error}</p>
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#a0a0a0" }}>
            Workflow ID: {workflowId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Landki Interview</h1>
      </div>
      <div className="chat-main">
        <Thread runtime={runtime} />
      </div>
    </div>
  );
}

export default App;
