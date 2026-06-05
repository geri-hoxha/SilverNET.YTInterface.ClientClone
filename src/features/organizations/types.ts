export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface CreateOrganizationDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateOrganizationDto extends CreateOrganizationDto {}
