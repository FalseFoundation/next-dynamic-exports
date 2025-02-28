import { FALLBACK_STRING } from '../utils/constants'
import { getDynamicRoutes } from '../utils/getDynamicRoutes'
import fs from 'fs'

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

	const pathToUpdate = `${process.cwd()}/node_modules/@falsefoundation/next-dynamic-exports/dist/utils/dynamicRoutes.js`

	fs.writeFileSync(pathToUpdate, routesFile)
}

const writeServeJson = (routes: string[]) => {
	const serveJson = {
		rewrites: routes.map(routeToRewrite),
	}

	const pathToUpdate = `${process.cwd()}/serve.json`
	fs.writeFileSync(pathToUpdate, JSON.stringify(serveJson, null, 2))
}

const routeToRewrite = (route: string) => {
	return {
		source: route.replace(/\[([^\]]+)\]/g, ':$1'), // change to /user/:id format
		destination: route.replace(/\[([^\]]+)\]/g, FALLBACK_STRING) + '.html', // change to /user/fallback format
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
		`${process.cwd()}/node_modules/@falsefoundation/next-dynamic-exports/dist/cli/referenceCloudfrontFunc.js`,
		'utf8',
	)
	const cloudFunc = cloudFuncStr
		.replace('[]', JSON.stringify(rewrites, null, 4))
		.replace('"use strict";', '')

	const pathToUpdate = `${process.cwd()}/cloudfrontFunc.js`

	fs.writeFileSync(pathToUpdate, cloudFunc)
}
