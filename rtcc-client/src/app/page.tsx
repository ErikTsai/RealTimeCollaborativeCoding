"use client"; // Required for useState, localStorage, event handlers

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use App Router's navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateRoomId } from "@/lib/roomUtils"; // Assuming you created this helper

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Optional: Load username from localStorage if previously set
  useEffect(() => {
    const savedUsername = localStorage.getItem("editorUsername");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
    if (error && event.target.value) setError(""); // Clear error when user types
  };

  const handleRoomIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoomIdToJoin(event.target.value);
  };

  const validateAndProceed = (roomId: string) => {
    if (!username.trim()) {
      setError("Please enter a username.");
      return false;
    }
    // Basic Room ID validation (optional)
    if (!roomId.trim()) {
      setError("Room ID cannot be empty.");
      return false;
    }
    localStorage.setItem("editorUsername", username.trim()); // Save username for editor page
    router.push(`/editor/${roomId}`); // Navigate to the editor page
    return true;
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId(); // Generate a new random room ID
    validateAndProceed(newRoomId);
  };

  const handleJoinRoom = () => {
    validateAndProceed(roomIdToJoin);
  };

  // Handle Enter key press in input fields
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    action: "join" | "create"
  ) => {
    if (event.key === "Enter") {
      if (action === "join") {
        handleJoinRoom();
      } else if (action === "create" && username.trim()) {
        // Allow creating only if username is present, ignore room ID input for creation
        handleCreateRoom();
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Collaborative Code Editor</CardTitle>
        <CardDescription>
          Enter your name and join or create a coding room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Your Name</Label>
          <Input
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={handleUsernameChange}
            onKeyDown={(e) => handleKeyDown(e, "create")} // Allow Enter to create if name is filled
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleCreateRoom}
            className="w-full"
            disabled={!username.trim()}
          >
            Create New Room
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or Join Existing
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomId">Room ID</Label>
          <Input
            id="roomId"
            placeholder="Enter Room ID to join"
            value={roomIdToJoin}
            onChange={handleRoomIdChange}
            onKeyDown={(e) => handleKeyDown(e, "join")}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleJoinRoom}
          variant="outline"
          className="w-full"
          disabled={!roomIdToJoin.trim() || !username.trim()}
        >
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
}
