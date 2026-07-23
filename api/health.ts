import { withApi } from "../server/http";

export default withApi(async (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "auraflow-api",
    timestamp: new Date().toISOString(),
  });
}, ["GET"]);
