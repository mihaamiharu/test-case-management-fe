export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description: string;
  project_id: number;
  created_at: string;
  updated_at: string;
}

export interface TestStep {
  id: number;
  step_type: 'given' | 'when' | 'then';
  description: string;
  expected_result: string;
  test_case_id: number;
  created_at: string;
  updated_at: string;
  attachments?: StepAttachment[];
}

export interface StepNote {
  id: number;
  content: string;
  step_id: number;
  created_at: string;
  updated_at: string;
}

export interface StepAttachment {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  step_id: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'active' | 'archived';
  suite_id: number;
  project_id: number;
  preconditions: string;
  steps: TestStep[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
} 