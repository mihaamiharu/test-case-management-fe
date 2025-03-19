<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { testSuiteService, testCaseService } from '$lib/services/api';
  import type { TestSuite, TestCase } from '$lib/types/api';
  import { goto } from '$app/navigation';

  let testSuite: TestSuite | null = null;
  let testCases: TestCase[] = [];
  let loading = true;
  let error: string | null = null;
  let showEditForm = false;
  let editedSuite = {
    name: '',
    description: ''
  };

  onMount(async () => {
    const suiteId = parseInt($page.params.id);
    try {
      [testSuite, testCases] = await Promise.all([
        testSuiteService.getById(suiteId),
        testCaseService.getBySuite(suiteId)
      ]);
      editedSuite = {
        name: testSuite.name,
        description: testSuite.description
      };
    } catch (e) {
      error = 'Failed to load test suite details';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleUpdateSuite() {
    if (!testSuite) return;
    
    try {
      const updated = await testSuiteService.update(testSuite.id, editedSuite);
      testSuite = updated;
      showEditForm = false;
    } catch (e) {
      error = 'Failed to update test suite';
      console.error(e);
    }
  }

  async function handleDeleteSuite() {
    if (!testSuite || !confirm('Are you sure you want to delete this test suite?')) return;
    
    try {
      await testSuiteService.delete(testSuite.id);
      goto('/test-suites');
    } catch (e) {
      error = 'Failed to delete test suite';
      console.error(e);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if loading}
    <div class="text-center">Loading...</div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {:else if testSuite}
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">{testSuite.name}</h1>
        <div class="space-x-2">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            on:click={() => showEditForm = !showEditForm}
          >
            {showEditForm ? 'Cancel' : 'Edit Test Suite'}
          </button>
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            on:click={handleDeleteSuite}
          >
            Delete Test Suite
          </button>
        </div>
      </div>

      {#if showEditForm}
        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 class="text-xl font-semibold mb-4">Edit Test Suite</h2>
          <form on:submit|preventDefault={handleUpdateSuite} class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                bind:value={editedSuite.name}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                bind:value={editedSuite.description}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>
            <button
              type="submit"
              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Update Test Suite
            </button>
          </form>
        </div>
      {:else}
        <p class="text-gray-600">{testSuite.description}</p>
      {/if}
    </div>

    <div>
      <h2 class="text-xl font-bold mb-4">Test Cases</h2>
      {#if testCases.length === 0}
        <p class="text-gray-500">No test cases found in this test suite</p>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each testCases as testCase}
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h3 class="text-lg font-semibold mb-2">{testCase.title}</h3>
              <p class="text-gray-600 mb-4">{testCase.description}</p>
              <button
                class="text-blue-500 hover:text-blue-600"
                on:click={() => goto(`/test-cases/${testCase.id}`)}
              >
                View Details
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div> 