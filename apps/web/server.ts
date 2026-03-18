import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        // Optional: Add CORS or other config if needed
        // cors: { origin: "*" } 
    });

    io.on("connection", (socket) => {
        // console.log("Client connected", socket.id);

        socket.on("join-project", (projectId) => {
            // console.log(`Socket ${socket.id} joining project:${projectId}`);
            socket.join(`project:${projectId}`);
        });

        socket.on("join-org", (organizationId) => {
            // console.log(`Socket ${socket.id} joining org:${organizationId}`);
            socket.join(`org:${organizationId}`);
        });

        socket.on("disconnect", () => {
            // console.log("Client disconnected");
        });
    });

    // Expose io globally so Server Actions can access it
    // This is a common pattern for Next.js Custom Server to bridge to Server Actions
    (global as unknown as { io: Server }).io = io;

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Realtime Server (Socket.io) Active`);
    });
});
