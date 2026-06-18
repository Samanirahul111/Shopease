const fs = require("fs");
const { execSync } = require("child_process");

const envFile = fs.readFileSync(".env", "utf8");
const lines = envFile.split("\n");

const environments = ["production", "preview", "development"];

for (const line of lines) {
  if (!line || line.startsWith("#") || line.trim() === "") continue;
  
  const [key, ...rest] = line.split("=");
  const val = rest.join("=").replace(/^"|"$/g, ""); // remove quotes
  
  if (key === "DATABASE_URL" || key === "PORT" || key === "NODE_ENV" || key === "NEXT_PUBLIC_APP_URL" || key === "NEXTAUTH_URL") {
    continue; // handle later or ignore
  }

  for (const env of environments) {
    try {
      console.log(`Pushing ${key} to ${env}...`);
      execSync(`echo "${val}" | npx vercel env add ${key} ${env}`, { stdio: 'inherit' });
    } catch(e) {
      console.error(`Failed pushing ${key} to ${env}`);
    }
  }
}
