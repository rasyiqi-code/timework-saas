import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/actions/auth';
import { ProjectService } from '@repo/project-service';

const projectService = new ProjectService(prisma);

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.organizationId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '12');
        const cursor = searchParams.get('cursor') || undefined;

        const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };
        const result = await projectService.getProjectsMatrix(ctx, limit, cursor);

        return NextResponse.json(result);
    } catch (error) {
        console.error('API Projects Matrix Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
