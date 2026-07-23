import { requireUser } from "../../server/auth";
import { getBearerToken, parseBody, withApi } from "../../server/http";
import { createProjectWithSignedUpload } from "../../server/projects";
import { createProjectSchema } from "../../server/schemas";
import { createSupabaseAdmin } from "../../server/supabaseAdmin";

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
