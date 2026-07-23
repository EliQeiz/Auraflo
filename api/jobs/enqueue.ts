import { requireUser } from "../../server/auth.js";
import { enqueueJob } from "../../server/jobs.js";
import { getBearerToken, parseBody, withApi } from "../../server/http.js";
import { enqueueJobSchema } from "../../server/schemas.js";
import { createSupabaseAdmin } from "../../server/supabaseAdmin.js";

export default withApi(async (req, res) => {
  const admin = createSupabaseAdmin();
  const user = await requireUser(admin, getBearerToken(req));
  const input = enqueueJobSchema.parse(parseBody(req));

  const job = await enqueueJob(admin, {
    projectId: input.projectId,
    userId: user.id,
    jobType: input.jobType,
    payload: input.payload,
  });

  res.status(201).json({ job });
}, ["POST"]);
