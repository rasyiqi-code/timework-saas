import { Server } from "socket.io";

export const emitProjectUpdate = async (projectId: string, message?: string) => {
    // In a custom server setup, `io` is attached to `global`
    const io: Server | undefined = (global as unknown as { io: Server }).io;

    if (io) {
        io.to(`project:${projectId}`).emit("project-update", {
            projectId,
            message,
            timestamp: Date.now()
        });
        // console.log(`Emitted project-update for project:${projectId}`);
    } else {
        // console.warn("Socket.io instance not found on global object. Realtime update skipped.");
    }
};

export const emitProjectListUpdate = async (organizationId: string, message?: string) => {
    const io: Server | undefined = (global as unknown as { io: Server }).io;

    if (io) {
        io.to(`org:${organizationId}`).emit("project-list-update", {
            organizationId,
            message,
            timestamp: Date.now()
        });
    }
};
