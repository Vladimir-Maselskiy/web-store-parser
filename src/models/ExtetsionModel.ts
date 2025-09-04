import { Schema, model, models } from 'mongoose';

const extensionSchema = new Schema(
  {
    extensionId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    lastUpdate: { type: Number, required: true },
    usersQty: { type: Number, required: true },
    iconUrl: { type: String, required: true },
    history: [
      {
        version: String,
        usersQty: Number,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const ExtensionModel = models.Extension || model('Extension', extensionSchema);

export default ExtensionModel;
