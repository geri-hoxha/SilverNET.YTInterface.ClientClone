export interface Project {
  id: string;
  organizationId: string;
  name: string;
  youTrackProjectId: string;
  isActive: boolean;
  priorityOptions: string[];
  clientStates: string[];
}

export interface CreateProjectDto {
  organizationId: string;
  name: string;
  youTrackProjectId: string;
  isActive?: boolean;
  priorityOptions?: string[];
  clientStates?: string[];
}

export interface UpdateProjectDto extends Omit<CreateProjectDto, "organizationId"> {}
