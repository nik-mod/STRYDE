import {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";
import { mediaIssues } from "./media-policy";
import type CatalogMediaService from "../modules/catalog-media/service";
// Native Admin mutations must respect the same gate as the media widget.
export async function publicationGuard(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  try {
    const input = req.body as any;
    const service = req.scope.resolve("product");
    const old = req.params.id
      ? await service.retrieveProduct(req.params.id, { relations: ["images"] })
      : null;
    if (
      old?.metadata?.development_fixture &&
      input.metadata &&
      Object.hasOwn(input.metadata, "development_fixture") &&
      input.metadata.development_fixture !== true
    )
      return res
        .status(400)
        .json({
          message:
            "Create a separate commercial product; fixture identity cannot be converted into merchandise.",
        });
    const effective = {
      ...old,
      ...input,
      metadata: { ...old?.metadata, ...input.metadata },
    };
    // Existing labeled development fixtures remain usable for tests, but cannot
    // be newly published through Admin or converted to commercial products.
    const existingFixture =
      old?.metadata?.development_fixture &&
      old.status === "published" &&
      input.status === undefined;
    if (effective.status === "published" && !existingFixture) {
      const records = old
        ? await req.scope
            .resolve<CatalogMediaService>("catalog_media")
            .listCatalogMedias({ product_id: old.id })
        : [];
      const issues = mediaIssues(effective, records);
      if (issues.length)
        return res
          .status(400)
          .json({ message: `Publication blocked: ${issues.join(" ")}` });
    }
    // Public metadata never contains private licensing evidence.
    next();
  } catch (error) {
    next(error);
  }
}
