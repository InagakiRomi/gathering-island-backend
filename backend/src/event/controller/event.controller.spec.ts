import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../controller/event.controller';
import { EventService } from '../service/event.service';
import { EventDto } from '../dto/event.dto';
import { EventType } from '../enums/event-type.enum';
import { Event } from '../entity/event.entity';

describe('EventController', () => {
  let controller: EventController;
  let service: EventService;

  const mockEvent: EventDto = {
    event_id: 1,
    event_name: 'Mock Event',
    event_description: 'Mock Desc',
    event_type: 3,
    event_typeName: 'LEARNING',
    event_location: '台南市中西區南門路1號',
    image_url: 'null',
    max_participants : 177,
    event_price: 100,
    organizer_id: 78,
    event_time: new Date(),
    registration_deadline: new Date(Date.now() + 100000),
    created_at: new Date(),
    is_ended: false,
  };

  const mockService = {
    findAllEvent: jest.fn(),
    findOneEvent: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    service = module.get<EventService>(EventService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /events', () => {
    it('should call service.findAllEvent with correct transformed params', async () => {
      const mockResult = [mockEvent];
      mockService.findAllEvent.mockResolvedValue(mockResult);

      const queryParams = {
        query: 'mock',
        sortParam: 'event_time:DESC,created_at:ASC',
        eventType: EventType.OTHER,
        isEndedRaw: 'false',
        minPriceRaw: '50',
        maxPriceRaw: '150',
        pageRaw: '2',
        limitRaw: '5',
      };

      const result = await controller.findAllEvent(
        queryParams.query,
        queryParams.sortParam,
        queryParams.eventType,
        queryParams.isEndedRaw,
        queryParams.minPriceRaw,
        queryParams.maxPriceRaw,
        queryParams.pageRaw,
        queryParams.limitRaw
      );

      expect(service.findAllEvent).toHaveBeenCalledWith(
        'mock',
        { event_time: 'DESC', created_at: 'ASC' },
        EventType.OTHER,
        false,
        50,
        150,
        5,
        5
      );
      expect(result).toEqual(expect.any(Array));
      expect(result[0]).toBeInstanceOf(EventDto);
    });

    it('should handle empty optional query params', async () => {
      mockService.findAllEvent.mockResolvedValue([mockEvent]);

      const result = await controller.findAllEvent(
        '',         // query
        'created_at:ASC',
        undefined,  // eventType
        undefined,  // isEndedRaw
        undefined,  // minPriceRaw
        undefined,  // maxPriceRaw
        undefined,  // pageRaw
        undefined   // limitRaw
      );

      expect(service.findAllEvent).toHaveBeenCalledWith(
        '',
        { created_at: 'ASC' },
        undefined,
        undefined,
        undefined,
        undefined,
        20,
        0
      );

      expect(result[0]).toBeInstanceOf(EventDto);
    });
  });

  describe('GET /events/:id', () => {
    it('should return one event by id', async () => {
      mockService.findOneEvent.mockResolvedValue(mockEvent);

      const result = await controller.findOneEvent(1);

      expect(service.findOneEvent).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(EventDto);
    });
  });

  describe('POST /events', () => {
    it('should create a new event', async () => {
      const input = { ...mockEvent, event_id: undefined };
      mockService.createEvent.mockResolvedValue(mockEvent);

      const result = await controller.createEvent(input as unknown as Event);

      expect(service.createEvent).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('PUT /events/:id', () => {
    it('should update an event', async () => {
      mockService.updateEvent.mockResolvedValue(mockEvent);

      const updated = await controller.updateEvent(1, mockEvent as Event);

      expect(service.updateEvent).toHaveBeenCalledWith(1, mockEvent);
      expect(updated).toEqual(mockEvent);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete an event by id', async () => {
      mockService.deleteEvent.mockResolvedValue(undefined);

      await controller.deleteEvent(1);

      expect(service.deleteEvent).toHaveBeenCalledWith(1);
    });
  });
});