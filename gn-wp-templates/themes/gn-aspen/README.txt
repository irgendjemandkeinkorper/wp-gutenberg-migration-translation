# GolfNow Aspen Theme

GitHub project link: https://github.com/wpcomvip/golfnow/.
Theme GitHub link: https://github.com/wpcomvip/golfnow/tree/master/themes/gn-basic/.

## Setting up your build

1. Navigate to your wp-content directory
2. From there, change directory to `themes/gn-aspen/lib/processor-styles
3. Run command `npm intall` to install dependencies
4. If necessary run command `npm audit fix`
5. Check if installation succeeded by running `npm run build`

## For Developers

This theme uses WordPress Scripts.
https://www.npmjs.com/package/@wordpress/scripts

This theme was adapded from the StudioPress Genesis Basic theme.
https://github.com/studiopress/genesis-sample/

### npm scripts

Scripts are also provided to help with CSS linting, CSS autoprefixing, and creation of pot language files. To use them:

1. Install [Node.js](https://nodejs.org/), which also gives you the Node Package Manager (npm).

2. In the command line, change directory to the gn-aspen/lib/processor-styles folder.

3. Type the command `npm install` to install dependencies.

4. Make sure NBCSN-Basic-Frameworks Plugin is initialized: /plugins/nbcsn-basic-frameworks

You can then type any of these commands:

- `npm run start` to run the basic processor in development mode.
- `npm run build` when wanting to view the code in development format
