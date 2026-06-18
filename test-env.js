// Environment validation test
import { env, features } from "./lib/config/env";

console.log("🔧 Environment Validation Test");
console.log("================================");

console.log("\n✓ Environment Variables Loaded:");
console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
console.log(`  - DATABASE_URL: ${env.DATABASE_URL ? 'configured' : 'missing'}`);
console.log(`  - JWT_SECRET: ${env.JWT_SECRET ? 'configured' : 'missing'}`);

console.log("\n🎯 Feature Availability:");
Object.entries(features).forEach(([feature, enabled]) => {
  console.log(`  ${enabled ? "✅" : "⚠️ "} ${feature}: ${enabled ? "enabled" : "disabled"}`);
});

console.log("\n🎉 Environment validation completed successfully!");