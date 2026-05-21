import { defineConfig } from "prisma/config"

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:ruth@localhost:5432/unistay",
  },
})