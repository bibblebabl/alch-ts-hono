import alchemy from "alchemy"
import { TanStackStart, Worker, WranglerJson } from "alchemy/cloudflare"
import { GitHubComment } from "alchemy/github"
import { CloudflareStateStore } from "alchemy/state"
import { config } from "dotenv"

// Load .env files only in local development, not in CI
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
	config({ path: "./.env" })
	config({ path: "./apps/web/.env" })
	config({ path: "./apps/server/.env" })
}

const githubConfig = {
	owner: "bibblebabl",
	repository: "alch-ts-hono",
} as const

const cloudflareConfig = {
	owner: "belogurovigor",
} as const

const app = await alchemy(githubConfig.repository, {
	stateStore: (scope) => new CloudflareStateStore(scope, {
		forceUpdate: true
	})
})


export const web = await TanStackStart("web", {
	name: `${app.name}-${app.stage}-web`,
	cwd: "./apps/web",
	bindings: {
		VITE_SERVER_URL: `https://${app.name}-${app.stage}-server.${cloudflareConfig.owner}.workers.dev`,
	},
	dev: {
		command: "bun run dev:web",
	},
	build: {
		command: "bun run build"
	},
})

if (!web.url) {
	throw new Error("Web URL is not defined")
}

export const serverWorker = await Worker("server", {
	cwd: "./apps/server",
	name: `${app.name}-${app.stage}-server`,
	entrypoint: "./src/index.ts",
	compatibility: "node",
	bindings: {
		DATABASE_URL: alchemy.secret(process.env.DATABASE_URL),
		CORS_ORIGIN: web.url,
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
		BETTER_AUTH_URL: web.url,
	},
	dev: {
		port: 3000,
	},
})

await WranglerJson("wrangler", {
	worker: serverWorker,
})

console.log(`Web    -> ${web.url}`)
console.log(`Server -> ${serverWorker.url}`)

// Post comment to GitHub PR with preview URLs
if (process.env.PULL_REQUEST) {
	await GitHubComment("pr-comment", {
		owner: githubConfig.owner,
		repository: githubConfig.repository,
		issueNumber: Number(process.env.PULL_REQUEST),
		body: `## 🚀 Deployment Preview Ready!

Your deployment preview has been successfully deployed:

**🌐 Frontend:** ${web.url}
**⚡ Backend API:** ${serverWorker.url}

This preview was built from commit \`${process.env.GITHUB_SHA || 'unknown'}\`

---
<sub>🤖 This comment will be updated automatically when you push new commits to this PR.</sub>
<sub>Last updated: ${new Date().toUTCString()}</sub>
`
	})
}

await app.finalize()