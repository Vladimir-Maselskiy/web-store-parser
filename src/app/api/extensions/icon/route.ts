import ExtensionIconModel from '@/models/ExtensionIconModel';
import ExtensionModel from '@/models/ExtetsionModel';
import { connectToDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const extensionId = searchParams.get('id');

  if (!extensionId) {
    return NextResponse.json({ error: 'Missing extension id' }, { status: 400 });
  }

  await connectToDatabase();

  try {
    const storedIcon = await ExtensionIconModel.findOne({ extensionId }).lean<{
      base64: string;
      contentType: string;
    }>();

    if (storedIcon) {
      return NextResponse.json(
        { base64: storedIcon.base64, contentType: storedIcon.contentType },
        { headers: { 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    const extension = await ExtensionModel.findOne({ extensionId }).lean<{
      iconUrl: string;
    }>();

    if (!extension?.iconUrl) {
      return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
    }

    const response = await fetch(extension.iconUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch icon: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? 'image/png';

    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    await ExtensionIconModel.findOneAndUpdate(
      { extensionId },
      { base64, contentType, lastFetchedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      { base64, contentType },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch (error) {
    console.error('Failed to retrieve extension icon', error);

    return NextResponse.json({ error: 'Failed to retrieve icon' }, { status: 502 });
  }
};
