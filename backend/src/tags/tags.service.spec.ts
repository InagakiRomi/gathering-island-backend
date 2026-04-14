import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

import { Gathering } from 'src/gatherings/entities/gathering.entity';
import { TagsService } from './tags.service';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { ErrorCode } from 'src/common/enum/error-code.enum';

/**
 * ============================
 * Mock Tag 資料工廠
 * ============================
 */
const mockTag = (tagName: string): Tag => {
  const tag = {
    id: Math.floor(Math.random() * 1000),
    tagName,
    gatherings: [],
    toJSON: () => ({
      id: tag.id,
      tagName: tag.tagName,
    }),
  };

  return tag as unknown as Tag;
};

/**
 * ============================
 * TagsService
 * ============================
 */
type MockEntityManager = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  persistAndFlush: jest.Mock;
  createQueryBuilder: jest.Mock;
};

describe('TagsService', () => {
  let service: TagsService;
  let entityManager: MockEntityManager;
  let usageCountQbExecute: jest.Mock;

  beforeEach(async () => {
    usageCountQbExecute = jest.fn();
    const usageCountQb = {
      select: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      execute: usageCountQbExecute,
    };

    const mockEntityManager: MockEntityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      createQueryBuilder: jest.fn(() => usageCountQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: EntityManager,
          useValue: mockEntityManager as unknown as EntityManager,
        },
      ],
    }).compile();

    service = module.get(TagsService);
    entityManager = mockEntityManager;
  });

  /**
   * ============================
   * findTagIdByName
   * ============================
   */
  describe('findTagIdByName', () => {
    it('成功回傳 tagId', async () => {
      const fakeTag = mockTag('nestjs');
      entityManager.findOne.mockResolvedValue(fakeTag);

      const result = await service.findTagIdByName('nestjs');

      expect(result).toEqual({ tagId: fakeTag.id });
      expect(entityManager.findOne).toHaveBeenCalledWith(Tag, {
        tagName: 'nestjs',
      });
    });

    it('找不到標籤時應該拋出 NotFoundException（含錯誤碼）', async () => {
      entityManager.findOne.mockResolvedValue(null);

      try {
        await service.findTagIdByName('unknown');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.getResponse()).toMatchObject({
          message: `Tag with tagName "unknown" not found.`,
          code: ErrorCode.NOT_FOUND,
        });
      }
    });
  });

  /**
   * ============================
   * findOrCreateTag
   * ============================
   */
  describe('findOrCreateTag', () => {
    it('若標籤已存在，應回傳該標籤', async () => {
      const existingTag = mockTag('existing');
      entityManager.findOne.mockResolvedValue(existingTag);

      const dto: CreateTagDto = { tagName: 'existing' };
      const result = await service.findOrCreateTag(dto);

      expect(result).toEqual(existingTag);
      expect(entityManager.findOne).toHaveBeenCalledWith(Tag, {
        tagName: 'existing',
      });
      expect(entityManager.create).not.toHaveBeenCalled();
      expect(entityManager.persistAndFlush).not.toHaveBeenCalled();
    });

    it('若標籤不存在，應建立並儲存後回傳新標籤', async () => {
      const newTag = mockTag('new');
      entityManager.findOne.mockResolvedValue(null);
      entityManager.create.mockReturnValue(newTag);
      entityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto: CreateTagDto = { tagName: 'new' };
      const result = await service.findOrCreateTag(dto);

      expect(result).toEqual(newTag);
      expect(entityManager.create).toHaveBeenCalledWith(Tag, {
        tagName: 'new',
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(newTag);
    });
  });

  /**
   * ============================
   * findAllTags
   * ============================
   */
  describe('findAllTags', () => {
    it('應依 id 遞增回傳所有標籤並附帶 usageCount', async () => {
      const t1 = mockTag('a');
      t1.id = 1;
      const t2 = mockTag('b');
      t2.id = 2;
      entityManager.find.mockResolvedValue([t1, t2]);
      usageCountQbExecute.mockResolvedValue([{ tag: 1, cnt: 3 }]);

      const result = await service.findAllTags();

      expect(result).toEqual([
        { id: 1, tagName: 'a', usageCount: 3 },
        { id: 2, tagName: 'b', usageCount: 0 },
      ]);
      expect(entityManager.find).toHaveBeenCalledWith(
        Tag,
        {},
        {
          orderBy: { id: 'ASC' },
        },
      );
      expect(entityManager.createQueryBuilder).toHaveBeenCalledWith(
        Gathering,
        'g',
      );
      expect(usageCountQbExecute).toHaveBeenCalledWith('all', false);
    });

    it('無關聯列時 usageCount 應為 0', async () => {
      const t1 = mockTag('solo');
      t1.id = 10;
      entityManager.find.mockResolvedValue([t1]);
      usageCountQbExecute.mockResolvedValue([]);

      const result = await service.findAllTags();

      expect(result).toEqual([{ id: 10, tagName: 'solo', usageCount: 0 }]);
    });
  });
});
