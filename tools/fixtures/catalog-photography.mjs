/** Replace only a matched product's photography, preserving every catalog identity. */
export function mergeCatalogPhotography(archive, references) {
  const replacements = new Map(references.filter(item => item.replacesProductId).map(item => [item.replacesProductId, item]));
  return [...references.filter(item => !item.replacesProductId), ...archive].map(item => {
    const replacement = replacements.get(item.id);
    if (!replacement) return item;
    return {
      ...item,
      photos: replacement.photos,
      coverPhoto: replacement.photos[0],
      count: replacement.photos.length,
      sourceUrl: replacement.sourceUrl,
      sourceImageUrl: replacement.sourceImageUrl,
      photoSourceName: replacement.photoSourceName || 'StockX',
    };
  });
}
