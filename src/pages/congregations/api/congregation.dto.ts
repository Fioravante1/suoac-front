export interface CreateCongregationDto {
  name: string;
  city?: string;
}

export interface UpdateCongregationDto {
  name?: string;
  city?: string;
  isActive?: boolean;
}
