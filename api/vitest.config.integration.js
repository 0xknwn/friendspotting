"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// vitest.config.integration.ts
const config = require("vitest/config");
exports.default = (0, config.defineConfig)({
    test: {
        include: ["src/integration/**/*.test.ts"],
        setupFiles: ["dotenv/config"],
    },
    resolve: {
        alias: {
            lib: "/src/lib",
        },
    },
});
