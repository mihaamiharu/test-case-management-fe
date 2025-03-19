<script lang="ts">
  import { onMount } from 'svelte';
  import { projectService } from '$lib/services/api';
  import type { Project } from '$lib/types/api';
  import { goto } from '$app/navigation';

  let projects: Project[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;
  let newProject = {
    name: '',
    description: ''
  };

  onMount(async () => {
    try {
      projects = await projectService.getAll();
    } catch (e) {
      error = 'Failed to load projects';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleCreateProject() {
    try {
      const created = await projectService.create(newProject);
      projects = [...projects, created];
      showCreateForm = false;
      newProject = { name: '', description: '' };
    } catch (e) {
      error = 'Failed to create project';
      console.error(e);
    }
  }

  async function handleDeleteProject(id: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await projectService.delete(id);
      projects = projects.filter(p => p.id !== id);
    } catch (e) {
      error = 'Failed to delete project';
      console.error(e);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Projects</h1>
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      on:click={() => showCreateForm = !showCreateForm}
    >
      {showCreateForm ? 'Cancel' : 'New Project'}
    </button>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  {#if showCreateForm}
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Create New Project</h2>
      <form on:submit|preventDefault={handleCreateProject} class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            bind:value={newProject.name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            bind:value={newProject.description}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
          ></textarea>
        </div>
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Project
        </button>
      </form>
    </div>
  {/if}

  {#if loading}
    <div class="text-center">Loading...</div>
  {:else if projects.length === 0}
    <div class="text-center text-gray-500">No projects found</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each projects as project}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-2">{project.name}</h2>
          <p class="text-gray-600 mb-4">{project.description}</p>
          <div class="flex justify-between items-center">
            <button
              class="text-blue-500 hover:text-blue-600"
              on:click={() => goto(`/projects/${project.id}`)}
            >
              View Details
            </button>
            <button
              class="text-red-500 hover:text-red-600"
              on:click={() => handleDeleteProject(project.id)}
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div> 