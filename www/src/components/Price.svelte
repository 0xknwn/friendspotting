<script lang="ts">
  export let price: number;
  function round(value: number, decimals: number) {
    return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
  }
</script>

<div>
  <span class="text-2xl font-extrabold text-gray-600">{round(price, 2)}</span>
</div>
