import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface IBudget extends Document {
    userId: Types.ObjectId;
    categoryId: Types.ObjectId;
    amount: number;
    month: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BudgetSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    month: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

// Ensure a user can only have one budget per category per month
BudgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });


const Budget = models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget; 