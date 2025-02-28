export const extractParamsFromPath = (path: string, dynamicRoutes: string[]) => {
	for (let format of dynamicRoutes) {
		// Escape backslashes properly for regex
		let regexStr = format
			.replace(/\\/g, '\\\\') // First, escape all backslashes for regex
			.replace(/\[([^\]]+)\]/g, '(?<$1>[^/]+)') // Then handle parameter pattern

		let regex = new RegExp(`^${regexStr}$`)

		// Test if the path matches the format
		let match = path.match(regex)
		if (match && match.groups) {
			// Extract the named groups as the parameters
			return match.groups
		}
	}

	// Return null if no match is found
	return null
}
