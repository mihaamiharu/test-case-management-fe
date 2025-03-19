<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { testCaseService, testSuiteService, projectService, tagService, testStepService, stepAttachmentService } from '$lib/services/api';
  import type { TestCase, TestSuite, Project, Tag, TestStep, StepAttachment } from '$lib/types/api';
  import { goto } from '$app/navigation';

  let testCase: TestCase | null = null;
  let testSuite: TestSuite | null = null;
  let project: Project | null = null;
  let loading = true;
  let error: string | null = null;
  let showEditForm = false;
  let showAddStepForm = false;
  let editingStep: TestStep | null = null;
  let draggedStep: TestStep | null = null;
  let draggedOverStep: TestStep | null = null;
  let uploadingForStep: number | null = null;
  let fileInputs: {[key: number]: HTMLInputElement} = {};
  let fileTypeInput = '';
  let newStep = {
    step_type: 'given' as TestStep['step_type'],
    description: '',
    expected_result: ''
  };

  let editedTestCase = {
    title: '',
    description: '',
    priority: 'medium' as TestCase['priority'],
    status: 'draft' as TestCase['status'],
    suite_id: 0,
    project_id: 0,
    preconditions: '',
    steps: [] as TestCase['steps'],
    tag_ids: [] as number[]
  };

  // Add state for image preview
  let previewImage: { src: string, alt: string } | null = null;

  onMount(async () => {
    const testCaseId = parseInt($page.params.id);
    try {
      console.log('Fetching test case with ID:', testCaseId);
      testCase = await testCaseService.getById(testCaseId);
      console.log('Received test case:', testCase);
      
      // Check if testCase is valid
      if (!testCase || typeof testCase !== 'object') {
        throw new Error('Invalid test case data received');
      }
      
      // Ensure steps is always an array
      if (!Array.isArray(testCase.steps)) {
        console.warn('Steps is not an array, initializing as empty array');
        testCase.steps = [];
      }
      
      // Ensure tags is always an array
      if (!Array.isArray(testCase.tags)) {
        console.warn('Tags is not an array, initializing as empty array');
        testCase.tags = [];
      }
      
      [testSuite, project] = await Promise.all([
        testSuiteService.getById(testCase.suite_id),
        projectService.getById(testCase.project_id)
      ]);
      console.log('Received test suite:', testSuite);
      console.log('Received project:', project);
      
      editedTestCase = {
        title: testCase.title || '',
        description: testCase.description || '',
        priority: testCase.priority || 'medium',
        status: testCase.status || 'draft',
        suite_id: testCase.suite_id,
        project_id: testCase.project_id,
        preconditions: testCase.preconditions || '',
        steps: testCase.steps || [],
        tag_ids: (testCase.tags || []).map(tag => tag.id)
      };
    } catch (e) {
      error = 'Failed to load test case details';
      console.error('Error loading test case:', e);
    } finally {
      loading = false;
    }
  });

  async function handleUpdateTestCase() {
    if (!testCase) return;
    
    try {
      const testCaseToUpdate = {
        ...editedTestCase,
        tags: editedTestCase.tag_ids.map(id => testCase?.tags?.find(t => t.id === id)).filter((t): t is Tag => t !== undefined)
      };
      const updated = await testCaseService.update(testCase.id, testCaseToUpdate);
      testCase = updated;
      showEditForm = false;
    } catch (e) {
      error = 'Failed to update test case';
      console.error(e);
    }
  }

  async function handleDeleteTestCase() {
    if (!testCase || !confirm('Are you sure you want to delete this test case?')) return;
    
    try {
      await testCaseService.delete(testCase.id);
      goto('/test-cases');
    } catch (e) {
      error = 'Failed to delete test case';
      console.error(e);
    }
  }

  async function handleAddStep() {
    if (!testCase) return;
    
    try {
      const step = await testStepService.addStep(testCase.id, newStep);
      testCase.steps = [...(testCase.steps || []), step];
      showAddStepForm = false;
      newStep = {
        step_type: 'given',
        description: '',
        expected_result: ''
      };
    } catch (e) {
      error = 'Failed to add step';
      console.error(e);
    }
  }

  async function handleUpdateStep(step: TestStep) {
    if (!testCase) return;
    
    try {
      const stepToUpdate = {
        ...step,
        test_case_id: testCase.id
      };
      const updated = await testStepService.update(step.id, stepToUpdate);
      // Update the step in the test case with the complete step data returned from API
      testCase.steps = testCase.steps.map(s => s.id === updated.id ? updated : s);
      editingStep = null;
    } catch (e) {
      error = 'Failed to update step';
      console.error(e);
    }
  }

  async function handleDeleteStep(stepId: number) {
    if (!testCase || !confirm('Are you sure you want to delete this step?')) return;
    
    try {
      await testStepService.delete(stepId);
      testCase.steps = testCase.steps.filter(s => s.id !== stepId);
    } catch (e) {
      error = 'Failed to delete step';
      console.error(e);
    }
  }

  async function handleReorderSteps() {
    if (!testCase || !draggedStep || !draggedOverStep) return;
    
    try {
      const updatedSteps = [...testCase.steps];
      // We've already checked that draggedStep and draggedOverStep are not null above
      // @ts-ignore - TypeScript doesn't recognize the null check above
      const fromIndex = updatedSteps.findIndex(s => s.id === draggedStep.id);
      // @ts-ignore - TypeScript doesn't recognize the null check above
      const toIndex = updatedSteps.findIndex(s => s.id === draggedOverStep.id);
      
      if (fromIndex === -1 || toIndex === -1) return;
      
      // Remove the dragged step and insert it at the new position
      const [movedStep] = updatedSteps.splice(fromIndex, 1);
      updatedSteps.splice(toIndex, 0, movedStep);
      
      // Update the order in the backend
      await testStepService.reorder(testCase.id, updatedSteps.map((step, index) => ({
        id: step.id,
        order: index + 1
      })));
      
      // Update the local state
      testCase.steps = updatedSteps;
    } catch (e) {
      error = 'Failed to reorder steps';
      console.error(e);
    } finally {
      draggedStep = null;
      draggedOverStep = null;
    }
  }

  async function handleFileUpload(event: Event, stepId: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    uploadingForStep = stepId;
    
    try {
      console.log(`Uploading file for step ID: ${stepId}`);
      const updatedStep = await stepAttachmentService.upload(stepId, file, fileTypeInput) as TestStep;
      console.log('Received updated step:', updatedStep);
      
      // Update the step in the test case with the complete step data returned from API
      if (testCase) {
        testCase.steps = testCase.steps.map(s => s.id === updatedStep.id ? updatedStep : s);
      }
      fileTypeInput = '';
      input.value = '';
    } catch (e) {
      error = 'Failed to upload attachment';
      console.error(e);
    } finally {
      uploadingForStep = null;
    }
  }

  async function handleDeleteAttachment(attachmentId: number, stepId: number) {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    try {
      console.log(`Deleting attachment ID: ${attachmentId} from step ID: ${stepId}`);
      
      // First, try to get the step that owns this attachment to ensure we update the right step
      let stepWithAttachment = null;
      if (testCase) {
        stepWithAttachment = testCase.steps.find(s => 
          s.attachments && s.attachments.some(a => a.id === attachmentId)
        );
        
        if (stepWithAttachment) {
          console.log(`Found attachment in step ID: ${stepWithAttachment.id}`);
        } else {
          console.warn(`Could not find step containing attachment ID: ${attachmentId}`);
        }
      }
      
      const updatedStep = await stepAttachmentService.delete(attachmentId) as TestStep;
      console.log('Received updated step after deletion:', updatedStep);
      
      // Update the step in the test case with the complete step data returned from API
      if (testCase && updatedStep) {
        testCase.steps = testCase.steps.map(s => s.id === updatedStep.id ? updatedStep : s);
        console.log(`Updated step ID: ${updatedStep.id} in test case`);
      } else if (testCase && stepWithAttachment) {
        // Fallback: If the API doesn't return the updated step, remove the attachment from the step
        stepWithAttachment.attachments = stepWithAttachment.attachments?.filter(a => a.id !== attachmentId) || [];
        testCase.steps = testCase.steps.map(s => s.id === stepWithAttachment.id ? stepWithAttachment : s);
        console.log(`Manually removed attachment ID: ${attachmentId} from step ID: ${stepWithAttachment.id}`);
      }
    } catch (e) {
      error = 'Failed to delete attachment';
      console.error('Error deleting attachment:', e);
      
      // Try to get more details about the error
      if (e instanceof Error) {
        console.error('Error message:', e.message);
      }
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

  function getStepTypeColor(stepType: string) {
    switch (stepType.toLowerCase()) {
      case 'given':
        return 'bg-green-100 text-green-800';
      case 'when':
        return 'bg-blue-100 text-blue-800';
      case 'then':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getFileIcon(fileType: string) {
    const type = fileType.toLowerCase();
    if (type.includes('image')) return '📷';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('video')) return '🎬';
    if (type.includes('audio')) return '🎵';
    return '📎';
  }

  // Add a function to get the full image URL
  function getFullImageUrl(path: string): string {
    if (!path) return '';
    
    // If the path is already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Check if path is a relative URL that starts with /api
    if (path.startsWith('/api')) {
      return `${window.location.origin}${path}`;
    }
    
    // Check if path is a relative URL that starts with api
    if (path.startsWith('api')) {
      return `${window.location.origin}/${path}`;
    }
    
    // Otherwise, prepend the API base URL
    // Remove any leading slash from the path
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${window.location.origin}/${cleanPath}`;
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if loading}
    <div class="text-center">Loading...</div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {:else if testCase}
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-2xl font-bold">{testCase.title}</h1>
          <div class="text-sm text-gray-600 mt-1">
            Project: {project?.name} | Test Suite: {testSuite?.name}
          </div>
        </div>
        <div class="space-x-2">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            on:click={() => showEditForm = !showEditForm}
          >
            {showEditForm ? 'Cancel' : 'Edit Test Case'}
          </button>
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            on:click={handleDeleteTestCase}
          >
            Delete Test Case
          </button>
        </div>
      </div>

      {#if showEditForm}
        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 class="text-xl font-semibold mb-4">Edit Test Case</h2>
          <form on:submit|preventDefault={handleUpdateTestCase} class="space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                bind:value={editedTestCase.title}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                bind:value={editedTestCase.description}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>
            <div>
              <label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
              <select
                id="priority"
                bind:value={editedTestCase.priority}
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
                bind:value={editedTestCase.status}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label for="preconditions" class="block text-sm font-medium text-gray-700">Preconditions</label>
              <textarea
                id="preconditions"
                bind:value={editedTestCase.preconditions}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div class="flex flex-wrap gap-2">
                {#each (testCase.tags || []) as tag}
                  <label class="inline-flex items-center">
                    <input
                      type="checkbox"
                      value={tag.id}
                      bind:group={editedTestCase.tag_ids}
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
              Update Test Case
            </button>
          </form>
        </div>
      {:else}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex space-x-2 mb-4">
            <span class="px-2 py-1 rounded-full text-sm {getPriorityColor(testCase.priority)}">
              {testCase.priority}
            </span>
            <span class="px-2 py-1 rounded-full text-sm {getStatusColor(testCase.status)}">
              {testCase.status}
            </span>
          </div>
          <div class="mb-4">
            <h2 class="text-lg font-semibold mb-2">Description</h2>
            <p class="text-gray-600">{testCase.description}</p>
          </div>
          <div class="mb-4">
            <h2 class="text-lg font-semibold mb-2">Preconditions</h2>
            <p class="text-gray-600">{testCase.preconditions}</p>
          </div>
          <div class="mb-4">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Test Steps</h2>
            </div>
            
            <div class="space-y-4">
              {#each testCase.steps as step, index}
                <div 
                  class="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md {draggedOverStep?.id === step.id ? 'border-2 border-blue-500' : ''}"
                  draggable="true"
                  on:dragstart={() => draggedStep = step}
                  on:dragend={handleReorderSteps}
                  on:dragover|preventDefault={() => draggedOverStep = step}
                  on:dragleave|preventDefault={() => draggedOverStep = null}
                >
                  {#if editingStep?.id === step.id}
                    <div class="p-4 space-y-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-500">Step {index + 1}</span>
                        <div class="flex space-x-2">
                          <button
                            class="text-blue-500 hover:text-blue-600"
                            on:click={() => {
                              if (editingStep) {
                                handleUpdateStep(editingStep);
                              }
                            }}
                          >
                            Save
                          </button>
                          <button
                            class="text-gray-500 hover:text-gray-600"
                            on:click={() => editingStep = null}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Step Type</label>
                          <select
                            bind:value={editingStep.step_type}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="given">Given</option>
                            <option value="when">When</option>
                            <option value="then">Then</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            bind:value={editingStep.description}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows="2"
                            required
                          ></textarea>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
                          <textarea
                            bind:value={editingStep.expected_result}
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  {:else}
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-3">
                          <span class="text-sm font-medium text-gray-500">Step {index + 1}</span>
                          <div class="relative">
                            <span 
                              class="px-2 py-1 rounded-full text-xs {getStepTypeColor(step.step_type)} cursor-pointer hover:opacity-80"
                              on:click={() => editingStep = { ...step }}
                            >
                              {step.step_type}
                            </span>
                          </div>
                        </div>
                        <div class="flex space-x-2">
                          <button
                            class="text-red-500 hover:text-red-600"
                            on:click={() => handleDeleteStep(step.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div 
                          class="p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          on:click={() => editingStep = { ...step }}
                        >
                          <p class="text-gray-700">{step.description}</p>
                        </div>
                        {#if step.expected_result}
                          <div 
                            class="bg-gray-50 p-3 rounded-md hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                            on:click={() => editingStep = { ...step }}
                          >
                            <p class="text-sm font-medium text-gray-500 mb-1">Expected Result:</p>
                            <p class="text-gray-600">{step.expected_result}</p>
                          </div>
                        {/if}
                        
                        <!-- Attachments section -->
                        <div class="mt-3 border-t pt-3">
                          <div class="flex items-center justify-between mb-2">
                            <p class="text-sm font-medium text-gray-500">Attachments</p>
                            <button
                              class="text-blue-500 hover:text-blue-600 text-sm"
                              on:click={() => fileInputs[step.id]?.click()}
                            >
                              Add Attachment
                            </button>
                            <input 
                              type="file" 
                              class="hidden" 
                              bind:this={fileInputs[step.id]}
                              on:change={(e) => handleFileUpload(e, step.id)}
                            />
                          </div>
                          
                          {#if uploadingForStep === step.id}
                            <div class="flex items-center mt-2">
                              <div class="w-full">
                                <input
                                  type="text"
                                  placeholder="File type (optional)"
                                  bind:value={fileTypeInput}
                                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                              </div>
                              <div class="ml-2">
                                <div class="animate-pulse bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  Uploading...
                                </div>
                              </div>
                            </div>
                          {/if}
                          
                          {#if step.attachments && step.attachments.length > 0}
                            <div class="mt-2 space-y-2">
                              <div class="text-xs text-gray-500 mb-1">Step ID: {step.id} - {step.attachments.length} attachment(s)</div>
                              {#each step.attachments as attachment}
                                <div class="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                  <div class="flex items-center">
                                    <span class="mr-2 text-lg">{getFileIcon(attachment.file_type)}</span>
                                    {#if attachment.file_type.toLowerCase().includes('image')}
                                      <a 
                                        href="javascript:void(0)" 
                                        class="text-blue-500 hover:text-blue-600 text-sm"
                                        on:click={() => {
                                          console.log(`Opening image preview for attachment: ${attachment.id} in step: ${step.id}`);
                                          previewImage = { 
                                            src: getFullImageUrl(attachment.file_path), 
                                            alt: attachment.file_name 
                                          };
                                        }}
                                      >
                                        {attachment.file_name}
                                      </a>
                                    {:else}
                                      <a 
                                        href={getFullImageUrl(attachment.file_path)} 
                                        target="_blank" 
                                        class="text-blue-500 hover:text-blue-600 text-sm"
                                      >
                                        {attachment.file_name}
                                      </a>
                                    {/if}
                                  </div>
                                  <button
                                    class="text-red-500 hover:text-red-600 text-sm"
                                    on:click={() => {
                                      console.log(`Deleting attachment: ${attachment.id} from step: ${step.id}`);
                                      handleDeleteAttachment(attachment.id, step.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              {/each}
                            </div>
                          {:else}
                            <p class="text-sm text-gray-400 mt-2">No attachments</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}

              <!-- New step card -->
              <div class="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-gray-500">Step {testCase.steps.length + 1}</span>
                </div>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Step Type</label>
                    <select
                      bind:value={newStep.step_type}
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="given">Given</option>
                      <option value="when">When</option>
                      <option value="then">Then</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      bind:value={newStep.description}
                      placeholder="Enter step description"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows="2"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
                    <textarea
                      bind:value={newStep.expected_result}
                      placeholder="Enter expected result (optional)"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="flex justify-end">
                    <button
                      class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                      on:click={handleAddStep}
                      disabled={!newStep.description}
                    >
                      Add Step
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {#if testCase.tags && testCase.tags.length > 0}
            <div>
              <h2 class="text-lg font-semibold mb-2">Tags</h2>
              <div class="flex flex-wrap gap-2">
                {#each testCase.tags as tag}
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag.name}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if previewImage}
    <div 
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      on:click={() => previewImage = null}
    >
      <div class="relative max-w-4xl max-h-[90vh] overflow-auto bg-white p-2 rounded-lg">
        <button 
          class="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg z-10"
          on:click|stopPropagation={() => previewImage = null}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="flex flex-col items-center">
          <img 
            src={previewImage.src} 
            alt={previewImage.alt}
            class="max-h-[85vh] max-w-full object-contain"
          />
          <p class="mt-2 text-center text-gray-700">{previewImage.alt}</p>
          <a 
            href={previewImage.src} 
            target="_blank" 
            class="mt-2 text-blue-500 hover:text-blue-600"
            on:click|stopPropagation
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  {/if}
</div> 