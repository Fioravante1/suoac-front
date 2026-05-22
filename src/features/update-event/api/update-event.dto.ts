import {
  EVENT_EDITABLE_FIELDS_BY_STATUS,
  EVENT_UPDATE_FIELDS,
  type EventStatus,
  type EventUpdateField,
} from "@/entities/event";

import type { UpdateEventFormValues } from "../model";

export type UpdateEventDto = Partial<{
  title: string;
  ticketPrice: number;
  registrationDeadline: string;
  paymentDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  observations: string;
}>;

function hasEditableField(status: EventStatus, field: EventUpdateField): boolean {
  return EVENT_EDITABLE_FIELDS_BY_STATUS[status].includes(field);
}

export function mapUpdateEventFormToDto(values: UpdateEventFormValues, status: EventStatus): UpdateEventDto {
  const dto: UpdateEventDto = {};

  if (hasEditableField(status, EVENT_UPDATE_FIELDS.TITLE)) dto.title = values.title.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.TICKET_PRICE)) {
    dto.ticketPrice = Number(values.ticketPrice.replace(",", "."));
  }
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.REGISTRATION_DEADLINE)) {
    dto.registrationDeadline = values.registrationDeadline;
  }
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.PAYMENT_DEADLINE)) dto.paymentDeadline = values.paymentDeadline;
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.VENUE)) dto.venue = values.venue.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.ADDRESS)) dto.address = values.address.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.CITY)) dto.city = values.city.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.STATE)) dto.state = values.state.trim().toUpperCase();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.OBSERVATIONS)) dto.observations = values.observations?.trim() ?? "";

  return dto;
}
