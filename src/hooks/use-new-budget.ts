import { create } from 'zustand';

type NewBudgetState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewBudget = create<NewBudgetState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
})); 