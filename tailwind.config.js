/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: 'tw-',
	important: false,
	content: [
		"./*.{html,js,jsx}",
		"./js/**/*.{js,jsx}",
		"./src/**/*.{html,js,jsx}",
		"./pages/**/*.{html,js,jsx}",
		// Add other specific directories where your files are located
		// Avoid patterns like "**/*" that match everything
	],
	theme: {
		extend: {
			colors: {
				primary: "#4f55c1"
			}
		},
	},
	plugins: [],
}

