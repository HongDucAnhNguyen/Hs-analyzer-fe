export type IBodyHsCodeSearch = {
	product_name: string;
	science_name: string;
	product_description: string;
	function: string;
	structure: string;
	material: string;
	specifications: string;
	images?: File;
	other_information?: string;
};

export type IHsCodeCandidateRequest = {
	hs_code: string;
	number_of_occurrences: number;
};

export type IProductInfoRequest = {
	product_name: string;
	science_name?: string | null;
	product_description: string;
	function: string;
	structure?: string | null;
	material?: string | null;
	specifications?: string | null;
	other_information?: string | null;
};

export type IBodyHsCodeAnalyze = {
	product: IProductInfoRequest;
	hs_codes: IHsCodeCandidateRequest[];
};

export type IResponseHsRuling = {
	product_name: string;
	results: {
		technical_name: string;
		links: {
			reason: string;
			link: string;
			ruling_id: string;
			source: string;
			source_url: string;
		}[];
	}[];
	sources_queried: {
		source: string;
		source_url: string;
	}[];
};

export type IResponseHsDatabase = {
	task_id: string;
	status: "SUCCESS" | "PROGRESS";
	progress: string;
	error: string;
	result: {
		product_name: string;
		results: {
			technical_name: string;
			sources: {
				hs_codes: {
					hs_code: string;
					count: number;
					percentage: number;
					description: string;
					url: string;
				}[];
				result_url: string;
				total_count: number;
				source: string;
				source_url: string;
			}[];
		}[];
	};
};

export type IResponseHsDatabaseAsync = IResponseHsCodeAsync;

export type IResponseHsCodeCompendium = {
	subheading_ids: string[];
	reason: string;
	content_of_citation: string;
	metadata: {
		source_pages: number[];
		chapter: string | number;
		heading: string | number;
	};
}[];

export type IResponseHsCodeAsean = IResponseHsCodeCompendium;

export type IResponseHsCodeAsync = {
	task_id: string;
	status: string;
	message: string;
};

export type IResponseHsCode = {
	task_id: string;
	status: "PENDING" | "STARTED" | "PROGRESS" | "SUCCESS" | "FAILURE";
	progress?: Record<string, any> | string;
	error?: string;
	partial_results: {
		section_classification?: SectionClassification;
		chapter_classification?: ChapterClassification;
		heading_classification?: HeadingClassification;
		subheading_classification?: SubheadingClassification;
	};
	result: {
		section_classification?: SectionClassification;
		chapter_classification?: ChapterClassification;
		heading_classification?: HeadingClassification;
		subheading_classification?: SubheadingClassification;
	};
};

type ProductAnalysis = {
	product_dna: string;
	key_attribute: string;
};

type SelectedSection = {
	section_id: string;
	section_title: string;
	rationale: string;
	legal_basis: string;
	gir_application: string;
};

type SelectedChapter = {
	chapter_id: string;
	chapter_title: string;
	rationale: string;
	legal_basis: string;
	gir_application: string;
};

type SelectedHeading = {
	heading_id: string;
	heading_title: string;
	rationale: string;
	legal_basis: string;
	gir_application: string;
};

type SelectedSubheading = {
	subheading_id: string;
	subheading_title: string;
	rationale: string;
	legal_basis: string;
	gir_application: string;
};

type RejectedItem = {
	section_id?: string;
	chapter_id?: string;
	heading_id?: string;
	subheading_id?: string;
	reason: string;
};

type Gir6HierarchyAnalysis = {
	selected_one_dash: string;
	reasoning_one_dash: string;
};

type SectionClassification = {
	product_analysis: ProductAnalysis;
	selected_section: SelectedSection;
	rejected_sections: RejectedItem[];
	content_of_explanatory_notes: string;
	source_pages: number[];
};

type ChapterClassification = {
	product_analysis: ProductAnalysis;
	selected_chapter: SelectedChapter;
	rejected_chapters: RejectedItem[];
	content_of_explanatory_notes: string;
	source_pages: number[];
};

type HeadingClassification = {
	product_analysis: ProductAnalysis;
	selected_heading: SelectedHeading;
	rejected_headings: RejectedItem[];
	content_of_explanatory_notes: string;
	source_pages: number[];
};

type SubheadingClassification = {
	product_analysis: ProductAnalysis;
	gir6_hierarchy_analysis: Gir6HierarchyAnalysis;
	selected_subheading: SelectedSubheading;
	rejected_subheadings: RejectedItem[];
	content_of_explanatory_notes: string;
	source_pages: number[];
};

export type IHsCodeAnalysisResult = {
	hs_code: string;
	number_of_occurrences: number;
	compatibility_score: number;
	legal_reasoning: string;
	gir_applied?: string;
	hs_code_description?: string;
	section_info?: string;
	chapter_info?: string;
};

export type IHsCodeAnalyzeResponse = {
	product_name: string;
	total_hs_codes_analyzed: number;
	recommended_hs_code?: string;
	results: IHsCodeAnalysisResult[];
	executive_summary: string;
};
