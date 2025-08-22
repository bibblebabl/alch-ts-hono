import alchemy from "alchemy"
import { TanStackStart, Worker, WranglerJson } from "alchemy/cloudflare"
import { CloudflareStateStore } from "alchemy/state"
import { config } from "dotenv"

// Load .env files only in local development, not in CI
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
	config({ path: "./.env" })
	config({ path: "./apps/web/.env" })
	config({ path: "./apps/server/.env" })
}

const app = await alchemy("alch-ts-hono", {
	stateStore: (scope) => new CloudflareStateStore(scope, {
		forceUpdate: true
	})
})

export const web = await TanStackStart("web", {
	name: `${app.name}-${app.stage}-web`,
	cwd: "./apps/web",
	bindings: {
		VITE_SERVER_URL: `${app.name}-${app.stage}-server.${process.env.CLOUDFLARE_SUBDOMAIN || "your-subdomain"}.workers.dev`,
	},
	dev: {
		command: "bun run dev:web",
	},
	build: {
		command: "bun run build"
	},
})

export const serverWorker = await Worker("server", {
	cwd: "./apps/server",
	name: `${app.name}-${app.stage}-server`,
	entrypoint: "./src/index.ts",
	compatibility: "node",
	bindings: {
		DATABASE_URL: alchemy.secret(process.env.DATABASE_URL || "postgresql://placeholder"),
		CORS_ORIGIN: web.url,
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production"),
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

await app.finalize()