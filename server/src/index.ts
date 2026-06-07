import "./config";
import express from "express";
import cors from "cors";
import { briefRouter } from "./routes/brief";
import { entryRouter } from "./routes/entry";
import { universitiesRouter } from "./routes/universities";

export const app = express();
app.use(cors());
// Parse incoming JSON requests with a payload limit of 1mb
// app.use(express.json({ limit: "1mb" }));
app.use(express.json());

app.use("/api/brief", briefRouter);
app.use("/api/entry", entryRouter);
app.use("/api/universities", universitiesRouter);

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`server on :${port}`));
}
