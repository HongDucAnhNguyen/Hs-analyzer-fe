import * as yup from "yup";

const trimText = (value: unknown) => {
	if (typeof value !== "string") return value;
	return value.trim();
};

const requiredOrNaField = (message: string) =>
	yup
		.string()
		.transform(trimText)
		.test("required-or-na", message, (value) => {
			if (value === undefined || value === null) return false;
			const trimmed = String(value).trim();
			if (!trimmed) return false;
			return trimmed.toLowerCase() === "n/a" || Boolean(trimmed);
		});

const normalizeOptionalText = (value: unknown) => {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed;
};

export const eTariffClassificationSchema = yup.object().shape({
	engagement_code: yup
		.string()
		.transform(normalizeOptionalText)
		.required("The engagement code is required."),
	product_name: yup
		.string()
		.transform(normalizeOptionalText)
		.required("The production name is required."),
	// science_name: yup.string()
	//   .required("The scientific/technical name is required."),
	science_name: yup.string().nullable(),
	product_description: requiredOrNaField(
		"The product description is required or enter N/A."
	),
	function: requiredOrNaField("The function is required or enter N/A."),
	// structure: yup
	//   .string()
	//   .required("The structure is required."),
	// material: yup
	//   .string()
	//   .required("The material is required."),
	// specifications: yup
	//   .string()
	//   .required("The specification is required."),
	structure: yup.string().transform(normalizeOptionalText).nullable(),
	material: yup.string().transform(normalizeOptionalText).nullable(),
	specifications: yup.string().transform(normalizeOptionalText).nullable(),
	other_information: yup.array().nullable(),
	// images: yup.mixed().required("The image is required.")
	images: yup.mixed().nullable()
});

export const loginSchema = yup.object().shape({
	username: yup.string().required("The Username is required."),
	password: yup.string().required("The Username is required.")
});
