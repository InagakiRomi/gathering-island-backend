import { EventType, EventTypeNameMap } from '../enums/event-type.enum';

export const eventTypeOptions = Object.values(EventType)
  .filter(value => typeof value === 'number')
  .map(value => ({
    value,
    label: EventTypeNameMap[value as EventType],
  }));
