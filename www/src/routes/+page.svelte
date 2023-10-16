<script lang="ts">
  import Jazzicon from "../components/Jazzicon.svelte";
  export let data;
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="system" />
</svelte:head>

<div class="bg-white shadow-md rounded-md overflow-hidden max-w-lg mx-auto mt-16">
  <div class="bg-gray-100 py-2 px-4">
    <h2 class="text-xl font-semibold text-gray-800">top traders of the day</h2>
  </div>
  <ul class="divide-y divide-gray-200">
    {#each data.top50 as { traderAddress, realized, potential }, i}
      <li class="flex items-center py-4 px-6">
        <div class="w-24 h-24 mr-4 mt-6">
          <Jazzicon address={traderAddress} size={64} />
        </div>
        <div class="flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {traderAddress}
            </dt>
            <dd class="flex items-center mb-3">
              <div class="w-full bg-gray-200 rounded h-2.5 dark:bg-gray-700 mr-2">
                <div
                  class="bg-blue-600 h-2.5 rounded dark:bg-blue-500"
                  style="width:{(realized * 100) / (realized + potential)}%"
                />
              </div>
            </dd>
          </dl>
          <div class="flex flex-row justify-between">
            <div class="">{realized}</div>
            <div class="">{potential}</div>
          </div>
        </div>
      </li>
    {/each}
  </ul>
</div>

<style lang="postcss">
</style>
