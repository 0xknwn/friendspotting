<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>top traders of the day</h1>
	<ul>
		{#each data.top50 as { traderAddress, realized, potential }, i}
			<li>
				{i + 1}: {traderAddress} ({realized} and {potential})
			</li>
		{/each}
	</ul>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
