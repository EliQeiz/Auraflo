import { requireUser } from "../../server/auth.js";
import { getBearerToken, parseBody, withApi } from "../../server/http.js";
import { createProjectWithSignedUpload } from "../../server/projects.js";
import { createProjectSchema } from "../../server/schemas.js";
import { createSupabaseAdmin } from "../../server/supabaseAdmin.js";

export default withApi(async (req, res) => {
  const admin = createSupabaseAdmin();
  const user = await requireUser(admin, getBearerToken(req));
  const input = createProjectSchema.parse(parseBody(req));

  const result = await createProjectWithSignedUpload(admin, {
    userId: user.id,
    projectName: input.projectName,
    mediaType: input.mediaType,
    fileName: input.fileName,
    contentType: input.contentType,
    fileSize: input.fileSize,
  });

  res.status(201).json(result);
}, ["POST"]);
