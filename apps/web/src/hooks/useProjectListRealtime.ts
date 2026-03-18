"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket-client";


export const useProjectListRealtime = (organizationId: string) => {
    const router = useRouter();

    useEffect(() => {
        if (!organizationId) return;

        const socket = getSocket();

        // Join the organization room
        socket.emit("join-org", organizationId);

        const onProjectListUpdate = () => {
            // console.log("Realtime Project List Update:", data);

            // Refresh to show new/deleted projects
            router.refresh();
        };

        socket.on("project-list-update", onProjectListUpdate);

        return () => {
            socket.off("project-list-update", onProjectListUpdate);
        };
    }, [organizationId, router]);
};
