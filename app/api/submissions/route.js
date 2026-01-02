import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('cfs_certificates');

    // Save the submission with doctor name and timestamp
    await db.collection('submissions').insertOne({
      name: name.trim(),
      submittedAt: new Date(),
    });

    // Get the updated count
    const count = await db.collection('submissions').countDocuments();

    return NextResponse.json({
      success: true,
      count: count+214
    });
  } catch (error) {
    console.error('Error saving submission:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}
