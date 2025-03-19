<script lang="ts">
  import { isAuthenticated } from '$lib/stores/app';
</script>

<div class="text-center">
  <h1 class="text-4xl font-bold text-gray-900 mb-4">
    Welcome to Test Case Management
  </h1>
  {#if $isAuthenticated}
    <p class="text-lg text-gray-600">
      Start managing your test cases by selecting a project from the navigation menu.
    </p>
  {:else}
    <p class="text-lg text-gray-600">
      Please <a href="/login" class="text-indigo-600 hover:text-indigo-500">login</a> or{' '}
      <a href="/register" class="text-indigo-600 hover:text-indigo-500">register</a> to get started.
    </p>
  {/if}
</div> 