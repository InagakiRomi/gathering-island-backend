import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { Event } from '../entity/event.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventDto } from '../dto/event.dto';

const mockEvent = {
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
} as Event;

describe('EventService', () => {
  let service: EventService;
  let repo: Repository<Event>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({}),
              createQueryBuilder: jest.fn(),
              orWhere: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    repo = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  describe('findOneEvent', () => {
    it('should return event DTO if found and not ended', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockEvent);

      const result = await service.findOneEvent(1);

      expect(result).toEqual(EventDto.fromEntity(mockEvent));
    });

    it('should mark event as ended if past deadline', async () => {
      const expiredEvent = { ...mockEvent, is_ended: false, registration_deadline: new Date(Date.now() - 1000) };
      const savedEvent = { ...expiredEvent, is_ended: true };

      jest.spyOn(repo, 'findOne').mockResolvedValue(expiredEvent);
      jest.spyOn(repo, 'save').mockResolvedValue(savedEvent);

      const result = await service.findOneEvent(1);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_ended: true }));
      expect(result).toEqual(EventDto.fromEntity(savedEvent));
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.findOneEvent(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createEvent', () => {
    it('should create and return new event DTO', async () => {
      const { event_id, ...newEventData } = mockEvent;
      jest.spyOn(repo, 'save').mockResolvedValue(mockEvent);

      const result = await service.createEvent(newEventData as Event);

      expect(result).toEqual(expect.any(EventDto));
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ created_at: expect.any(Date) }));
    });

    it('should throw BadRequestException if price < 0', async () => {
      const badEvent = { ...mockEvent, event_price: -5 };

      await expect(service.createEvent(badEvent)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateEvent', () => {
    it('should update and return updated event DTO', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockEvent);
      jest.spyOn(repo, 'update').mockResolvedValue({
        generatedMaps: [],
        raw: [],
        affected: 1,
      });

      const result = await service.updateEvent(1, mockEvent);

      expect(repo.update).toHaveBeenCalledWith(1, mockEvent);
      expect(result).toEqual(EventDto.fromEntity(mockEvent));
    });

    it('should throw NotFoundException if updated event not found', async () => {
      jest.spyOn(repo, 'update').mockResolvedValue({
        generatedMaps: [],
        raw: [],
        affected: 1,
      });
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.updateEvent(999, mockEvent)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if price < 0', async () => {
      const badEvent = { ...mockEvent, event_price: -10 };

      await expect(service.updateEvent(1, badEvent)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteEvent', () => {
    it('should call delete with correct ID', async () => {
      jest.spyOn(repo, 'delete').mockResolvedValue({ raw: [], affected: 1 });

      await service.deleteEvent(1);

      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});