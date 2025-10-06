import ExtensionModel from '@/models/ExtetsionModel';
import { connectToDatabase } from '@/utils/db';
import { NextResponse } from 'next/server';

export const GET = async () => {
  await connectToDatabase();
  const extensions = await ExtensionModel.find({}).sort({ usersQty: -1 });
  return NextResponse.json({ extensions });
};



