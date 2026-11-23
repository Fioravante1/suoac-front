import {
  EVENT_EDITABLE_FIELDS_BY_STATUS,
  EVENT_UPDATE_FIELDS,
  toEventCalendarDate,
  type Event,
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

/** O evento como estava ao abrir o formulário: o status e os prazos que o formulário mostrou. */
export type EventBeingUpdated = Pick<Event, "status" | "registrationDeadline" | "paymentDeadline">;

/** O prazo vai só quando pode ser editado e mudou em relação ao dia que o formulário mostrou. */
function hasDeadlineChanged(
  event: EventBeingUpdated,
  field: typeof EVENT_UPDATE_FIELDS.REGISTRATION_DEADLINE | typeof EVENT_UPDATE_FIELDS.PAYMENT_DEADLINE,
  value: string,
): boolean {
  return hasEditableField(event.status, field) && value !== toEventCalendarDate(event[field]);
}

/**
 * Os prazos só vão quando mudaram. Em evento aberto, a API recusa prazo vindo de quem não é o
 * coordenador do circuito, e o assistente não conseguiria salvar nada se o formulário mandasse os
 * prazos que ele nem pode alterar. Também evita regravar um prazo que ninguém tocou.
 */
export function mapUpdateEventFormToDto(values: UpdateEventFormValues, event: EventBeingUpdated): UpdateEventDto {
  const { status } = event;
  const dto: UpdateEventDto = {};

  if (hasEditableField(status, EVENT_UPDATE_FIELDS.TITLE)) dto.title = values.title.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.TICKET_PRICE)) {
    dto.ticketPrice = Number(values.ticketPrice.replace(",", "."));
  }
  if (hasDeadlineChanged(event, EVENT_UPDATE_FIELDS.REGISTRATION_DEADLINE, values.registrationDeadline)) {
    dto.registrationDeadline = values.registrationDeadline;
  }
  if (hasDeadlineChanged(event, EVENT_UPDATE_FIELDS.PAYMENT_DEADLINE, values.paymentDeadline)) {
    dto.paymentDeadline = values.paymentDeadline;
  }
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.VENUE)) dto.venue = values.venue.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.ADDRESS)) dto.address = values.address.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.CITY)) dto.city = values.city.trim();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.STATE)) dto.state = values.state.trim().toUpperCase();
  if (hasEditableField(status, EVENT_UPDATE_FIELDS.OBSERVATIONS)) dto.observations = values.observations?.trim() ?? "";

  return dto;
}
