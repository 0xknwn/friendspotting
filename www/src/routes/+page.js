// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const out = await fetch('https://api.fren.bond/top50/today');
	const top50 = await out.json();
	return {
		top50
	};
}
