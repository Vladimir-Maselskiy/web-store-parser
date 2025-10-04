import { parseExtensions } from '@/utils/parseExtensions';
import { NextResponse } from 'next/server';

export const POST = async () => {
  console.log('Cron job triggered');
  await parseExtensions();
  return NextResponse.json({ success: true }, { status: 200 });
};



