<script lang="ts">
  import { image } from "@observablehq/plot";
  import Jazzicon from "../components/Jazzicon.svelte";
  import Price from "../components/Price.svelte";
  import Trending from "../components/Trending.svelte";
  export let data;

  function shortAddress(address: string) {
    return address.slice(0, 6) + "&mldr;" + address.slice(-4);
  }
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="system" />
</svelte:head>

<div class="bg-white shadow-md rounded-md overflow-hidden max-w-lg min-w-lg mx-auto mt-16 min-w-full">
  <div class="bg-gray-100 py-2 px-4">
    <h2 class="text-xl font-semibold text-gray-800">top traders of the day</h2>
  </div>
  <ul class="divide-y divide-gray-200">
    {#each data.top50 as { picture, realized, potential, traderAddress }}
      <li class="flex items-center py-4 px-6">
        <div class="flex flex-col items-center mr-8">
          <div class="h-18 mx-auto px-auto">
            {#if picture}
              <img src={picture} alt={traderAddress} />
            {:else}
              <Jazzicon address={traderAddress} size={64} />
            {/if}
          </div>
          <a href="https://www.friend.tech/trades/{traderAddress}">
            {@html shortAddress(traderAddress)}
          </a>
        </div>
        <div class="flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2" />
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
            <Price price={realized} />
            <div class="text-xl font-extrabold text-gray-300">ETH</div>
            <Price price={potential} />
          </div>
        </div>
      </li>
    {/each}
  </ul>
</div>

<div class="bg-white shadow-md rounded-md overflow-hidden max-w-lg min-w-lg mx-auto mt-16 min-w-full">
  <div class="bg-gray-100 py-2 px-4">
    <h2 class="text-xl font-semibold text-gray-800">today trending</h2>
  </div>
  <Trending />
</div>

<style lang="postcss">
</style>
