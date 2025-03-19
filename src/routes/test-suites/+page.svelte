<script lang="ts">
  import { onMount } from 'svelte';
  import { testSuiteService, projectService } from '$lib/services/api';
  import type { TestSuite, Project } from '$lib/types/api';
  import { goto } from '$app/navigation';

  let testSuites: TestSuite[] = [];
  let projects: Project[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;
  let newSuite = {
    name: '',
    description: '',
    project_id: 0
  };

  // Group test suites by project
  $: suitesByProject = projects.reduce((acc, project) => {
    acc[project.id] = {
      project,
      suites: testSuites.filter(suite => suite.project_id === project.id)
    };
    return acc;
  }, {} as Record<number, { project: Project; suites: TestSuite[] }>);

  onMount(async () => {
    try {
      [testSuites, projects] = await Promise.all([
        testSuiteService.getAll(),
        projectService.getAll()
      ]);
    } catch (e) {
      error = 'Failed to load test suites';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleCreateSuite() {
    try {
      const created = await testSuiteService.create(newSuite);
      testSuites = [...testSuites, created];
      showCreateForm = false;
      newSuite = { name: '', description: '', project_id: 0 };
    } catch (e) {
      error = 'Failed to create test suite';
      console.error(e);
    }
  }

  async function handleDeleteSuite(id: number) {
    if (!confirm('Are you sure you want to delete this test suite?')) return;
    
    try {
      await testSuiteService.delete(id);
      testSuites = testSuites.filter(s => s.id !== id);
    } catch (e) {
      error = 'Failed to delete test suite';
      console.error(e);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Test Suites</h1>
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      on:click={() => showCreateForm = !showCreateForm}
    >
      {showCreateForm ? 'Cancel' : 'New Test Suite'}
    </button>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  {#if showCreateForm}
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Create New Test Suite</h2>
      <form on:submit|preventDefault={handleCreateSuite} class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            bind:value={newSuite.name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            bind:value={newSuite.description}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
          ></textarea>
        </div>
        <div>
          <label for="project_id" class="block text-sm font-medium text-gray-700">Project</label>
          <select
            id="project_id"
            bind:value={newSuite.project_id}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a project</option>
            {#each projects as project}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Test Suite
        </button>
      </form>
    </div>
  {/if}

  {#if loading}
    <div class="text-center">Loading...</div>
  {:else if testSuites.length === 0}
    <div class="text-center text-gray-500">No test suites found</div>
  {:else}
    <div class="space-y-6">
      {#each Object.values(suitesByProject) as { project, suites }}
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h2 class="text-lg font-semibold text-gray-900">{project.name}</h2>
            </div>
          </div>
          <div class="divide-y divide-gray-200">
            {#each suites as suite}
              <div class="p-4 hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <h3 class="text-sm font-medium text-gray-900">{suite.name}</h3>
                      {#if suite.description}
                        <p class="text-sm text-gray-500 mt-1">{suite.description}</p>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      class="text-blue-500 hover:text-blue-600"
                      on:click={() => goto(`/test-suites/${suite.id}`)}
                    >
                      View Details
                    </button>
                    <button
                      class="text-red-500 hover:text-red-600"
                      on:click={() => handleDeleteSuite(suite.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div> 