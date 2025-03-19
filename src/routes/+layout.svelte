<script lang="ts">
  import '../app.css';
  import Layout from '$lib/components/Layout.svelte';
  import { isAuthenticated } from '$lib/stores/app';
</script>

<Layout>
  <slot />
</Layout> 