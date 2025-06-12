import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface IImportHistory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  fileSize: number;
  originalData: any[];
  status: 'pending' | 'analyzing' | 'ready' | 'importing' | 'completed' | 'failed';
  totalRows: number;
  importedRows: number;
  failedRows: number;
  importErrors: string[];
  aiAnalysis: {
    dataType: 'transactions' | 'accounts' | 'categories' | 'mixed' | 'unknown';
    columnMappings: Record<string, string>;
    confidence: number;
    suggestions: string[];
    warnings: string[];
    detectedColumns: string[];
  };
  userConfirmedMappings?: Record<string, string>;
  previewData: any[];
  createdAt: Date;
  completedAt?: Date;
}

const ImportHistorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  originalData: {
    type: [Schema.Types.Mixed],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'ready', 'importing', 'completed', 'failed'],
    default: 'pending',
  },
  totalRows: {
    type: Number,
    default: 0,
  },
  importedRows: {
    type: Number,
    default: 0,
  },
  failedRows: {
    type: Number,
    default: 0,
  },
  importErrors: {
    type: [String],
    default: [],
  },
  aiAnalysis: {
    dataType: {
      type: String,
      enum: ['transactions', 'accounts', 'categories', 'mixed', 'unknown'],
      default: 'unknown',
    },
    columnMappings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    confidence: {
      type: Number,
      default: 0,
    },
    suggestions: {
      type: [String],
      default: [],
    },
    warnings: {
      type: [String],
      default: [],
    },
    detectedColumns: {
      type: [String],
      default: [],
    },
  },
  userConfirmedMappings: {
    type: Schema.Types.Mixed,
  },
  previewData: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  completedAt: {
    type: Date,
  },
}, { timestamps: true });

// Create indexes for better query performance
ImportHistorySchema.index({ userId: 1, createdAt: -1 });
ImportHistorySchema.index({ status: 1 });

const ImportHistory = models.ImportHistory || mongoose.model<IImportHistory>('ImportHistory', ImportHistorySchema);

export default ImportHistory; 