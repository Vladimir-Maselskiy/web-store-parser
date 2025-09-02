import { parseExtensions } from '@/utils/parseExtensions';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  console.log('Cron job triggered');
  await parseExtensions();
  return NextResponse.json({ success: true }, { status: 200 });
};
