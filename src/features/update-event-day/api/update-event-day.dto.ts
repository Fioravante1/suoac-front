import type { UpdateEventDayFormValues } from "../model";

export type UpdateEventDayDto = Partial<{
  departureTime: string;
  returnTime: string;
}>;

export function mapUpdateEventDayFormToDto(
  values: UpdateEventDayFormValues,
  original: { departureTime: string; returnTime: string },
): UpdateEventDayDto {
  const dto: UpdateEventDayDto = {};

  if (values.departureTime !== original.departureTime) dto.departureTime = values.departureTime;
  if (values.returnTime !== original.returnTime) dto.returnTime = values.returnTime;

  return dto;
}
