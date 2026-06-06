import "./config";
import express from "express";
import cors from "cors";
import { briefRouter } from "./routes/brief";
import { entryRouter } from "./routes/entry";

export const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api/brief", briefRouter);
app.use("/api/entry", entryRouter);

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`server on :${port}`));
}
