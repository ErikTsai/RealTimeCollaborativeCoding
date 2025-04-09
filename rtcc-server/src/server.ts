import dotenv from "dotenv";
dotenv.config(); // Load variables from .env file

import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import url from "url";

// --- Configuration ---
const PORT = process.env.PORT || 8080;

// --- Data Structures (In-Memory) ---
interface RoomState {
  clients: Set<WebSocketWithMeta>;
  documentContent: string; // Store current document content for the room
}
const rooms = new Map<string, RoomState>();

// Associate metadata with each WebSocket connection
interface WebSocketWithMeta extends WebSocket {
  roomId?: string;
  userId?: string; // Using username as userId for simplicity
  isAlive?: boolean;
}

// --- Express App Setup ---
const app = express();
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// --- HTTP Server Setup ---
const httpServer = http.createServer(app);

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ server: httpServer });
console.log(`WebSocket Server created`);

// --- Helper Function for Broadcasting ---
function broadcast(
  roomId: string,
  message: string,
  sender?: WebSocketWithMeta
) {
  const roomState = rooms.get(roomId);
  if (!roomState) return;

  // console.log(`Broadcasting to room ${roomId}: ${message}`);
  roomState.clients.forEach((client) => {
    // Send to all clients in the room *except* the original sender
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// --- WebSocket Connection Handling ---
wss.on("connection", (ws: WebSocketWithMeta, req) => {
  console.log("Client connected");

  // **1. Extract Room ID and User Info**
  const parameters = url.parse(req.url || "", true).query;
  const roomId = parameters.roomId as string;
  const username = parameters.username as string; // Use username as userId

  if (!roomId || !username) {
    console.error("Connection rejected: Missing roomId or username");
    ws.close(1008, "Missing roomId or username");
    return;
  }

  ws.roomId = roomId;
  ws.userId = username;
  ws.isAlive = true;

  console.log(`Client ${username} joined room ${roomId}`);

  // **2. Add Client to Room & Initialize Room State**
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Set(),
      documentContent: "", // Initialize with empty content or default
    });
    console.log(`Created new room: ${roomId}`);
  }
  const currentRoomState = rooms.get(roomId)!; // We know it exists now
  currentRoomState.clients.add(ws);

  // **3. Send Initial State to New Client**
  // Get current participants (excluding the new one for this message)
  const currentParticipants = Array.from(currentRoomState.clients)
    .filter((client) => client !== ws && client.userId) // Exclude self, ensure userId exists
    .map((client) => ({ id: client.userId!, name: client.userId! })); // Use username as name

  const initialStateMessage = JSON.stringify({
    type: "initial_state",
    payload: {
      documentContent: currentRoomState.documentContent,
      participants: currentParticipants,
    },
  });
  ws.send(initialStateMessage);

  // **4. Broadcast Join Message to Others**
  const joinMessage = JSON.stringify({
    type: "user_join",
    payload: { userId: ws.userId, name: ws.userId }, // Use username as name
  });
  broadcast(roomId, joinMessage, ws); // Use broadcast helper, exclude sender

  // **5. Handle Messages from Client**
  ws.on("message", (message) => {
    const messageString = message.toString();
    // console.log(`Received message from ${ws.userId} in room ${ws.roomId}: ${messageString}`);

    try {
      const parsedMessage = JSON.parse(messageString);

      // Simple Model: Assume any message contains the full code update
      if (parsedMessage.type === "code_update" && ws.roomId) {
        const newContent = parsedMessage.payload.content;

        // Update server state
        const roomState = rooms.get(ws.roomId);
        if (roomState) {
          roomState.documentContent = newContent;

          // Prepare broadcast message (add senderId)
          const broadcastMsg = JSON.stringify({
            type: "code_update",
            payload: { content: newContent },
            senderId: ws.userId,
          });

          // Broadcast directly to other clients in the room
          broadcast(ws.roomId, broadcastMsg, ws);
        }
      } else {
        console.warn(
          `Received unhandled message type or missing room: ${parsedMessage.type}`
        );
      }
    } catch (e) {
      console.error(
        `Failed to parse message from ${ws.userId}: ${messageString}`,
        e
      );
    }
  });

  // **6. Handle Pong for Heartbeat**
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // **7. Handle Client Disconnection**
  ws.on("close", () => {
    console.log(`Client ${ws.userId} disconnected from room ${ws.roomId}`);

    const roomState = rooms.get(roomId);
    if (roomState) {
      roomState.clients.delete(ws); // Remove client

      // **8. Broadcast Leave Message Directly**
      const leaveMessage = JSON.stringify({
        type: "user_leave",
        payload: { userId: ws.userId, name: ws.userId },
      });
      // Broadcast to remaining clients (sender is already gone)
      broadcast(roomId, leaveMessage);

      // **9. Clean Up Empty Room**
      if (roomState.clients.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} is empty and removed.`);
      }
    }
  });

  // **10. Handle Errors**
  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${ws.userId}:`, error);
    // Attempt cleanup on error
    const roomState = rooms.get(roomId);
    if (roomId && roomState) {
      roomState.clients.delete(ws);
      if (roomState.clients.size === 0) {
        rooms.delete(roomId);
      }
      // Optionally broadcast leave on error too
      const leaveMessage = JSON.stringify({
        type: "user_leave",
        payload: { userId: ws.userId, name: ws.userId },
      });
      broadcast(roomId, leaveMessage);
    }
  });
});

// --- Heartbeat Mechanism (Same as before) ---
const interval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const wsWithMeta = ws as WebSocketWithMeta;
    if (!wsWithMeta.roomId || !wsWithMeta.userId) return; // Skip unidentified clients
    if (wsWithMeta.isAlive === false) {
      console.log(
        `Terminating inactive connection for user ${wsWithMeta.userId}`
      );
      // Clean up room state before terminating
      const roomState = rooms.get(wsWithMeta.roomId);
      if (roomState) {
        roomState.clients.delete(wsWithMeta);
        if (roomState.clients.size === 0) {
          rooms.delete(wsWithMeta.roomId);
        }
        // Broadcast leave message
        const leaveMessage = JSON.stringify({
          type: "user_leave",
          payload: { userId: wsWithMeta.userId, name: wsWithMeta.userId },
        });
        broadcast(wsWithMeta.roomId, leaveMessage);
      }
      return ws.terminate();
    }
    wsWithMeta.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

// --- Start Server ---
httpServer.listen(PORT, () => {
  console.log(`HTTP Server listening on port ${PORT}`);
});
