"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define a type for user data
interface User {
  id: string; // Unique ID for React key later
  name: string;
  avatarUrl?: string; // Optional avatar image URL
}

interface UserPresenceProps {
  users: User[];
  currentUsername?: string; // To potentially highlight the current user
}

// Function to get initials from a name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(
    0
  )}`.toUpperCase();
};

export default function UserPresence({
  users,
  currentUsername,
}: UserPresenceProps) {
  return (
    <Card className="w-full h-94/100">
      {" "}
      {/* Adjust width/height as needed */}
      <CardHeader>
        <CardTitle>Participants ({users.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto">
        {" "}
        {/* Add scroll if list gets long */}
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                )}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span
                className={`text-sm ${
                  user.name === currentUsername ? "font-semibold" : ""
                }`}
              >
                {user.name} {user.name === currentUsername ? "(You)" : ""}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for others...</p>
        )}
      </CardContent>
    </Card>
  );
}
