<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { projectService, testSuiteService } from '$lib/services/api';
  import type { Project, TestSuite } from '$lib/types/api';
  import { goto } from '$app/navigation';

  let project: Project | null = null;
  let testSuites: TestSuite[] = [];
  let loading = true;
  let error: string | null = null;
  let showEditForm = false;
  let editedProject = {
    name: '',
    description: ''
  };

  onMount(async () => {
    const projectId = parseInt($page.params.id);
    try {
      [project, testSuites] = await Promise.all([
        projectService.getById(projectId),
        testSuiteService.getByProject(projectId)
      ]);
      editedProject = {
        name: project.name,
        description: project.description
      };
    } catch (e) {
      error = 'Failed to load project details';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleUpdateProject() {
    if (!project) return;
    
    try {
      const updated = await projectService.update(project.id, editedProject);
      project = updated;
      showEditForm = false;
    } catch (e) {
      error = 'Failed to update project';
      console.error(e);
    }
  }

  async function handleDeleteProject() {
    if (!project || !confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await projectService.delete(project.id);
      goto('/projects');
    } catch (e) {
      error = 'Failed to delete project';
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
  {:else if project}
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">{project.name}</h1>
        <div class="space-x-2">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            on:click={() => showEditForm = !showEditForm}
          >
            {showEditForm ? 'Cancel' : 'Edit Project'}
          </button>
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            on:click={handleDeleteProject}
          >
            Delete Project
          </button>
        </div>
      </div>

      {#if showEditForm}
        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 class="text-xl font-semibold mb-4">Edit Project</h2>
          <form on:submit|preventDefault={handleUpdateProject} class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                bind:value={editedProject.name}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                bind:value={editedProject.description}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>
            <button
              type="submit"
              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Update Project
            </button>
          </form>
        </div>
      {:else}
        <p class="text-gray-600">{project.description}</p>
      {/if}
    </div>

    <div>
      <h2 class="text-xl font-bold mb-4">Test Suites</h2>
      {#if testSuites.length === 0}
        <p class="text-gray-500">No test suites found for this project</p>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each testSuites as suite}
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h3 class="text-lg font-semibold mb-2">{suite.name}</h3>
              <p class="text-gray-600 mb-4">{suite.description}</p>
              <button
                class="text-blue-500 hover:text-blue-600"
                on:click={() => goto(`/test-suites/${suite.id}`)}
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