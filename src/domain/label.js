export function createLabelViewModel(item, baseUrl) {
  const itemUrl = `${baseUrl}#item=${encodeURIComponent(item.id)}`;

  return {
    title: item.title,
    subtitle: [item.category, item.condition].filter(Boolean).join(" | "),
    catalogCode: item.catalogCode,
    itemUrl
  };
}
