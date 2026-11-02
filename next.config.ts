import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			use: ["@svgr/webpack"]
		});

		return config;
	},

	async redirects() {
		return [
			{
				source: "/",
				destination: "/e-tariff-classification",
				permanent: false
			}
		];
	},

	devIndicators: false

	//   swcMinify: false,
};

export default nextConfig;
