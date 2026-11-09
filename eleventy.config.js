import markdownIt from "markdown-it";

const md = markdownIt({ html: true, typographer: true });

export default function (config) {
  config.addPassthroughCopy("content/assets");
  config.addPassthroughCopy("content/img");

  // Markdown inside front matter fields (section text, card text, item text…)
  config.addFilter("md", (s) => (s ? md.render(String(s)) : ""));

  // Every page except Home is a node in the graph, sorted by `order`.
  config.addCollection("nav", (api) =>
    api
      .getAll()
      .filter((p) => p.url && p.url !== "/" && !p.data.hidden)
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  );

  return {
    dir: { input: "content", includes: "_layouts", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
  };
}
