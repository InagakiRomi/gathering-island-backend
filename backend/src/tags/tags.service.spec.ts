import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

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
describe('TagsService', () => {
  let service: TagsService;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            persistAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TagsService);
    entityManager = module.get(EntityManager);
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
      entityManager.persistAndFlush.mockResolvedValue();

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
    it('應依 id 遞增回傳所有標籤', async () => {
      const t1 = mockTag('a');
      const t2 = mockTag('b');
      entityManager.find.mockResolvedValue([t1, t2]);

      const result = await service.findAllTags();

      expect(result).toEqual([t1, t2]);
      expect(entityManager.find).toHaveBeenCalledWith(Tag, {}, { orderBy: { id: 'ASC' } });
    });
  });
});
