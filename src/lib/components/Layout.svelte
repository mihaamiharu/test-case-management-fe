<script lang="ts">
  import { page } from '$app/stores';
  import { isAuthenticated, user } from '../stores/app';
  import { authService } from '../services/api';
</script>

<div class="min-h-screen bg-gray-100">
  <nav class="bg-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-xl font-bold text-gray-800">Test Case Management</a>
          </div>
          {#if $isAuthenticated}
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href="/projects"
                class="{$page.url.pathname === '/projects' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Projects
              </a>
              <a
                href="/test-suites"
                class="{$page.url.pathname === '/test-suites' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Test Suites
              </a>
              <a
                href="/test-cases"
                class="{$page.url.pathname === '/test-cases' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Test Cases
              </a>
            </div>
          {/if}
        </div>
        <div class="flex items-center">
          {#if $isAuthenticated}
            <div class="flex items-center space-x-4">
              <span class="text-gray-700">{$user?.name}</span>
              <button
                on:click={() => authService.logout()}
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          {:else}
            <div class="flex items-center space-x-4">
              <a
                href="/login"
                class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </a>
              <a
                href="/register"
                class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Register
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <slot />
    </div>
  </main>
</div>

<style>
  /* Add any component-specific styles here */
</style> 