import { Schema, model, models } from 'mongoose';

const extensionIconSchema = new Schema(
  {
    extensionId: { type: String, required: true, unique: true },
    base64: { type: String, required: true },
    contentType: { type: String, required: true },
    lastFetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ExtensionIconModel =
  models.ExtensionIcon || model('ExtensionIcon', extensionIconSchema);

export default ExtensionIconModel;
