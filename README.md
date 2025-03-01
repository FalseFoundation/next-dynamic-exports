<p align="center">
  <b style="font-size: 20px">
    ⚡️ Next Dynamic Exports ⚡️
  </b>
  <br/>
  Utilities that bring dynamic routing capabilities to your statically exported Next.js applications, enabling full App Router support regardless of hosting platform. Deploy your static Next.js site anywhere while maintaining the power of dynamic routes.
</p>

> **Note:** This package is a clone of **next-static-utils** developed by **zdenham**
> (https://github.com/zdenham/next-static-utils). We have cloned the original repository, updated
> the dependencies, and fixed several bugs to improve compatibility and performance.

## Motivation

Next.js offers an option for
[static site generation](https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation),
which allows you to export your site as raw html, js, etc... and host it statically on a CDN, or
however you like! This reduces the infra overhead of your application, if you are willing to
sacrifice SSR features.

**But SSG does not work with dynamic routes unless you generate all pages at build time**. There are
some discussions around this issue
[here](https://github.com/vercel/next.js/discussions/55393#discussioncomment-9668219) and
[here](https://github.com/vercel/next.js/discussions/64660#discussioncomment-9667981), which the
Vercel team will hopefully resolve soon. But even so, most static hosting providers outside of
Vercel don't know how to handle the way next.js does code splitting out of the box, which can lead
to unwanted 404 errors.

# Set Up

### Installation And CLI

```bash
npm install @falsefoundation/next-dynamic-exports
...
# Generates edge function for re-routing to a fallback page for dynamic params
npm next-dynamic-exports generate [cloudfront|serve]
```

### Usage

Inside your dynamic page:

```javascript
import { withDynamicParams } from '@falsefoundation/next-dynamic-exports'

// creates fallback parameter page
export const generateStaticParams = withDynamicParams()
```

To use the dynamic paramaters:

```javascript
'use client'

import { useDynamicParams } from '@falsefoundation/next-dynamic-exports'

export default function Component() {
	// pulls params from the url, e.g. /users/:id
	const { id } = useDynamicParams()

	return <div>Hello {id}</div>
}
```

### Required Next Config

```javascript
const nextConfig: NextConfig = (phase) => ({
	reactStrictMode: true,
	output: phase === 'phase-production-build' ? 'export' : 'standalone',
	images: {
		unoptimized: true,
	},

})
export default nextConfig
```

### Web Server Configuration

The webserver needs to rewrite the dynamic paths into the fallback file. Here is an example
configuration for nginx:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;

    # Handle dynamic routes first
    location ~ ^/dashboard/challenges/[^/]+$ {
        try_files $uri $uri.html /dashboard/challenges/[slug].html;
    }

    # Handle dynamic routes for accounts
    location ~ ^/dashboard/accounts/[^/]+$ {
        try_files $uri $uri.html /dashboard/accounts/[slug].html;
    }

    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    error_page 404 /404.html;
    location = /404.html {
        internal;
    }
}
```

## How it works

For every dynamic route, Next Dynamic Exports generates a fallback page which is served for dynamic
routes, this also satisfies next.js's requirement to generate static params when using the
`output: export` option.

Instead of using `useParams` which is not supported in SSG mode, the params are provided with a new
hook `useDynamicParams`
