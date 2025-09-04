import ExtensionModel from '@/models/ExtetsionModel';
import { connectToDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  await connectToDatabase();
  const extensions = await ExtensionModel.find({}).sort({ usersQty: -1 });
  console.log('extensions', extensions);
  return NextResponse.json({ extensions });
};
