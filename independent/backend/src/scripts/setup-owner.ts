import type { ExecArgs } from "@medusajs/framework/types";
import { Modules, FeatureFlag } from "@medusajs/framework/utils";
export default async function setup({ container }: ExecArgs) {
  const email = process.env.STRYDE_ADMIN_EMAIL?.trim();
  const password = process.env.STRYDE_ADMIN_PASSWORD;
  if (!email || !email.includes("@") || !password || password.length < 16)
    throw new Error(
      "Use the interactive setup command with an email and a password of at least 16 characters.",
    );
  const users = container.resolve(Modules.USER);
  const auth = container.resolve(Modules.AUTH);
  const existing = await users.listUsers({ email });
  if (existing.length)
    throw new Error(
      "This administrator already exists. No password or permissions were changed.",
    );
  const roles = FeatureFlag.isFeatureEnabled("rbac")
    ? ["role_super_admin"]
    : [];
  const { authIdentity, error } = await auth.register("emailpass", {
    body: { email, password },
  });
  if (error || !authIdentity)
    throw new Error("Administrator authentication could not be registered.");
  const workflow = container.resolve(Modules.WORKFLOW_ENGINE);
  try {
    const { result } = await workflow.run("create-users-workflow", {
      input: {
        users: [
          {
            email,
            roles,
            metadata: {
              stryde_catalog_manager: true,
              ...(process.env.STRYDE_QA_ADMIN === "true"
                ? { development_qa: true }
                : {}),
            },
          },
        ],
      },
    });
    await auth.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: { user_id: result[0].id },
    });
  } catch (error) {
    await auth.deleteAuthIdentities([authIdentity.id]);
    throw error;
  }
  console.log(
    "Administrator created with STRYDE catalog-manager access. Sign in through Medusa Admin.",
  );
}
