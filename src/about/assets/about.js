import { codeToHtml } from "shiki";

document.querySelectorAll("[data-shiki]").forEach(async (element) => {
	const code = element.textContent
		.trim()
		.split("\n")
		.map((line) => line.trim())
		.join("\n");

	const language = element.attributes.getNamedItem("data-shiki")?.value;
	if (!language) return;

	const html = await codeToHtml(code, { lang: language, theme: "catppuccin-macchiato" });
	element.innerHTML = html;
});
