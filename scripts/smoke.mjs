import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || process.argv[2] || "http://127.0.0.1:3000";
const pages = [
  ["/", "DIGITAL,"],
  ["/work/void-audio", "VOID"],
  ["/work/forma-objects", "FORMA"],
  ["/work/synapse-lab", "SYNAPSE"],
  ["/privacy", "Project inquiries"],
  ["/robots.txt", "User-Agent"],
  ["/sitemap.xml", "urlset"],
];
for (const [path, expected] of pages) {
  const res = await fetch(base + path);
  assert.equal(res.status, 200, path);
  const html = await res.text();
  assert.ok(html.toLowerCase().includes(expected.toLowerCase()), path + " content");
  if (path === "/") {
    assert.ok(!html.includes("fonts.googleapis.com"), "No remote blocking font request");
    assert.ok(html.includes("wordmark-glyph"), "Original wordmark is server-rendered");
    assert.ok(html.includes("Letterform") && html.includes("Orbit"), "Particle modes have accessible controls");
    const preload = html + (res.headers.get("link") || "");
    const fonts = [...preload.matchAll(/["<]([^"<> ]+\.ttf)[">]/g)];
    assert.ok(fonts.length > 0, "Local font is preloaded");
    for (const [, url] of fonts) assert.equal((await fetch(new URL(url, base))).status, 200);
  }
  console.log("PASS", path);
}
for (const name of ["void", "void-detail", "forma", "forma-detail", "synapse", "synapse-detail"]) {
  const res = await fetch(base + "/projects/" + name + ".svg");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /svg/);
}
const og = await fetch(base + "/opengraph-image");
assert.equal(og.status, 200);
assert.match(og.headers.get("content-type") || "", /image\/png/);
for (const slug of ["void-audio", "forma-objects", "synapse-lab"]) {
  const image = await fetch(base + "/work/" + slug + "/opengraph-image");
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type") || "", /image\/png/);
}
const missing = await fetch(base + "/work/not-a-real-project");
assert.equal(missing.status, 404);
const rejected = await fetch(base + "/api/contact", {
  method: "POST",
  headers: { Origin: "https://invalid-origin.example", "Content-Type": "application/json" },
  body: "{}",
});
assert.equal(rejected.status, 403);
assert.equal((await rejected.json()).ok, false);
console.log("PASS 6 assets, 4 Open Graph images, 404 and rejected contact origin");
console.log("HTTP smoke checks passed. No inquiry was delivered.");
