import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, "127.0.0.1", () => {
  console.info(`API listening on port ${env.PORT}`);
});
