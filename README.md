# Real-Time Collaborative Code Editor 🚀

Forge code together in seamless harmony! This application provides a real-time, web-based collaborative code editing environment, allowing multiple users to join rooms and work on code simultaneously.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ## Overview

This project empowers developers to connect and code in shared sessions. Leveraging modern web technologies, it offers a fluid editing experience where changes are reflected instantly across all participants in a room, ensuring everyone stays perfectly in sync.

## ✨ Features

- **Real-Time Collaboration:** See changes from collaborators appear character-by-character.
- **User Presence:** Know who's currently active in your coding session.
- **Syntax Highlighting:** Powered by the Monaco Editor (the engine behind VS Code) for a familiar and powerful editing experience.
- **Room-Based Sessions:** Create or join isolated rooms for focused collaboration.
- **Dockerized Environment:** Easy setup and consistent running environment using Docker Compose.

## 🛠️ Tech Stack

- **Frontend:**
  - Next.js (React Framework)
  - TypeScript
  - Tailwind CSS
  - shadcn/ui (UI Components)
  - Monaco Editor (@monaco-editor/react)
  - WebSockets (Native Browser API)
- **Backend:**
  - Node.js
  - Express.js
  - TypeScript
  - WebSockets (`ws` library)
  - Redis (for Pub/Sub Messaging)
  - Operational Transformation (OT) Logic
- **DevOps:**
  - Docker
  - Docker Compose

## 🏗️ Architecture Overview

The application employs a robust architecture designed for real-time performance and scalability:

1.  **Client (Browser):** The Next.js frontend establishes a persistent WebSocket connection to the backend upon entering an editor room. User actions (keystrokes, selections) are converted into **Operational Transformation (OT) operations** and sent over the WebSocket. Incoming operations from other users are received via WebSocket, transformed against local pending changes if necessary, and applied to the Monaco Editor instance.
2.  **Backend (Node.js Server):** An Express server forms the foundation, with the `ws` library managing WebSocket connections. Each connection is associated with a user and a specific room.
3.  **Real-time Communication (WebSockets):** Provides the low-latency, bidirectional transport layer between clients and the backend server instance they are connected to.
4.  **Scalable Broadcasting (Redis Pub/Sub):** To handle broadcasting events (like new operations or presence changes) efficiently across potentially multiple backend instances, we utilize Redis Pub/Sub. When an instance needs to broadcast a message to a room, it publishes it to a dedicated Redis channel for that room (e.g., `room:<roomId>`). All backend instances subscribe to relevant room channels. Redis acts as a blazing-fast message bus, delivering the published message to all subscribed instances, which then forward it to their connected clients in that specific room. This decouples instances and enables horizontal scaling.
5.  **Concurrency Control (Operational Transformation - OT):** The core of the collaborative magic. To ensure data consistency when multiple users edit simultaneously, the backend employs OT algorithms. When an operation arrives from a client, it's validated against the current document version for that room. If concurrent edits have occurred, the incoming operation is **transformed** against those concurrent operations before being applied to the server's authoritative document state. The transformed operation (along with the new document version) is then broadcast via Redis Pub/Sub. This sophisticated process guarantees that all clients converge to the exact same document state, preventing data loss and resolving conflicts gracefully.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (Usually included with Docker Desktop)
- [Git](https://git-scm.com/) (To clone the repository)
- Node.js & npm (Optional - for local development outside Docker)

## 🚀 Getting Started

Follow these steps to get the application running locally using Docker:

1.  **Clone the Repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-directory-name>
    ```

2.  **Configure Environment Variables (Optional):**

    - The backend might require a `.env` file in the `rtcc-backend/` directory for specific settings (e.g., `PORT`, `REDIS_URL` if not using the default or a Docker service). Refer to `.env.example` if provided.
    - The frontend WebSocket URL (`NEXT_PUBLIC_WEBSOCKET_URL`) is configured within the `docker-compose.yml` file to connect to the backend service correctly within the Docker network.

3.  **Build Docker Images:**

    - Open a terminal in the project's root directory (where `docker-compose.yml` is located).
    - Run the build command:
      ```bash
      docker-compose build
      ```
    - This will build the Docker images for both the `frontend` and `backend` services based on their respective `Dockerfile`s.

4.  **Run the Application:**

    - Start the containers using Docker Compose:
      ```bash
      docker-compose up -d
      ```
    - (Use `docker-compose up` if you want to see the logs directly in your terminal).

5.  **Access the App:**
    - Open your web browser and navigate to:
      `http://localhost:3000`

You should now see the application's home page! Enter your name, create or join a room, and start collaborating.

## Environment Variables

- **Backend (`rtcc-backend/.env` or Docker Compose `environment`):**
  - `PORT`: The port the backend server listens on (e.g., 8080).
  - `REDIS_URL`: Connection string for the Redis instance (e.g., `redis://localhost:6379` or `redis://redis:6379` if using a Redis service in Docker Compose).
- **Frontend (Set in `docker-compose.yml` `environment`):**
  - `NEXT_PUBLIC_WEBSOCKET_URL`: The full URL the frontend uses to connect to the backend WebSocket server (e.g., `ws://backend:8080/ws` for Docker Compose service discovery).

---

Happy Collaborating! 🎉
