import ExtensionIconModel from '@/models/ExtensionIconModel';

export async function saveExtensionIcon(
  extensionId: string,
  iconUrl: string
): Promise<void> {
  if (!iconUrl) return;

  try {
    const response = await fetch(iconUrl);

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
  } catch (error) {
    console.error(
      `Failed to save icon for extension ${extensionId} from ${iconUrl}`,
      error
    );
  }
}
