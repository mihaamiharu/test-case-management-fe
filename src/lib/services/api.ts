import axios from 'axios';
import type { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials,
  Project,
  TestSuite,
  TestCase,
  TestStep,
  StepNote,
  Tag
} from '../types/api';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

// Project services
export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
    const response = await api.post<Project>('/projects', project);
    return response.data;
  },

  update: async (id: number, project: Partial<Project>): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, project);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

// Test Suite services
export const testSuiteService = {
  getAll: async (): Promise<TestSuite[]> => {
    const response = await api.get<TestSuite[]>('/test-suites');
    return response.data;
  },

  getByProject: async (projectId: number): Promise<TestSuite[]> => {
    const response = await api.get<TestSuite[]>(`/project-test-suites/${projectId}`);
    return response.data;
  },

  getById: async (id: number): Promise<TestSuite> => {
    const response = await api.get<TestSuite>(`/test-suites/${id}`);
    return response.data;
  },

  create: async (suite: Omit<TestSuite, 'id' | 'created_at' | 'updated_at'>): Promise<TestSuite> => {
    const response = await api.post<TestSuite>('/test-suites', suite);
    return response.data;
  },

  update: async (id: number, suite: Partial<TestSuite>): Promise<TestSuite> => {
    const response = await api.put<TestSuite>(`/test-suites/${id}`, suite);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/test-suites/${id}`);
  },
};

// Test Case services
export const testCaseService = {
  getAll: async (): Promise<TestCase[]> => {
    const response = await api.get<TestCase[]>('/test-cases');
    return response.data;
  },

  getByProject: async (projectId: number): Promise<TestCase[]> => {
    const response = await api.get<TestCase[]>(`/project-test-cases/${projectId}`);
    return response.data;
  },

  getBySuite: async (suiteId: number): Promise<TestCase[]> => {
    const response = await api.get<TestCase[]>(`/suite-test-cases/${suiteId}`);
    return response.data;
  },

  getById: async (id: number): Promise<TestCase> => {
    const response = await api.get<TestCase>(`/test-cases/${id}`);
    return response.data;
  },

  create: async (testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>): Promise<TestCase> => {
    const response = await api.post<TestCase>('/test-cases', testCase);
    return response.data;
  },

  update: async (id: number, testCase: Partial<TestCase>): Promise<TestCase> => {
    const response = await api.put<TestCase>(`/test-cases/${id}`, testCase);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/test-cases/${id}`);
  },
};

// Test Step services
export const testStepService = {
  addStep: async (testCaseId: number, step: Omit<TestStep, 'id' | 'test_case_id' | 'created_at' | 'updated_at'>): Promise<TestStep> => {
    const response = await api.post<TestStep>(`/test-case-steps/${testCaseId}`, step);
    return response.data;
  },

  update: async (stepId: number, step: Partial<TestStep>): Promise<TestStep> => {
    const response = await api.put<TestStep>(`/test-case-steps/${step.test_case_id}/${stepId}`, step);
    return response.data;
  },

  delete: async (stepId: number): Promise<void> => {
    await api.delete(`/test-steps/${stepId}`);
  },

  reorder: async (testCaseId: number, steps: { id: number; order: number }[]): Promise<void> => {
    await api.put(`/test-case-steps/${testCaseId}/reorder`, { steps });
  }
};

// Step Note services
export const stepNoteService = {
  addNote: async (stepId: number, note: Omit<StepNote, 'id' | 'step_id' | 'created_at' | 'updated_at'>): Promise<StepNote> => {
    const response = await api.post<StepNote>(`/step-notes/${stepId}`, note);
    return response.data;
  },

  delete: async (noteId: number): Promise<void> => {
    await api.delete(`/step-notes/${noteId}`);
  },
};

// Step Attachment services
export const stepAttachmentService = {
  upload: async (stepId: number, file: File, fileType?: string): Promise<TestStep> => {
    const formData = new FormData();
    formData.append('file', file);
    if (fileType) {
      formData.append('file_type', fileType);
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/step-attachments/${stepId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload attachment error:', errorText);
      throw new Error(`Failed to upload attachment: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  delete: async (attachmentId: number): Promise<TestStep> => {
    try {
      console.log(`Deleting attachment with ID: ${attachmentId}`);
      const token = localStorage.getItem('token');
      
      // First try using fetch
      const response = await fetch(`${API_BASE_URL}/step-attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Delete attachment error (fetch): ${response.status} ${response.statusText}`, errorText);
        
        // If fetch fails, try using axios as fallback
        console.log('Trying deletion with axios as fallback');
        const axiosResponse = await api.delete(`/step-attachments/${attachmentId}`);
        return axiosResponse.data;
      }
      
      // If the response is successful but empty, return null
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        console.log('Response is not JSON, returning null');
        return null as any;
      }
    } catch (error) {
      console.error('Error in delete attachment:', error);
      throw error;
    }
  }
};

// Tag services
export const tagService = {
  getAll: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },

  getById: async (id: number): Promise<Tag> => {
    const response = await api.get<Tag>(`/tags/${id}`);
    return response.data;
  },

  create: async (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> => {
    const response = await api.post<Tag>('/tags', tag);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },
}; 