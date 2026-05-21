export interface CreateCongregationDto {
  code: string;
  name: string;
  email: string;
  city: string;
}

export interface UpdateCongregationDto {
  code?: string;
  name?: string;
  email?: string;
  city?: string;
  isActive?: boolean;
}
