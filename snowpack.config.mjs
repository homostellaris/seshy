// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
	mount: {
		'src': '/',
	},
	plugins: [
		[
			'@snowpack/plugin-sass',
			{
				compilerOptions: {
					stopOnError: false,
					trace: true,
				},
			},
		],
	],
	packageOptions: {
		// namedExports: [
		// 	'@material/list',
		// 	'@material/ripple',
		// ],
	},
	devOptions: {
		/* ... */
	},
	buildOptions: {
		metaUrlPath: 'snowpack',
	},
	optimize: {
		bundle: true,
		entrypoints: [ // TODO: See if 'auto' starts working later so this can be removed.
			'worker.js',
			'ui/index.js', // TODO: See if CSS bundling starts working with only specific parts of the app bundled.
		],
	},
}
