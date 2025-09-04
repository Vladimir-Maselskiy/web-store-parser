export type TExtension = {
  extensionId: string;
  name: string;
  version: string;
  lastUpdate: number;
  usersQty: number;
  iconUrl: string;
};

export type TExtensionRecord = TExtension & {
  history: { version: string; usersQty: number; date: string; _id: string }[];
};
