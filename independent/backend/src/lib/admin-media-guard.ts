import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";
const windows = new Map<
  string,
  { until: number; count: number; upload: boolean }
>();
export function adminMediaGuard(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  if (
    req.headers.cookie &&
    !req.headers.authorization &&
    !process.env.ADMIN_CORS?.split(",").includes(req.headers.origin || "")
  ) {
    res
      .status(403)
      .json({ message: "Use the configured Medusa Admin origin." });
    return;
  }
  const actor = (req as any).auth_context?.actor_id;
  if (!actor) {
    res.status(401).json({ message: "Sign in to Medusa Admin." });
    return;
  }
  const now = Date.now();
  for (const [id, value] of windows)
    if (value.until < now && !value.upload) windows.delete(id);
  let value = windows.get(actor);
  if (!value) {
    if (windows.size >= 1000) {
      res.status(429).json({ message: "Please try again shortly." });
      return;
    }
    value = { until: now + 60000, count: 0, upload: false };
    windows.set(actor, value);
  }
  const upload = (req.body as any)?.action === "upload";
  if (++value.count > 60 || (upload && value.upload)) {
    res
      .status(429)
      .json({
        message: "Finish the current upload or wait a minute before retrying.",
      });
    return;
  }
  if (upload) {
    value.upload = true;
    const entry = value;
    res.once("finish", () => {
      entry.upload = false;
    });
    res.once("close", () => {
      entry.upload = false;
    });
  }
  next();
}
