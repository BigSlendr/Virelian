async function includePartials() {
	const includeEls = document.querySelectorAll("[data-include]");
	for (const el of includeEls) {
		const file = el.getAttribute("data-include");
		try {
			const res = await fetch(file, { cache: "no-cache" });
			if (!res.ok) throw new Error(`Failed to fetch ${file}`);
			el.innerHTML = await res.text();
		} catch (err) {
			console.error(err);
			el.innerHTML = "";
		}
	}
}
document.addEventListener("DOMContentLoaded", includePartials);

