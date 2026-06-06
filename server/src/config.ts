import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),

  glm: {
    apiKey: process.env.GLM_API_KEY,
    baseUrl:
      process.env.GLM_BASE_URL ??
      "https://api.z.ai/api/paas/v4/chat/completions",
    model: process.env.GLM_MODEL ?? "glm-5.1",
  },

  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  nhsServiceSearchKey: process.env.NHS_SERVICE_SEARCH_KEY,

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
