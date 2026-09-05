import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db/mongoose';
import UserPreference from '../../../models/UserPreference';

export async function GET() {
  await connectDB();
  let preferences = await UserPreference.findOne({ userId: 'demo-user' });
  if (!preferences) preferences = await UserPreference.create({ userId: 'demo-user' });
  return NextResponse.json({ preferences });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  await connectDB();
  const preferences = await UserPreference.findOneAndUpdate({ userId: 'demo-user' }, { $set: body }, { new: true, upsert: true });
  return NextResponse.json({ preferences });
}
