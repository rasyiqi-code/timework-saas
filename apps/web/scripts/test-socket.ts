import { io } from "socket.io-client";

// Connect to local server
const socket = io("http://localhost:3000", {
    path: "/socket.io"
});

console.log("Connecting to socket...");

socket.on("connect", () => {
    console.log("Connected! ID:", socket.id);

    // Join a dummy project room (or a known one if we knew an ID)
    // We'll join a random one, but to verify we need to trigger an update on THAT project.
    // Ideally we need a real project ID.
    // But establishing connection is Step 1.
    socket.emit("join-project", "test-project-123");
    console.log("Joined room: project:test-project-123");
});

socket.on("project-update", (data) => {
    console.log("RECEIVED UPDATE:", data);
    process.exit(0); // Success
});

socket.on("connect_error", (err) => {
    console.error("Connection Error:", err.message);
    process.exit(1);
});

// Keep alive
setInterval(() => { }, 1000);
