import { create } from "zustand";

interface QuotaState {
	isQuotaBlocked: boolean;
	setQuotaBlocked: (blocked: boolean) => void;
	resetQuotaBlocked: () => void;
}

export const useQuotaStore = create<QuotaState>((set) => ({
	isQuotaBlocked: false,
	setQuotaBlocked: (blocked: boolean) => set({ isQuotaBlocked: blocked }),
	resetQuotaBlocked: () => set({ isQuotaBlocked: false })
}));
