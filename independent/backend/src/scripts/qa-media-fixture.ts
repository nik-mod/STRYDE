import type { ExecArgs } from "@medusajs/framework/types";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  updateProductsWorkflow,
  deleteProductsWorkflow,
  deleteUsersWorkflow,
} from "@medusajs/medusa/core-flows";
import type CatalogMediaService from "../modules/catalog-media/service";
export default async function qa({ container }: ExecArgs) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.STRYDE_TEST_MODE !== "true"
  )
    throw new Error("QA fixtures are development only.");
  const record = JSON.parse(
    await readFile(
      resolve(process.cwd(), "../.data/product-management-qa.json"),
      "utf8",
    ),
  );
  const product = await container
    .resolve("product")
    .retrieveProduct(record.product_id);
  if (
    product.metadata?.development_fixture !== true ||
    product.metadata?.stryde_qa !== true
  )
    throw new Error("Refusing to change a non-QA product.");
  if (process.env.STRYDE_QA_CLEANUP === "true") {
    await deleteProductsWorkflow(container).run({
      input: { ids: [product.id] },
    });
    const users = await container.resolve("user").listUsers({}, { take: 1000 });
    for (const user of users.filter(
      (u) =>
        u.metadata?.development_qa === true &&
        /^qa-.*@stryde\.invalid$/.test(u.email),
    )) {
      const auth = container.resolve("auth");
      const identities = await auth.listAuthIdentities({
        app_metadata: { user_id: user.id },
      } as any);
      await deleteUsersWorkflow(container).run({ input: { ids: [user.id] } });
      if (identities.length)
        await auth.deleteAuthIdentities(identities.map((i) => i.id));
    }
    const media = container.resolve<CatalogMediaService>("catalog_media");
    const entries = await media.listCatalogMedias({ product_id: product.id });
    const files = entries.flatMap((e) => (e.details as any).file_ids || []);
    if (files.length) await container.resolve("file").deleteFiles(files);
    if (entries.length)
      await media.deleteCatalogMedias(entries.map((e) => e.id));
    console.log(
      "Only the labeled QA product, QA media and temporary QA administrator were removed.",
    );
  } else {
    // Trusted seed path only, for technical media delivery checks. This is not
    // commercial publication and cannot pass production storefront policy.
    await updateProductsWorkflow(container).run({
      input: { selector: { id: product.id }, update: { status: "published" } },
    });
    console.log(
      "Labeled QA fixture available in development only for browser checks.",
    );
  }
}
