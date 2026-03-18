"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export const getSocket = (): Socket => {
    if (!socket) {
        // Disable socket in production (Vercel) since Custom Server is not supported there
        // unless explicitly enabled via env var.
        const isProduction = process.env.NODE_ENV === 'production';
        const shouldConnect = !isProduction || process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'true';

        if (shouldConnect) {
            socket = io({
                path: "/socket.io",
                autoConnect: true,
            });
        }
    }

    // Return socket if it exists, otherwise return a dummy mock object to prevent crashes
    // This allows the app to run in Vercel (without realtime) without refactoring all hooks
    return (socket || {
        on: () => { },
        off: () => { },
        emit: () => { },
        connect: () => { },
        disconnect: () => { },
        id: "mock-socket-id"
    }) as Socket;
};
