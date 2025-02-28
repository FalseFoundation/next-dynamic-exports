import { FALLBACK_STRING } from '../utils/constants'
import { getDynamicRoutes } from '../utils/getDynamicRoutes'
import fs from 'fs'
import path from 'path' // Import the 'path' module for platform-agnostic path handling

export const generateRoutes = () => {
	const routes = getDynamicRoutes()
	printRoutes(routes)
	writeRoutes(routes)

	const serverType = process.argv[3]
	generateServerConfig(serverType, routes)
}

const printRoutes = (routes: string[]) => {
	console.log(routes.length, 'dynamic routes detected:')
	for (let route of routes) {
		console.log(route)
	}
}

const writeRoutes = (routes: string[]) => {
	const routesFile = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicRoutes = void 0;
exports.dynamicRoutes = ${JSON.stringify(routes, null, 2)};`

	// Use path.join to ensure platform-specific paths
	const pathToUpdate = path.join(
		process.cwd(),
		'node_modules',
		'@falsefoundation',
		'next-dynamic-exports',
		'dist',
		'utils',
		'dynamicRoutes.js',
	)

	fs.writeFileSync(pathToUpdate, routesFile)
}

const writeServeJson = (routes: string[]) => {
	const serveJson = {
		rewrites: routes.map(routeToRewrite),
	}

	// Platform-agnostic path joining
	const pathToUpdate = path.join(process.cwd(), 'serve.json')
	fs.writeFileSync(pathToUpdate, JSON.stringify(serveJson, null, 2))
}
const routeToRewrite = (route: string) => {
	// Normalize the path separators for Windows to Unix format
	const normalizedRoute = route.replace(/\\/g, '/') // Replace backslashes with forward slashes

	return {
		source: normalizedRoute.replace(/\[([^\]]+)\]/g, ':$1'), // change to /user/:id format
		destination: normalizedRoute.replace(/\[([^\]]+)\]/g, FALLBACK_STRING) + '.html', // change to /user/fallback format
	}
}

const generateServerConfig = (serverType: string, routes: string[]) => {
	switch (serverType) {
		case 'serve':
			writeServeJson(routes)
			break
		case 'cloudfront':
			writeCloudfrontConfig(routes)
			break
		default:
			break
	}
}

const writeCloudfrontConfig = (routes: string[]) => {
	const rewrites = routes.map(routeToRewrite)

	const cloudFuncStr = fs.readFileSync(
		path.join(
			process.cwd(),
			'node_modules',
			'@falsefoundation',
			'next-dynamic-exports',
			'dist',
			'cli',
			'referenceCloudfrontFunc.js',
		),
		'utf8',
	)
	const cloudFunc = cloudFuncStr
		.replace('[]', JSON.stringify(rewrites, null, 4))
		.replace('"use strict";', '')

	// Use platform-agnostic path joining for output file
	const pathToUpdate = path.join(process.cwd(), 'cloudfrontFunc.js')

	fs.writeFileSync(pathToUpdate, cloudFunc)
}
