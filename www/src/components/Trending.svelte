<script lang="ts">
  import * as Plot from "@observablehq/plot";
  import * as d3 from "d3";

  let div: HTMLDivElement;
  let data = d3.ticks(-2, 2, 200).map(Math.sin);

  function onMousemove(event: any) {
    const [x, y] = d3.pointer(event);
    data = data.slice(-200).concat(Math.atan2(x, y));
  }

  $: {
    div?.firstChild?.remove(); // remove old chart, if any
    div?.append(Plot.lineY(data).plot({ grid: true, width: div.offsetWidth })); // add the new chart
  }
</script>

<div on:mousemove={onMousemove} bind:this={div} role="img" />
