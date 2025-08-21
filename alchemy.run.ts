import alchemy from "alchemy"
import { TanStackStart, Worker, WranglerJson } from "alchemy/cloudflare"
import { config } from "dotenv"

config({ path: "./.env" })
config({ path: "./apps/web/.env" })
config({ path: "./apps/server/.env" })

const app = await alchemy("alch-ts-hono")

export const web = await TanStackStart("web", {
	name: `${app.name}-${app.stage}-web`,
	entrypoint: "./apps/web/index.ts",
	bindings: {
		VITE_SERVER_URL: process.env.VITE_SERVER_URL || "",
	},
	dev: {
		command: "bun run dev",
	},
})

const server = await Worker("server", {
	name: `${app.name}-${app.stage}-server`,
	entrypoint: "./apps/server/index.ts",
	compatibility: "node",
	bindings: {
		DATABASE_URL: alchemy.secret(process.env.DATABASE_URL),
		CORS_ORIGIN: process.env.CORS_ORIGIN || "",
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "",
	},
	dev: {
		port: 3000,
	},
})

await WranglerJson("wrangler", {
	worker: server,
})

console.log(`Web    -> ${web.url}`)
console.log(`Server -> ${server.url}`)

await app.finalize()
