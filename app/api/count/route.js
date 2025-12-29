import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('cfs_certificates');

    // Get the current count of submissions
    const count = await db.collection('submissions').countDocuments();

    return NextResponse.json({
      count,
      total: 6000
    });
  } catch (error) {
    console.error('Error fetching count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count', count: 0, total: 6000 },
      { status: 500 }
    );
  }
}
