import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  type: 'Income' | 'Expense';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true,
  },
}, { timestamps: true });

// Ensure unique category name per user and type
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });


const Category = models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category; 