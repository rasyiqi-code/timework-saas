"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket-client";


export const useProjectRealtime = (projectId: string) => {
    const router = useRouter();

    useEffect(() => {
        const socket = getSocket();

        // Join the project room
        socket.emit("join-project", projectId);

        const onProjectUpdate = (data?: { message?: string, initiatorId?: string }) => {
            // console.log("Realtime Update Received:", data);

            // Refresh the data without full page reload
            router.refresh();

            // Optional: Show a toast if message provided
            if (data?.message) {
                // toast.info("Project updated: " + data.message);
            }
        };

        socket.on("project-update", onProjectUpdate);

        return () => {
            socket.off("project-update", onProjectUpdate);
            // We don't strictly connect/disconnect here as the socket might be shared
        };
    }, [projectId, router]);
};
