import type { EventType } from "@/entities/event";

import type { CreateEventFormValues } from "../model";

export interface CreateEventDto {
  title: string;
  type: EventType;
  ticketPrice: number;
  registrationDeadline: string;
  paymentDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  date: string;
  endDate?: string;
  departureTime: string;
  returnTime: string;
  observations?: string;
}

export function mapCreateEventFormToDto(values: CreateEventFormValues): CreateEventDto {
  const observations = values.observations?.trim();
  const endDate = values.type === "REGIONAL_CONVENTION" ? values.endDate : undefined;

  return {
    title: values.title.trim(),
    type: values.type,
    ticketPrice: Number(values.ticketPrice.replace(",", ".")),
    registrationDeadline: values.registrationDeadline,
    paymentDeadline: values.paymentDeadline,
    venue: values.venue.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    date: values.date,
    ...(endDate ? { endDate } : {}),
    departureTime: values.departureTime,
    returnTime: values.returnTime,
    ...(observations ? { observations } : {}),
  };
}
