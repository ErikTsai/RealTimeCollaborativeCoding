// app/editor/[roomId]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react"; // Import Editor directly
import type * as monaco from "monaco-editor"; // Import monaco types

import UserPresence from "@/components/UserPresence";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Define User type
interface User {
  id: string;
  name: string;
}

// Define expected message structure
interface WebSocketMessage {
  type: string;
  payload: any;
  senderId?: string;
}

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080/ws";

// Debounce function
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export default function EditorPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const [username, setUsername] = useState<string | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  // useRef for the WebSocket instance
  const ws = useRef<WebSocket | null>(null);
  // useRef for the Monaco Editor instance
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  // Flag to ignore incoming messages that reflect our own changes
  const ignoreIncomingChange = useRef(false);

  // Load username and establish WebSocket connection
  useEffect(() => {
    const savedUsername = localStorage.getItem("editorUsername");
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      console.error("Username not found.");
      return;
    }

    if (!roomId || !savedUsername) return;

    const socketUrl = `${WEBSOCKET_URL}?roomId=${roomId}&username=${encodeURIComponent(
      savedUsername
    )}`;
    console.log(`Connecting to: ${socketUrl}`);
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      // Add self to participants list immediately for better UX
      setParticipants([{ id: savedUsername, name: savedUsername }]);
    };

    ws.current.onclose = (event) => {
      console.log(`WebSocket closed: ${event.code} ${event.reason}`);
      setIsConnected(false);
      setParticipants([]); // Clear participants
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data.toString());
        // console.log("Message received:", message);

        switch (message.type) {
          case "user_join":
            setParticipants((prev) =>
              prev.find((p) => p.id === message.payload.userId)
                ? prev
                : [
                    ...prev,
                    { id: message.payload.userId, name: message.payload.name },
                  ]
            );
            break;
          case "user_leave":
            setParticipants((prev) =>
              prev.filter((p) => p.id !== message.payload.userId)
            );
            break;
          case "initial_state":
            // Set initial content and participants list (add self if not included)
            const initialContent = message.payload.documentContent || "";
            const initialParticipants = message.payload.participants || [];
            if (
              editorRef.current &&
              editorRef.current.getValue() !== initialContent
            ) {
              // Use Monaco API to set content without triggering onChange
              editorRef.current.setValue(initialContent);
            }
            // Ensure self is in the list upon receiving initial state
            setParticipants((prev) => {
              const self = prev.find((p) => p.id === username); // Keep self if already added
              const others = initialParticipants.filter(
                (p: User) => p.id !== username
              );
              return self ? [...others, self] : others;
            });
            break;
          case "code_update":
            // IMPORTANT: Update editor content ONLY if change came from another user
            if (message.senderId !== username && editorRef.current) {
              const newContent = message.payload.content;
              // Check if the content actually differs to avoid unnecessary updates/cursor jumps
              if (editorRef.current.getValue() !== newContent) {
                console.log("Applying update from server");
                // Set flag to ignore the change event this update will trigger
                ignoreIncomingChange.current = true;
                // Use Monaco API to set content without triggering onChange loop
                editorRef.current.setValue(newContent);
              }
            }
            break;
          default:
            console.warn(`Unhandled message type: ${message.type}`);
        }
      } catch (e) {
        console.error("Failed to parse message:", event.data, e);
      }
    };

    // Cleanup
    return () => {
      console.log("Closing WebSocket");
      ws.current?.close();
      setIsConnected(false);
    };
  }, [roomId, username]); // Add username dependency

  // Function to send messages
  const sendMessage = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.error("WebSocket not connected.");
    }
  }, []);

  // Debounced function to send code updates
  const sendCodeUpdate = useCallback(
    debounce((content: string) => {
      console.log("Sending code update");
      sendMessage({ type: "code_update", payload: { content: content } });
    }, 500),
    [sendMessage]
  ); // Debounce sending updates (e.g., 500ms)

  // Monaco Editor Mount Handler
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    _monaco: typeof monaco
  ) => {
    editorRef.current = editor;
    console.log("Monaco Editor Mounted");
    // Optional: Add listeners for cursor changes here if needed
  };

  // Monaco Editor Change Handler
  const handleEditorChange = (
    value:
      | string
      | undefined /*, event: monaco.editor.IModelContentChangedEvent */
  ) => {
    // If ignoreIncomingChange flag is set, reset it and do nothing
    if (ignoreIncomingChange.current) {
      ignoreIncomingChange.current = false;
      // console.log("Ignoring incoming change event");
      return;
    }

    // Otherwise, this change was made by the local user, send the update (debounced)
    if (value !== undefined) {
      sendCodeUpdate(value);
    }
  };

  if (!username) {
    return (
      <div className="text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-4rem-56px)] gap-4 p-4">
      {" "}
      {/* Adjusted height */}
      {/* Participants Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            Room:{" "}
            <span className="font-mono bg-muted px-1 rounded">{roomId}</span>
          </h2>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <Separator className="mb-4" />
        <UserPresence users={participants} currentUsername={username} />
      </div>
      <Separator orientation="vertical" className="hidden md:block mx-2" />
      <Separator orientation="horizontal" className="block md:hidden my-2" />
      {/* Code Editor Area */}
      <div className="flex-grow h-full min-h-[400px] md:min-h-0">
        {/* Use standard Monaco Editor component */}
        <Editor
          height="100%" // Ensure editor fills container height
          language="javascript"
          theme="vs-dark"
          // Use defaultValue for initial load, updates handled via onmessage/setValue
          // Do NOT use 'value' prop directly if updates come via setValue, causes issues.
          // defaultValue={""} // Start empty, wait for initial_state
          onMount={handleEditorDidMount}
          onChange={handleEditorChange} // Send updates on change
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
