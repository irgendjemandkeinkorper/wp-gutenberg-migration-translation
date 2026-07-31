const minimist = require('minimist');
const kleur = require('kleur');
const args = minimist(
	process.argv.slice(2),
	{
		alias: {
			h: 'help',
		},
		default: {
			dest: './build',
			'sprite-svg-name': 'svg/sprite.symbol.svg',
			'sprite-css-name': 'svg/sprite.css.svg',
			'sprite-dest': 'sprite',
			'icon-suffix': 'icon',
			debug: false,
		},
	}
);

try {
	if (args.help) {
		console.log(
			kleur.bgGreen('Usage: node generate-svg-sprite.js --icons <path(s)> [options]') + '\n' +
			kleur.bgCyan('Required:') + '\n' +
			kleur.blue('--icons ') + kleur.white('Paths to SVG icon directories (space-separated for multiple paths)') + '\n' +
			kleur.bgMagenta('Optional:') + '\n' +
			kleur.blue('--dest ') + kleur.white('Destination for generated files (default: \'./build\')') + '\n' +
			kleur.blue('--sprite-svg-name ') + kleur.white('Name for SVG sprite file (default: \'svg/sprite.svg\')') + '\n' +
			kleur.blue('--sprite-css-name ') + kleur.white('Name for CSS sprite file (default: \'svg/sprite.css\')') + '\n' +
			kleur.blue('--sprite-dest ') + kleur.white('Folder name for the sprite output (default: \'sprite\')')  + '\n' +
			kleur.blue('--icon-suffix ') + kleur.white('Suffix for each icon ID (default: \'icon\')')  + '\n' +
			kleur.blue('--debug ') + kleur.white('Enable debug logging')
		);
		process.exit(0);
	}

	if (!args.icons) {
		console.error(kleur.red("Error: The '--icons' option is required."));
		console.log(kleur.yellow("Use '--help' to see usage information."));
		process.exit(1);
	}

	const fs = require('fs');
	const path = require('path');
	const iconsDirectories = args.icons.split(' ');
	let iconsAbsolutePaths = iconsDirectories.filter(Boolean).map((dir) => path.resolve(path.join(process.cwd(), dir.replaceAll('\'', ''))));
	iconsAbsolutePaths = iconsAbsolutePaths.filter((absolutePath) => {
		const isDirectoryExist = fs.existsSync(path.dirname(absolutePath).replace(/[*?]+/g, ''));
		if (!isDirectoryExist) {
			console.warn(kleur.yellow(`Error: path ${absolutePath} not found`));
		}

		return isDirectoryExist;
	});

	if (iconsAbsolutePaths.length < 1) {
		console.error(kleur.red('No correct paths found'));
		process.exit(1);
	}

	const glob = require('glob');
	const files = iconsAbsolutePaths.flatMap((currentPath) => glob.sync(currentPath));

	if (files.length < 1) {
		console.log(kleur.yellow('No files found in the paths'));
		process.exit(0);
	}

	// See https://github.com/svg-sprite/svg-sprite/blob/HEAD/docs/configuration.md
	const childConfigPath = path.resolve(process.cwd(), './scripts/config/svg-sprite.config.js');
	let childConfig = {};
	if ( fs.existsSync(childConfigPath) ) {
		const childConfigFactory = require(childConfigPath);
		if ( 'function' === typeof childConfigFactory) {
			childConfig = childConfigFactory( args );
		}
	}

	const config = {
		...childConfig,
		dest: childConfig.dest || args.dest,
		log: childConfig.log || ( args.debug ? 'debug' : 'info' ),
		mode: {
			...(childConfig.mode?.css || {}),
			symbol: {
				dest: args['sprite-dest'],
				sprite: args['sprite-svg-name'],
				bust: false,
				...(childConfig.mode?.symbol || {})
			},
			css: {
				dest: args['sprite-dest'],
				sprite: args['sprite-css-name'],
				bust: false,
				render: {
					...(childConfig.mode?.css?.render || {}),
					css: {
						...(childConfig.mode?.css?.render?.css || {}),
						dest: path.join('', args['sprite-css-name']),
					},

				},
			},
		},
		shape: {
			...(childConfig.shape || {}),
			id: {
				generator: function (name) {
					return `${args['icon-suffix']}-${(path.basename(name, path.extname(name))).toLocaleLowerCase()}`.trim();
				},
			},
		},
	};

	const svgSpriter = require('svg-sprite');
	const spriter = new svgSpriter( config );
	files.forEach((file) => spriter.add(file, path.basename(file), fs.readFileSync(file, 'utf-8')));

	fs.rm(
		path.resolve(`${args.dest}/${args['sprite-dest']}`),
		{ recursive: true, force: true },
		(error) => {
		if (error) {
			console.error(kleur.red(error.message));
		} else {
			console.log(kleur.green('Previous sprite directory successfully deleted'));

			spriter.compile((error, result) => {
				if (error) {
					console.error(kleur.red(`Compilation error: ${error}`));
					process.exit(1);
				}

				for (const mode in result) {
					for (const resource in result[mode]) {
						try {
							fs.mkdirSync(path.dirname(result[mode][resource].path), { recursive: true });
							fs.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
							console.log(kleur.green(`Generated: ${result[mode][resource].path}`));
						} catch (writeError) {
							console.error(kleur.red(`Failed to write ${result[mode][resource].path}: ${writeError.message}`));
						}
					}
				}
			});

		}
	});

} catch (e) {
	console.error(kleur.red(e.message));
}
