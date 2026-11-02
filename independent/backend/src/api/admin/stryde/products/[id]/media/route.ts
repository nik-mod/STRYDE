import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import {
  uploadFilesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { randomUUID } from "node:crypto";
import {
  inspectImage,
  imageDerivative,
} from "../../../../../../lib/media-image";
import {
  mediaIssues,
  stockxReference,
} from "../../../../../../lib/media-policy";
import type CatalogMediaService from "../../../../../../modules/catalog-media/service";
const identity = z
  .object({
    brand: z.string().trim().max(120),
    model: z.string().trim().max(200),
    style_code: z.string().trim().max(120),
    colorway: z.string().trim().max(200),
    stockx_product_id: z.string().trim().max(200),
    stockx_url: z.string().max(1000),
  })
  .strict();
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("identity"), identity }).strict(),
  z
    .object({
      action: z.literal("upload"),
      content: z.string().max(17 * 1024 * 1024),
      source: z.enum(["stockx", "technical_test"]).default("stockx"),
      source_url: z.string().max(1000),
      license_reference: z.string().trim().min(3).max(1000),
      attribution: z.string().max(1000),
      rights_confirmed: z.literal(true),
      exact_match_confirmed: z.literal(true),
      markings_preserved: z.literal(true),
      studio_background_confirmed: z.literal(true),
      optimize_permitted: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("save"),
      ids: z.array(z.string().max(100)).max(20),
      identity_verified: z.boolean(),
      sale_permitted: z.boolean(),
      visible: z.boolean(),
      publish: z.boolean(),
    })
    .strict(),
  z.object({ action: z.literal("remove"), id: z.string().max(100) }).strict(),
  z.object({ action: z.literal("archive") }).strict(),
]);
async function state(req: AuthenticatedMedusaRequest) {
  const p = await req.scope
    .resolve("product")
    .retrieveProduct(req.params.id, { relations: ["images"] });
  const records = await req.scope
    .resolve<CatalogMediaService>("catalog_media")
    .listCatalogMedias({ product_id: p.id }, { order: { created_at: "ASC" } });
  return { product: p, records };
}
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const s = await state(req);
  res.json({
    ...s,
    issues: mediaIssues(s.product, s.records),
    stockx: {
      configured:
        !!process.env.STOCKX_API_KEY && !!process.env.STOCKX_ACCESS_TOKEN,
      images_available: false,
      message:
        "No authorized StockX image feed is configured. Use the manual upload only with an explicit commercial image-use grant.",
    },
  });
}
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const parsed = input.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        message: "Check the media fields, confirmations and maximum file size.",
      });
    return;
  }
  const value = parsed.data;
  const { product, records } = await state(req);
  const update = async (data: any) =>
    updateProductsWorkflow(req.scope).run({
      input: { selector: { id: product.id }, update: data },
    });
  if (value.action === "identity") {
    // Identity edits invalidate previous publication until matching media is reviewed.
    await update({
      metadata: {
        ...product.metadata,
        stryde_identity: value.identity,
        commerce_approved: false,
      },
      ...(product.metadata?.development_fixture ? {} : { status: "draft" }),
    });
  } else if (value.action === "upload") {
    const match = product.metadata?.stryde_identity as any;
    const technical =
      value.source === "technical_test" &&
      process.env.STRYDE_TEST_MODE === "true" &&
      process.env.NODE_ENV !== "production" &&
      product.metadata?.development_fixture === true;
    if (
      !technical &&
      (!match ||
        Object.values(match).some((v) => !v) ||
        !stockxReference(match.stockx_url) ||
        !stockxReference(value.source_url))
    ) {
      res
        .status(400)
        .json({
          message:
            "Save the exact StockX identity and a valid StockX source reference before uploading.",
        });
      return;
    }
    if (value.source === "technical_test" && !technical) {
      res
        .status(403)
        .json({
          message:
            "Technical media is restricted to explicit development fixtures.",
        });
      return;
    }
    if (records.filter((r) => !(r.details as any)?.removed_at).length >= 40) {
      res
        .status(400)
        .json({
          message: "Remove unused media before adding more than 40 files.",
        });
      return;
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value.content)) {
      res.status(400).json({ message: "Invalid image encoding." });
      return;
    }
    const buffer = Buffer.from(value.content, "base64");
    let info;
    try {
      info = await inspectImage(buffer);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    if (
      records.some(
        (r) => r.sha256 === info.sha256 && !(r.details as any)?.removed_at,
      )
    ) {
      res
        .status(409)
        .json({
          message: "This exact photograph is already in the media library.",
        });
      return;
    }
    const key = randomUUID();
    const files: any[] = [
      {
        filename: `${key}-original.${info.format === "jpeg" ? "jpg" : info.format}`,
        mimeType: `image/${info.format}`,
        content: buffer.toString("base64"),
        access: "public",
      },
    ];
    if (value.optimize_permitted)
      for (const width of [360, 720, 1440])
        files.push({
          filename: `${key}-${width}.webp`,
          mimeType: "image/webp",
          content: (await imageDerivative(buffer, width)).toString("base64"),
          access: "public",
        });
    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: { files },
    });
    await req.scope
      .resolve<CatalogMediaService>("catalog_media")
      .createCatalogMedias({
        product_id: product.id,
        url: result[result.length - 1].url,
        original_url: result[0].url,
        sha256: info.sha256,
        width: info.width,
        height: info.height,
        details: {
          ...match,
          product_id: match?.stockx_product_id || "",
          source: value.source,
          source_url: value.source_url,
          license_reference: value.license_reference,
          attribution: value.attribution,
          rights_confirmed: !technical && value.rights_confirmed,
          exact_match_confirmed: !technical && value.exact_match_confirmed,
          markings_preserved: value.markings_preserved,
          studio_background_confirmed: value.studio_background_confirmed,
          license_status: technical ? "technical_test" : "owner_attested",
          match_status: technical ? "technical_test" : "owner_confirmed",
          imported_at: new Date().toISOString(),
          uploaded_by: req.auth_context.actor_id,
          optimized: value.optimize_permitted,
          variants: result
            .slice(1)
            .map((f, i) => ({
              url: f.url,
              width: Math.min([360, 720, 1440][i], info.width),
            })),
          file_ids: result.map((f) => f.id),
        },
      });
  } else if (value.action === "archive") {
    await update({
      status: "draft",
      metadata: {
        ...product.metadata,
        commerce_approved: false,
        stryde_archived: true,
      },
    });
  } else if (value.action === "remove") {
    const record = records.find((r) => r.id === value.id);
    if (!record) {
      res.status(404).json({ message: "Media not found on this product." });
      return;
    }
    await req.scope
      .resolve<CatalogMediaService>("catalog_media")
      .updateCatalogMedias({
        id: record.id,
        details: {
          ...(record.details as any),
          removed_at: new Date().toISOString(),
        },
      });
    const images = product.images.filter((i) => i.url !== record.url);
    await update({
      images: images.map((i) => ({ url: i.url })),
      thumbnail: images[0]?.url || null,
      status: "draft",
      metadata: {
        ...product.metadata,
        commerce_approved: false,
        stryde_media: null,
      },
    });
  } else {
    if (new Set(value.ids).size !== value.ids.length) {
      res
        .status(400)
        .json({ message: "Each gallery image can be selected only once." });
      return;
    }
    const selected = value.ids.map((id) =>
      records.find((r) => r.id === id && !(r.details as any)?.removed_at),
    );
    if (selected.some((r) => !r)) {
      res
        .status(400)
        .json({ message: "Select media belonging to this product." });
      return;
    }
    const metadata: any = {
      ...product.metadata,
      identity_verified: value.identity_verified,
      sale_permitted: value.sale_permitted,
      commerce_approved: value.visible,
      stryde_archived: false,
    };
    const images = selected.map((r) => ({ url: r!.url }));
    const effective = {
      ...product,
      images,
      thumbnail: images[0]?.url || null,
      metadata,
    };
    const issues = mediaIssues(effective, records);
    if ((value.publish || value.visible) && issues.length) {
      res.status(400).json({ message: issues.join(" ") });
      return;
    }
    metadata.stryde_media = {
      version: 1,
      approved: issues.length === 0,
      reviewed_at: new Date().toISOString(),
      images: selected.map((r) => {
        const d = r!.details as any;
        return {
          url: r!.url,
          original_url: r!.original_url,
          source: d.source,
          source_product_id: d.product_id,
          source_url: d.source_url,
          style_code: d.style_code,
          width: r!.width,
          height: r!.height,
          sha256: r!.sha256,
          license_status: d.license_status,
          match_status: d.match_status,
          attribution: d.attribution,
          variants: d.variants,
        };
      }),
    };
    await update({
      images,
      thumbnail: effective.thumbnail,
      metadata,
      status: value.publish ? "published" : "draft",
    });
  }
  const s = await state(req);
  res.json({ ...s, issues: mediaIssues(s.product, s.records) });
}
