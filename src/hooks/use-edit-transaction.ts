import { create } from 'zustand';
import { PopulatedTransaction } from '@/models/transaction.model';

type EditTransactionState = {
  transaction: PopulatedTransaction | null;
  isOpen: boolean;
  onOpen: (transaction: PopulatedTransaction) => void;
  onClose: () => void;
};

export const useEditTransaction = create<EditTransactionState>((set) => ({
  transaction: null,
  isOpen: false,
  onOpen: (transaction) => set({ isOpen: true, transaction }),
  onClose: () => set({ isOpen: false, transaction: null }),
})); 