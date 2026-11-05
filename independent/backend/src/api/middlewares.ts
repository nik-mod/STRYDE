import { defineMiddlewares, authenticate } from "@medusajs/framework/http";
import { publicationGuard } from "../lib/product-publication";
import { adminMediaGuard } from "../lib/admin-media-guard";
// The public Store API is reachable independently of Next. Guard it here too.
// No environment flag can activate unimplemented live payments.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/stryde/*",
      middlewares: [
        authenticate("user", ["session", "bearer"]),
        async (req, res, next) => {
          const user = await req.scope
            .resolve("user")
            .retrieveUser((req as any).auth_context.actor_id);
          if (user.metadata?.stryde_catalog_manager !== true) {
            res
              .status(403)
              .json({
                message:
                  "A STRYDE catalog-manager administrator is required. Use the secure owner setup command.",
              });
            return;
          }
          next();
        },
      ],
    },
    {
      matcher: "/admin/stryde/*",
      method: ["POST"],
      bodyParser: { sizeLimit: "18mb" },
      middlewares: [adminMediaGuard],
    },
    {
      matcher: "/admin/products",
      method: ["POST"],
      middlewares: [publicationGuard],
    },
    {
      matcher: "/admin/products/:id",
      method: ["POST"],
      middlewares: [publicationGuard],
    },
    // Publication via CSV/batch would otherwise bypass product-level review.
    {
      matcher: "/admin/products/batch",
      method: ["POST"],
      middlewares: [
        (_req, res) =>
          res
            .status(400)
            .json({
              message:
                "Publish reviewed products individually in STRYDE media review.",
            }),
      ],
    },
    {
      matcher: "/admin/products/import",
      method: ["POST"],
      middlewares: [
        (_req, res) =>
          res
            .status(400)
            .json({
              message:
                "Bulk imports require an explicit reviewed migration. Use draft product creation.",
            }),
      ],
    },
    {
      matcher: "/store/stryde/order-track",
      method: ["POST"],
      bodyParser: { sizeLimit: "1kb" },
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: ["POST"],
      middlewares: [
        (req, res, next) => {
          if (
            process.env.STRYDE_TEST_MODE !== "true" ||
            process.env.NODE_ENV === "production"
          ) {
            res.status(403).json({
              message:
                "Live checkout is unavailable pending merchant and payment-provider approval.",
            });
            return;
          }
          next();
        },
      ],
    },
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      method: ["POST"],
      middlewares: [
        (req, res, next) => {
          const data = req.body as { provider_id?: unknown } | undefined;
          if (
            process.env.STRYDE_TEST_MODE !== "true" ||
            process.env.NODE_ENV === "production" ||
            data?.provider_id !== "pp_system_default"
          ) {
            res.status(403).json({
              message: "Only the local test payment provider is configured.",
            });
            return;
          }
          next();
        },
      ],
    },
  ],
});
