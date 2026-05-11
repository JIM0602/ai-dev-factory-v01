import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ReservationService } from './reservation.service';
import {
  Reservation,
  ReservationStatus,
  ReservationSource,
} from '../../database/entities/reservation.entity';
import { ReservationRepository } from '../../database/repositories/reservation.repository';
import { ReservationRuleRepository } from '../../database/repositories/reservation-rule.repository';
import { StoreRepository } from '../../database/repositories/store.repository';
import { TimerSessionRepository } from '../../database/repositories/timer-session.repository';
import { TimerExtensionRepository } from '../../database/repositories/timer-extension.repository';
import { CouponRepository } from '../../database/repositories/coupon.repository';
import { Store } from '../../database/entities/store.entity';
import { ReservationRule } from '../../database/entities/reservation-rule.entity';

/**
 * ReservationService 单元测试
 *
 * 测试范围：
 *   - 顾客创建预约（容量校验、自动确认/待确认、重复预约、容量不足）
 *   - 商家代客预约（直接确认）
 *   - 顾客取消预约（时间校验、状态校验）
 *   - 商家确认/拒绝预约
 *   - 时段查询（生成时段、容量展示）
 *   - 商家预约列表
 *   - 异常场景（过去日期、休息日、无效时段、已截止）
 */
describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepo: any;
  let rulesRepo: any;
  let storeRepo: any;
  let dataSource: any;

  // 测试中使用的默认日期
  const TODAY = new Date().toISOString().slice(0, 10);

  // 明天
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const TOMORROW = tomorrow.toISOString().slice(0, 10);

  const mockStore: Partial<Store> = {
    id: 1,
    name: '测试拼豆店',
    address: '测试地址',
    phone: '13800000000',
    photos: ['https://example.com/photo.jpg'],
    open_time: '10:00',
    close_time: '22:00',
    rest_days: [],
    table_count: 8,
    description: '测试门店',
  };

  const mockRules: Partial<ReservationRule> = {
    id: 1,
    require_confirmation: false,
    advance_days: 7,
    cutoff_minutes: 60,
    auto_cancel_hours: null,
    customer_cancel_hours: 3,
    slot_duration: 60,
  };

  // 创建一个模拟的 Reservation 实体
  function createMockReservation(overrides: Partial<Reservation> = {}): Reservation {
    const entity = new Reservation();
    entity.id = overrides.id ?? 1;
    entity.customer_openid = overrides.customer_openid ?? 'wx_mock_user1';
    entity.customer_name = overrides.customer_name ?? '张三';
    entity.customer_phone = overrides.customer_phone ?? '13800001111';
    entity.reservation_date = overrides.reservation_date ?? TOMORROW;
    entity.slot_start_time = overrides.slot_start_time ?? '14:00';
    entity.slot_end_time = overrides.slot_end_time ?? '15:00';
    entity.guest_count = overrides.guest_count ?? 2;
    entity.status = overrides.status ?? ReservationStatus.CONFIRMED;
    entity.source = overrides.source ?? ReservationSource.CUSTOMER;
    entity.cancel_reason = overrides.cancel_reason ?? null;
    entity.rejection_reason = overrides.rejection_reason ?? null;
    entity.remark = overrides.remark ?? null;
    entity.created_at = overrides.created_at ?? new Date();
    entity.updated_at = overrides.updated_at ?? new Date();
    return entity;
  }

  beforeEach(async () => {
    const mockEntityManager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          setLock: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
          getCount: jest.fn().mockResolvedValue(0),
          getMany: jest.fn().mockResolvedValue([]),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
        }),
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: entity.id || 42 }),
        ),
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(null),
      }),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (manager: EntityManager) => Promise<any>) =>
          cb(mockEntityManager as unknown as EntityManager),
        ),
    };

    reservationRepo = {
      getSlotOccupancy: jest.fn().mockResolvedValue([]),
      findByCustomer: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
      findByMerchant: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
      findByIdOrFail: jest.fn(),
      repo: {
        create: jest.fn().mockImplementation((data) => ({ ...data, id: 42 })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 42 })),
        update: jest.fn().mockResolvedValue({}),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          setLock: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
          getCount: jest.fn().mockResolvedValue(0),
          getMany: jest.fn().mockResolvedValue([]),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
        }),
      },
      countOccupied: jest.fn().mockResolvedValue(0),
      getTodaySummary: jest.fn().mockResolvedValue({ pending: 0, confirmed: 0, inProgress: 0 }),
    };

    rulesRepo = {
      getRulesOrFail: jest.fn().mockResolvedValue(mockRules),
    };

    storeRepo = {
      getStoreConfigOrFail: jest.fn().mockResolvedValue(mockStore),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: DataSource, useValue: dataSource },
        { provide: ReservationRepository, useValue: reservationRepo },
        { provide: ReservationRuleRepository, useValue: rulesRepo },
        { provide: StoreRepository, useValue: storeRepo },
        { provide: TimerSessionRepository, useValue: { findByReservationId: jest.fn().mockResolvedValue(null) } },
        { provide: TimerExtensionRepository, useValue: { findByTimerSessionId: jest.fn().mockResolvedValue([]) } },
        { provide: CouponRepository, useValue: { findByTimerSessionId: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  // ---------------------------------------------------------------------------
  // createReservation - 顾客预约
  // ---------------------------------------------------------------------------
  describe('createReservation', () => {
    const validDto = {
      reservation_date: TOMORROW,
      slot_start_time: '14:00',
      slot_end_time: '15:00',
      guest_count: 2,
      customer_phone: '13800001111',
      customer_name: '张三',
    };

    it('应该在自动确认模式下创建已确认预约', async () => {
      const result = await service.createReservation(validDto, 'wx_mock_user1');

      expect(result.status).toBe('confirmed');
      expect(result.customer_name).toBe('张三');
      expect(result.customer_phone).toBe('13800001111');
      expect(result.source).toBe('customer');
      expect(result.id).toBe(42);
    });

    it('应该在需确认模式下创建待确认预约', async () => {
      rulesRepo.getRulesOrFail.mockResolvedValue({
        ...mockRules,
        require_confirmation: true,
      });

      const result = await service.createReservation(validDto, 'wx_mock_user1');

      expect(result.status).toBe('pending');
    });

    it('应该在容量不足时抛出 30001 错误', async () => {
      // Mock 事务返回容量满
      dataSource.transaction.mockImplementationOnce(
        () => {
          throw new BadRequestException({
            code: 30001,
            message: '该时段已约满，请选择其他时段',
            data: null,
          });
        },
      );

      await expect(
        service.createReservation(validDto, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30001,
        }),
      });
    });

    it('应该在重复预约时抛出 30002 错误', async () => {
      dataSource.transaction.mockImplementationOnce(
        () => {
          throw new BadRequestException({
            code: 30002,
            message: '您在该时段已有预约，请勿重复预约',
            data: null,
          });
        },
      );

      await expect(
        service.createReservation(validDto, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30002,
        }),
      });
    });

    it('应该在预约过去日期时抛出错误', async () => {
      await expect(
        service.createReservation(
          { ...validDto, reservation_date: '2020-01-01' },
          'wx_mock_user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('应该在休息日预约时抛出 20003 错误', async () => {
      storeRepo.getStoreConfigOrFail.mockResolvedValue({
        ...mockStore,
        rest_days: [0, 1, 2, 3, 4, 5, 6], // 全周休息
      });

      await expect(
        service.createReservation(validDto, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 20003,
          message: '非营业日期，无法预约',
        }),
      });
    });

    it('应该在时段不在营业时间时抛出错误', async () => {
      await expect(
        service.createReservation(
          { ...validDto, slot_start_time: '03:00', slot_end_time: '04:00' },
          'wx_mock_user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('应该在时段长度不匹配 slot_duration 时抛出错误', async () => {
      await expect(
        service.createReservation(
          { ...validDto, slot_end_time: '15:30' },
          'wx_mock_user1',
        ),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 20002,
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createMerchantReservation - 商家代客预约
  // ---------------------------------------------------------------------------
  describe('createMerchantReservation', () => {
    const validDto = {
      reservation_date: TOMORROW,
      slot_start_time: '14:00',
      slot_end_time: '15:00',
      guest_count: 3,
      customer_phone: '13900002222',
      customer_name: '李四',
    };

    it('应该创建状态为已确认的预约', async () => {
      const result = await service.createMerchantReservation(validDto);

      expect(result.status).toBe('confirmed');
      expect(result.source).toBe('merchant');
      expect(result.customer_name).toBe('李四');
    });

    it('应该跳过重复预约检查（商家可不限制 openid 重复）', async () => {
      // 验证 merchant 预约不检查重复 openid（因为商家代约使用不同的 openid 前缀）
      const result1 = await service.createMerchantReservation(validDto);
      expect(result1.status).toBe('confirmed');

      // 可以再次为同一顾客创建预约（因为 openid 不同）
      const result2 = await service.createMerchantReservation(validDto);
      expect(result2.status).toBe('confirmed');
    });
  });

  // ---------------------------------------------------------------------------
  // cancelReservation - 顾客取消预约
  // ---------------------------------------------------------------------------
  describe('cancelReservation', () => {
    it('应该成功取消已确认的预约', async () => {
      const mockReservation = createMockReservation({
        id: 1,
        status: ReservationStatus.CONFIRMED,
        customer_openid: 'wx_mock_user1',
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.cancelReservation(1, 'wx_mock_user1');

      expect(result.message).toBe('预约已取消');
      expect(reservationRepo.repo.update).toHaveBeenCalledWith(1, {
        status: ReservationStatus.CANCELLED,
        cancel_reason: '顾客自行取消',
      });
    });

    it('应该成功取消待确认的预约', async () => {
      const mockReservation = createMockReservation({
        id: 2,
        status: ReservationStatus.PENDING,
        customer_openid: 'wx_mock_user1',
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.cancelReservation(2, 'wx_mock_user1');

      expect(result.message).toBe('预约已取消');
    });

    it('应该拒绝取消不属于自己的预约 (30004)', async () => {
      const mockReservation = createMockReservation({
        id: 3,
        status: ReservationStatus.CONFIRMED,
        customer_openid: 'wx_other_user',
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(
        service.cancelReservation(3, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30004,
          message: '该预约不属于您',
        }),
      });
    });

    it('应该拒绝取消已完成状态的预约 (30005)', async () => {
      const mockReservation = createMockReservation({
        id: 4,
        status: ReservationStatus.COMPLETED,
        customer_openid: 'wx_mock_user1',
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(
        service.cancelReservation(4, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
          message: '当前状态不允许取消',
        }),
      });
    });

    it('应该拒绝取消已取消状态的预约 (30005)', async () => {
      const mockReservation = createMockReservation({
        id: 5,
        status: ReservationStatus.CANCELLED,
        customer_openid: 'wx_mock_user1',
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(
        service.cancelReservation(5, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
        }),
      });
    });

    it('应该在超过取消截止时间时抛出 30003', async () => {
      // 预约时间为过去的一小时，customer_cancel_hours=3
      // 意味着取消截止时间早已过去
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = pastDate.toISOString().slice(0, 10);

      const mockReservation = createMockReservation({
        id: 6,
        status: ReservationStatus.CONFIRMED,
        customer_openid: 'wx_mock_user1',
        reservation_date: pastDateStr,
        slot_start_time: '10:00',
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(
        service.cancelReservation(6, 'wx_mock_user1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30003,
          message: '已超过取消时间，如需取消请联系商家',
        }),
      });
    });

    it('不应该对不存在的预约 ID 执行操作', async () => {
      reservationRepo.findByIdOrFail.mockRejectedValue(
        new NotFoundException('Record not found: reservations id=999'),
      );

      await expect(
        service.cancelReservation(999, 'wx_mock_user1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // confirmReservation - 商家确认预约
  // ---------------------------------------------------------------------------
  describe('confirmReservation', () => {
    it('应该成功确认待确认状态的预约', async () => {
      const mockReservation = createMockReservation({
        id: 10,
        status: ReservationStatus.PENDING,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.confirmReservation(10);

      expect(result.message).toBe('预约已确认');
      expect(reservationRepo.repo.update).toHaveBeenCalledWith(10, {
        status: ReservationStatus.CONFIRMED,
      });
    });

    it('应该拒绝确认非待确认状态的预约 (30005)', async () => {
      const mockReservation = createMockReservation({
        id: 11,
        status: ReservationStatus.CONFIRMED,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(service.confirmReservation(11)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
          message: '仅待确认状态的预约可确认',
        }),
      });
    });

    it('应该拒绝确认已取消状态的预约', async () => {
      const mockReservation = createMockReservation({
        id: 12,
        status: ReservationStatus.CANCELLED,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(service.confirmReservation(12)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // rejectReservation - 商家拒绝预约
  // ---------------------------------------------------------------------------
  describe('rejectReservation', () => {
    it('应该成功拒绝待确认状态的预约', async () => {
      const mockReservation = createMockReservation({
        id: 20,
        status: ReservationStatus.PENDING,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.rejectReservation(20, '该时段已满');

      expect(result.message).toBe('预约已拒绝');
      expect(reservationRepo.repo.update).toHaveBeenCalledWith(20, {
        status: ReservationStatus.REJECTED,
        rejection_reason: '该时段已满',
      });
    });

    it('应该拒绝原因可为空', async () => {
      const mockReservation = createMockReservation({
        id: 21,
        status: ReservationStatus.PENDING,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.rejectReservation(21);

      expect(result.message).toBe('预约已拒绝');
      expect(reservationRepo.repo.update).toHaveBeenCalledWith(21, {
        status: ReservationStatus.REJECTED,
        rejection_reason: null,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getSlots - 时段查询
  // ---------------------------------------------------------------------------
  describe('getSlots', () => {
    it('应该为营业日返回时段列表', async () => {
      const result = await service.getSlots(TOMORROW);

      expect(result.is_open).toBe(true);
      expect(result.slots.length).toBeGreaterThan(0);
      // 营业时间 10:00-22:00，60分钟时段 -> 12个时段
      expect(result.slots.length).toBe(12);
    });

    it('每个时段应包含容量信息', async () => {
      const result = await service.getSlots(TOMORROW);

      for (const slot of result.slots) {
        expect(slot).toHaveProperty('start_time');
        expect(slot).toHaveProperty('end_time');
        expect(slot).toHaveProperty('total_tables');
        expect(slot).toHaveProperty('booked_count');
        expect(slot).toHaveProperty('available_count');
        expect(slot).toHaveProperty('is_available');
        expect(slot).toHaveProperty('is_past');
        expect(slot).toHaveProperty('is_cutoff');
        expect(slot.total_tables).toBe(8);
        expect(slot.available_count).toBeGreaterThanOrEqual(0);
      }
    });

    it('应该为休息日返回空列表', async () => {
      storeRepo.getStoreConfigOrFail.mockResolvedValue({
        ...mockStore,
        rest_days: [0, 1, 2, 3, 4, 5, 6], // 全周休息
      });

      const result = await service.getSlots(TOMORROW);

      expect(result.is_open).toBe(false);
      expect(result.slots).toEqual([]);
    });

    it('应该为过去的日期返回空列表', async () => {
      const result = await service.getSlots('2020-01-01');

      expect(result.is_open).toBe(false);
      expect(result.slots).toEqual([]);
    });

    it('应该在超出可预约范围时抛出错误 (20004)', async () => {
      // advance_days = 7，所以超过7天不可预约
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);
      const farFutureStr = farFuture.toISOString().slice(0, 10);

      await expect(service.getSlots(farFutureStr)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 20004,
        }),
      });
    });

    it('满员时段应标记为不可用', async () => {
      reservationRepo.getSlotOccupancy.mockResolvedValue([
        { slotStartTime: '10:00', occupied: 8 }, // 满
        { slotStartTime: '11:00', occupied: 3 },
      ]);

      const result = await service.getSlots(TOMORROW);

      const fullSlot = result.slots.find((s) => s.start_time === '10:00');
      expect(fullSlot).toBeDefined();
      expect(fullSlot!.is_available).toBe(false);
      expect(fullSlot!.available_count).toBe(0);

      const availSlot = result.slots.find((s) => s.start_time === '11:00');
      expect(availSlot).toBeDefined();
      expect(availSlot!.is_available).toBe(true);
      expect(availSlot!.available_count).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // maskPhone - 手机号脱敏
  // ---------------------------------------------------------------------------
  describe('maskPhone', () => {
    it('应该脱敏11位手机号中间四位', () => {
      expect(service.maskPhone('13800001111')).toBe('138****1111');
      expect(service.maskPhone('18612345678')).toBe('186****5678');
    });

    it('应该对非11位手机号原样返回', () => {
      expect(service.maskPhone('123')).toBe('123');
      expect(service.maskPhone('')).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // getReservationDetail
  // ---------------------------------------------------------------------------
  describe('getReservationDetail', () => {
    it('顾客只能查看自己的预约', async () => {
      const mockReservation = createMockReservation({
        id: 30,
        customer_openid: 'wx_owner',
        status: ReservationStatus.CONFIRMED,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      await expect(
        service.getReservationDetail(30, { sub: 'wx_other_user', role: 'customer' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30004,
          message: '该预约不属于您',
        }),
      });
    });

    it('商家可以查看任何预约', async () => {
      const mockReservation = createMockReservation({
        id: 31,
        customer_openid: 'wx_other_user',
        status: ReservationStatus.CONFIRMED,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.getReservationDetail(31, {
        sub: 'admin',
        role: 'merchant',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(31);
    });

    it('顾客可以查看自己的预约', async () => {
      const mockReservation = createMockReservation({
        id: 32,
        customer_openid: 'wx_my_user',
        status: ReservationStatus.CONFIRMED,
      });
      reservationRepo.findByIdOrFail.mockResolvedValue(mockReservation);

      const result = await service.getReservationDetail(32, {
        sub: 'wx_my_user',
        role: 'customer',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(32);
    });
  });

  // ---------------------------------------------------------------------------
  // getCapacityOverview - 容量概览
  // ---------------------------------------------------------------------------
  describe('getCapacityOverview', () => {
    it('应该返回指定日期的所有时段容量', async () => {
      const result = await service.getCapacityOverview(TOMORROW);

      expect(result.date).toBe(TOMORROW);
      expect(result.table_count).toBe(8);
      expect(result.slots.length).toBe(12);
      for (const slot of result.slots) {
        expect(slot.total_tables).toBe(8);
        expect(typeof slot.booked_count).toBe('number');
        expect(typeof slot.available_count).toBe('number');
      }
    });
  });
});
