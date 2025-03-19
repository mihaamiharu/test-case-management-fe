<script lang="ts">
  import { onMount } from 'svelte';
  import { testCaseService, projectService, testSuiteService, tagService } from '$lib/services/api';
  import type { TestCase, Project, TestSuite, Tag } from '$lib/types/api';
  import { goto } from '$app/navigation';

  let testCases: TestCase[] = [];
  let projects: Project[] = [];
  let testSuites: TestSuite[] = [];
  let tags: Tag[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;
  let newTestCase = {
    title: '',
    description: '',
    priority: 'medium' as const,
    status: 'draft' as const,
    suite_id: 0,
    project_id: 0,
    preconditions: '',
    steps: [],
    tag_ids: [] as number[]
  };

  onMount(async () => {
    try {
      [testCases, projects, testSuites, tags] = await Promise.all([
        testCaseService.getAll(),
        projectService.getAll(),
        testSuiteService.getAll(),
        tagService.getAll()
      ]);
    } catch (e) {
      error = 'Failed to load test cases';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleCreateTestCase() {
    try {
      const testCaseToCreate = {
        ...newTestCase,
        tags: newTestCase.tag_ids.map(id => tags.find(t => t.id === id)).filter((t): t is Tag => t !== undefined)
      };
      const created = await testCaseService.create(testCaseToCreate);
      testCases = [...testCases, created];
      showCreateForm = false;
      newTestCase = {
        title: '',
        description: '',
        priority: 'medium',
        status: 'draft',
        suite_id: 0,
        project_id: 0,
        preconditions: '',
        steps: [],
        tag_ids: []
      };
    } catch (e) {
      error = 'Failed to create test case';
      console.error(e);
    }
  }

  async function handleDeleteTestCase(id: number) {
    if (!confirm('Are you sure you want to delete this test case?')) return;
    
    try {
      await testCaseService.delete(id);
      testCases = testCases.filter(t => t.id !== id);
    } catch (e) {
      error = 'Failed to delete test case';
      console.error(e);
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Test Cases</h1>
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      on:click={() => showCreateForm = !showCreateForm}
    >
      {showCreateForm ? 'Cancel' : 'New Test Case'}
    </button>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  {#if showCreateForm}
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Create New Test Case</h2>
      <form on:submit|preventDefault={handleCreateTestCase} class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            bind:value={newTestCase.title}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            bind:value={newTestCase.description}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
          ></textarea>
        </div>
        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
          <select
            id="priority"
            bind:value={newTestCase.priority}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            bind:value={newTestCase.status}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label for="project_id" class="block text-sm font-medium text-gray-700">Project</label>
          <select
            id="project_id"
            bind:value={newTestCase.project_id}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a project</option>
            {#each projects as project}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="suite_id" class="block text-sm font-medium text-gray-700">Test Suite</label>
          <select
            id="suite_id"
            bind:value={newTestCase.suite_id}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a test suite</option>
            {#each testSuites as suite}
              <option value={suite.id}>{suite.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="preconditions" class="block text-sm font-medium text-gray-700">Preconditions</label>
          <textarea
            id="preconditions"
            bind:value={newTestCase.preconditions}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div class="flex flex-wrap gap-2">
            {#each tags as tag}
              <label class="inline-flex items-center">
                <input
                  type="checkbox"
                  value={tag.id}
                  bind:group={newTestCase.tag_ids}
                  class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span class="ml-2">{tag.name}</span>
              </label>
            {/each}
          </div>
        </div>
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Test Case
        </button>
      </form>
    </div>
  {/if}

  {#if loading}
    <div class="text-center">Loading...</div>
  {:else if testCases.length === 0}
    <div class="text-center text-gray-500">No test cases found</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each testCases as testCase}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-2">{testCase.title}</h2>
          <p class="text-gray-600 mb-4">{testCase.description}</p>
          <div class="flex space-x-2 mb-4">
            <span class="px-2 py-1 rounded-full text-sm {getPriorityColor(testCase.priority)}">
              {testCase.priority}
            </span>
            <span class="px-2 py-1 rounded-full text-sm {getStatusColor(testCase.status)}">
              {testCase.status}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <button
              class="text-blue-500 hover:text-blue-600"
              on:click={() => goto(`/test-cases/${testCase.id}`)}
            >
              View Details
            </button>
            <button
              class="text-red-500 hover:text-red-600"
              on:click={() => handleDeleteTestCase(testCase.id)}
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div> 