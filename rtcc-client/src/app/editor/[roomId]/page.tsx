"use client"; // Required for localStorage, useState, useEffect

import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // Hook to get dynamic route params

import CodeEditor from "@/components/CodeEditor";
import UserPresence from "@/components/UserPresence";
import { Separator } from "@/components/ui/separator"; // For visual separation

// Define User type again or import from a shared types file
interface User {
  id: string;
  name: string;
}

export default function EditorPage() {
  const params = useParams<{ roomId: string }>(); // Get typed params
  const roomId = params.roomId;
  const [username, setUsername] = useState<string | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);

  useEffect(() => {
    // Retrieve username when component mounts
    const savedUsername = localStorage.getItem("editorUsername");
    setUsername(savedUsername);

    // --- Placeholder for Real-time Logic ---
    // In a real app, you would:
    // 1. Establish a WebSocket connection here using the `roomId`.
    // 2. Send a 'join' message with the username.
    // 3. Receive initial document state and participant list.
    // 4. Listen for incoming OT operations and participant updates.
    // 5. Update the CodeEditor content and participants state accordingly.

    // For now, just add the current user to the list
    if (savedUsername) {
      setParticipants([{ id: "currentUser", name: savedUsername }]); // Use a placeholder ID
    }
    // --- End Placeholder ---

    // Cleanup connection on component unmount (important!)
    return () => {
      console.log(`Leaving room ${roomId}`);
      // Disconnect WebSocket, remove listeners etc.
    };
  }, [roomId]); // Re-run if roomId changes (though unlikely in this setup)

  if (!username) {
    // Handle case where username is not found (e.g., user navigated directly)
    // You could redirect back home or show a message
    return (
      <div className="text-center">
        <p>Loading user information...</p>
        {/* Optionally add a link back home */}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-4rem)] gap-4 p-4">
      {" "}
      {/* Adjust height as needed */}
      {/* Participants Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        {" "}
        {/* Fixed width on medium screens+ */}
        <h2 className="text-lg font-semibold mb-2">
          Room:{" "}
          <span className="font-mono bg-muted px-1 rounded">{roomId}</span>
        </h2>
        <Separator className="mb-4" />
        <UserPresence users={participants} currentUsername={username} />
      </div>
      <Separator orientation="vertical" className="hidden md:block mx-2" />{" "}
      {/* Vertical separator on medium+ */}
      <Separator
        orientation="horizontal"
        className="block md:hidden my-2"
      />{" "}
      {/* Horizontal separator on small */}
      {/* Code Editor Area */}
      <div className="flex-grow h-full min-h-[400px] md:min-h-0">
        {" "}
        {/* Takes remaining space */}
        <CodeEditor language="javascript" />{" "}
        {/* Pass language or other props */}
      </div>
    </div>
  );
}
