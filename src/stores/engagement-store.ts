import { create } from "zustand";
import { localStorageHelper } from "@/helpers/store-helper";

const STORAGE_KEY = "engagement_code";

interface EngagementState {
	engagementCode: string;
	setEngagementCode: (code: string) => void;
	clearEngagementCode: () => void;
}

const getInitialCode = () => {
	const stored = localStorageHelper.get<string>(STORAGE_KEY);
	return stored || "";
};

export const useEngagementStore = create<EngagementState>((set) => ({
	engagementCode: getInitialCode(),
	setEngagementCode: (code: string) => {
		localStorageHelper.set(STORAGE_KEY, code);
		set({ engagementCode: code });
	},
	clearEngagementCode: () => {
		localStorageHelper.remove(STORAGE_KEY);
		set({ engagementCode: "" });
	}
}));
