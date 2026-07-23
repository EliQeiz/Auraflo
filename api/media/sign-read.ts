import { requireUser } from "../../server/auth.js";
import { ApiError, getBearerToken, parseBody, withApi } from "../../server/http.js";
import { signReadUrlSchema } from "../../server/schemas.js";
import { createSupabaseAdmin } from "../../server/supabaseAdmin.js";

export default withApi(async (req, res) => {
  const admin = createSupabaseAdmin();
  const user = await requireUser(admin, getBearerToken(req));
  const input = signReadUrlSchema.parse(parseBody(req));

  if (!input.path.startsWith(`${user.id}/`)) {
    throw new ApiError(403, "media_forbidden", "You can only sign media in your own storage folder.");
  }

  const { data, error } = await admin.storage
    .from(input.bucket)
    .createSignedUrl(input.path, input.expiresIn ?? 3600);

  if (error || !data) {
    throw new ApiError(500, "signed_read_failed", error?.message ?? "Unable to sign media.");
  }

  res.status(200).json({ signedUrl: data.signedUrl, expiresIn: input.expiresIn ?? 3600 });
}, ["POST"]);
