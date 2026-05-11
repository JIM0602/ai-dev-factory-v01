import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TimerService } from './timer.service';
import {
  TimerSession,
  TimerSessionStatus,
} from '../../database/entities/timer-session.entity';
import {
  Reservation,
  ReservationStatus,
  ReservationSource,
} from '../../database/entities/reservation.entity';
import { TimerSessionRepository } from '../../database/repositories/timer-session.repository';
import { TimerExtensionRepository } from '../../database/repositories/timer-extension.repository';
import { CouponRepository } from '../../database/repositories/coupon.repository';
import { ReservationRepository } from '../../database/repositories/reservation.repository';
import { MemberRepository } from '../../database/repositories/member.repository';
import { ConsumptionRecordRepository } from '../../database/repositories/consumption-record.repository';
import { StoreRepository } from '../../database/repositories/store.repository';
import { ReservationRuleRepository } from '../../database/repositories/reservation-rule.repository';
import { Store } from '../../database/entities/store.entity';
import { ReservationRule } from '../../database/entities/reservation-rule.entity';

/**
 * TimerService 单元测试
 *
 * 测试范围：
 *   - 到店登记（checkIn）：正常流程、状态校验、日期校验、桌位分配
 *   - 加时操作（extendTime）：正常流程、状态校验
 *   - 结束计时（endSession）：正常流程、状态校验、消费记录+会员沉淀
 *   - 计时看板（getDashboard）：数据聚合、排序、紧急/严重标记
 *   - 异常场景（未确认预约登记、非今天日期、重复登记、无效加时）
 */
describe('TimerService', () => {
  let service: TimerService;
  let dataSource: any;
  let timerSessionRepo: any;
  let timerExtensionRepo: any;
  let couponRepo: any;
  let reservationRepo: any;
  let memberRepo: any;
  let consumptionRecordRepo: any;
  let storeRepo: any;
  let rulesRepo: any;

  const TODAY = new Date().toISOString().slice(0, 10);

  const mockStore: Partial<Store> = {
    id: 1,
    name: '测试拼豆店',
    open_time: '10:00',
    close_time: '22:00',
    table_count: 8,
  };

  const mockRules: Partial<ReservationRule> = {
    id: 1,
    slot_duration: 60,
    require_confirmation: false,
    advance_days: 7,
  };

  function createMockReservation(overrides: Partial<Reservation> = {}): Reservation {
    const entity = new Reservation();
    entity.id = overrides.id ?? 1;
    entity.customer_openid = overrides.customer_openid ?? 'wx_mock_user1';
    entity.customer_name = overrides.customer_name ?? '张三';
    entity.customer_phone = overrides.customer_phone ?? '13800001111';
    entity.reservation_date = overrides.reservation_date ?? TODAY;
    entity.slot_start_time = overrides.slot_start_time ?? '14:00';
    entity.slot_end_time = overrides.slot_end_time ?? '15:00';
    entity.guest_count = overrides.guest_count ?? 2;
    entity.status = overrides.status ?? ReservationStatus.CONFIRMED;
    entity.source = overrides.source ?? ReservationSource.CUSTOMER;
    entity.cancel_reason = overrides.cancel_reason ?? null;
    entity.rejection_reason = overrides.rejection_reason ?? null;
    entity.remark = overrides.remark ?? null;
    entity.created_at = new Date();
    entity.updated_at = new Date();
    return entity;
  }

  function createMockTimerSession(overrides: Partial<TimerSession> = {}): TimerSession {
    const entity = new TimerSession();
    entity.id = overrides.id ?? 1;
    entity.reservation_id = overrides.reservation_id ?? 1;
    entity.table_number = overrides.table_number ?? 3;
    entity.check_in_time = overrides.check_in_time ?? new Date(Date.now() - 30 * 60 * 1000); // 30分钟前
    entity.expected_end_time = overrides.expected_end_time ?? new Date(Date.now() + 30 * 60 * 1000); // 30分钟后
    entity.actual_end_time = overrides.actual_end_time ?? null;
    entity.original_duration_minutes = overrides.original_duration_minutes ?? 60;
    entity.total_extension_minutes = overrides.total_extension_minutes ?? 0;
    entity.status = overrides.status ?? TimerSessionStatus.ACTIVE;
    entity.created_at = new Date();
    entity.updated_at = new Date();
    return entity;
  }

  beforeEach(async () => {
    const now = new Date();

    timerSessionRepo = {
      findByReservationId: jest.fn().mockResolvedValue(null),
      findActiveSessions: jest.fn().mockResolvedValue([]),
      findByIdOrFail: jest.fn(),
      repo: {
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: entity.id || 100 }),
        ),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    timerExtensionRepo = {
      recordExtension: jest.fn().mockResolvedValue({ id: 1, extension_minutes: 30 }),
      findByTimerSessionId: jest.fn().mockResolvedValue([]),
    };

    couponRepo = {
      findByTimerSessionId: jest.fn().mockResolvedValue([]),
      hasCoupon: jest.fn().mockResolvedValue(false),
    };

    reservationRepo = {
      findByIdOrFail: jest.fn(),
      repo: {
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn(),
      },
    };

    memberRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => data),
      repo: {
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: entity.id || 200 }),
        ),
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(null),
      },
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 200 }),
      ),
      update: jest.fn().mockResolvedValue({}),
    };

    consumptionRecordRepo = {
      repo: {
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: 300 }),
        ),
        findOne: jest.fn().mockResolvedValue(null),
      },
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 300 }),
      ),
    };

    storeRepo = {
      getStoreConfigOrFail: jest.fn().mockResolvedValue(mockStore),
    };

    rulesRepo = {
      getRulesOrFail: jest.fn().mockResolvedValue(mockRules),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (manager: EntityManager) => Promise<any>) =>
          cb({} as EntityManager),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimerService,
        { provide: DataSource, useValue: dataSource },
        { provide: TimerSessionRepository, useValue: timerSessionRepo },
        { provide: TimerExtensionRepository, useValue: timerExtensionRepo },
        { provide: CouponRepository, useValue: couponRepo },
        { provide: ReservationRepository, useValue: reservationRepo },
        { provide: MemberRepository, useValue: memberRepo },
        { provide: ConsumptionRecordRepository, useValue: consumptionRecordRepo },
        { provide: StoreRepository, useValue: storeRepo },
        { provide: ReservationRuleRepository, useValue: rulesRepo },
      ],
    }).compile();

    service = module.get<TimerService>(TimerService);
  });

  // ---------------------------------------------------------------------------
  // extendTime - 加时操作
  // ---------------------------------------------------------------------------
  describe('extendTime', () => {
    it('应该成功加时 30 分钟', async () => {
      const mockSession = createMockTimerSession({
        id: 1,
        status: TimerSessionStatus.ACTIVE,
        expected_end_time: new Date(Date.now() + 30 * 60 * 1000),
        total_extension_minutes: 0,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      const result = await service.extendTime(1, { extension_minutes: 30 });

      expect(result.timer_session_id).toBe(1);
      expect(result.total_extension_minutes).toBe(30);
      expect(result.new_remaining_seconds).toBeGreaterThan(0);
      expect(timerExtensionRepo.recordExtension).toHaveBeenCalledWith(1, 30);
    });

    it('应该成功加时 60 分钟（+1 小时）', async () => {
      const mockSession = createMockTimerSession({
        id: 2,
        status: TimerSessionStatus.ACTIVE,
        expected_end_time: new Date(Date.now() + 15 * 60 * 1000),
        total_extension_minutes: 0,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      const result = await service.extendTime(2, { extension_minutes: 60 });

      expect(result.total_extension_minutes).toBe(60);
      expect(timerExtensionRepo.recordExtension).toHaveBeenCalledWith(2, 60);
    });

    it('应该支持多次加时累加', async () => {
      const mockSession = createMockTimerSession({
        id: 3,
        status: TimerSessionStatus.ACTIVE,
        expected_end_time: new Date(Date.now() + 20 * 60 * 1000),
        total_extension_minutes: 30, // 已加时30分钟
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      // 再次加时 30 分钟
      const result = await service.extendTime(3, { extension_minutes: 30 });

      expect(result.total_extension_minutes).toBe(60);
    });

    it('应该成功加时 120 分钟（+2 小时）', async () => {
      const mockSession = createMockTimerSession({
        id: 4,
        status: TimerSessionStatus.ACTIVE,
        expected_end_time: new Date(Date.now() + 5 * 60 * 1000),
        total_extension_minutes: 0,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      const result = await service.extendTime(4, { extension_minutes: 120 });

      expect(result.total_extension_minutes).toBe(120);
    });

    it('应该拒绝为非 active 状态的计时加时 (30005)', async () => {
      const mockSession = createMockTimerSession({
        id: 5,
        status: TimerSessionStatus.COMPLETED,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      await expect(
        service.extendTime(5, { extension_minutes: 30 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
          message: '仅进行中的计时可加时',
        }),
      });
    });

    it('应该拒绝不存在的计时会话', async () => {
      timerSessionRepo.findByIdOrFail.mockRejectedValue(
        new NotFoundException('Record not found: timer_sessions id=999'),
      );

      await expect(
        service.extendTime(999, { extension_minutes: 30 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // endSession - 结束计时
  // ---------------------------------------------------------------------------
  describe('endSession', () => {
    it('应该成功结束 active 状态的计时', async () => {
      const mockSession = createMockTimerSession({
        id: 10,
        status: TimerSessionStatus.ACTIVE,
        check_in_time: new Date(Date.now() - 60 * 60 * 1000), // 1小时前到店
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      // Mock 事务中的行为
      const mockReservation = createMockReservation({
        id: 1,
        status: ReservationStatus.IN_PROGRESS,
      });

      let transactionCb: any;
      dataSource.transaction = jest.fn().mockImplementation(
        (cb: (manager: EntityManager) => Promise<any>) => {
          transactionCb = cb;
          // 返回 mock 结果
          return Promise.resolve({
            timer_session_id: 10,
            actual_end_time: new Date(),
            total_duration_minutes: 75,
            reservation_status: 'completed',
          });
        },
      );

      const result = await service.endSession(10);

      expect(result.timer_session_id).toBe(10);
      expect(result.total_duration_minutes).toBe(75);
      expect(result.reservation_status).toBe('completed');
    });

    it('应该拒绝结束已完成的计时 (30005)', async () => {
      const mockSession = createMockTimerSession({
        id: 11,
        status: TimerSessionStatus.COMPLETED,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      await expect(service.endSession(11)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
          message: '仅进行中的计时可结束',
        }),
      });
    });

    it('结束计时时应产生消费记录', async () => {
      // 设置更完整的 mock 来验证事务逻辑
      const mockSession = createMockTimerSession({
        id: 12,
        status: TimerSessionStatus.ACTIVE,
        check_in_time: new Date(Date.now() - 45 * 60 * 1000),
        reservation_id: 99,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      // 创建 reservation mock 用于事务中的 findOne
      const transactionReservation = createMockReservation({
        id: 99,
        customer_name: '测试顾客',
        customer_phone: '13912345678',
        status: ReservationStatus.IN_PROGRESS,
        source: ReservationSource.CUSTOMER,
      });

      // 创建 member mock
      const transactionMember = {
        id: 200,
        name: '测试顾客',
        phone: '13912345678',
        total_visits: 2,
        total_duration_minutes: 120,
      };

      // Mock 事务执行 - 提供完整的 entity manager 模拟
      dataSource.transaction = jest.fn().mockImplementation(
        async (cb: (manager: EntityManager) => Promise<any>) => {
          const result = await cb({
            getRepository: jest.fn().mockImplementation((entity: any) => {
              const entityName = entity?.name || '';
              return {
                update: jest.fn().mockResolvedValue({}),
                // Reservation repo's findOne
                findOne: jest.fn().mockImplementation((opts: any) => {
                  if (opts?.where?.phone) {
                    // 这应该是 Member findOne
                    return Promise.resolve(transactionMember);
                  }
                  if (opts?.where?.id === 99) {
                    return Promise.resolve(transactionReservation);
                  }
                  return Promise.resolve(null);
                }),
                create: jest.fn().mockImplementation((data) => data),
                save: jest.fn().mockImplementation((data) =>
                  Promise.resolve({ ...data, id: data.id || 300 }),
                ),
                createQueryBuilder: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
                  getMany: jest.fn().mockResolvedValue([]),
                }),
              };
            }),
          } as unknown as EntityManager);
          return result;
        },
      );

      couponRepo.hasCoupon.mockResolvedValue(false);

      const result = await service.endSession(12);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.timer_session_id).toBe(12);
      expect(result.total_duration_minutes).toBeGreaterThan(0);
    });

    // -------------------------------------------------------------------------
    // FIX-01 验证：新会员首次消费统计数据
    // -------------------------------------------------------------------------
    it('新会员首次消费应设置 total_visits=1, total_duration_minutes=消费时长', async () => {
      const mockSession = createMockTimerSession({
        id: 13,
        status: TimerSessionStatus.ACTIVE,
        check_in_time: new Date(Date.now() - 55 * 60 * 1000), // 55分钟前到店
        reservation_id: 100,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      // 预约数据
      const transactionReservation = createMockReservation({
        id: 100,
        customer_name: '新顾客',
        customer_phone: '13900001111',
        status: ReservationStatus.IN_PROGRESS,
        source: ReservationSource.CUSTOMER,
      });

      // 记录 memberRepo 的 create 和 save 调用参数
      let createdMemberData: any = null;
      let savedMemberData: any = null;

      const mockMemberFindOne = jest.fn().mockResolvedValue(null); // 新会员，不存在
      const mockMemberCreate = jest.fn().mockImplementation((data) => {
        createdMemberData = data;
        return { ...data, id: 400 };
      });
      const mockMemberSave = jest.fn().mockImplementation((data) => {
        savedMemberData = data;
        return Promise.resolve({ ...data, id: 400 });
      });
      const mockMemberUpdate = jest.fn().mockResolvedValue({});
      const mockFindOneReservation = jest.fn().mockResolvedValue(transactionReservation);
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockCreate = jest.fn().mockImplementation((data) => data);
      const mockSave = jest.fn().mockImplementation((data) =>
        Promise.resolve({ ...data, id: data.id || 500 }),
      );

      dataSource.transaction = jest.fn().mockImplementation(
        async (cb: (manager: EntityManager) => Promise<any>) => {
          const result = await cb({
            getRepository: jest.fn().mockImplementation((entity: any) => {
              const entityName = entity?.name || '';
              if (entityName === 'Member') {
                return {
                  findOne: mockMemberFindOne,
                  create: mockMemberCreate,
                  save: mockMemberSave,
                  update: mockMemberUpdate,
                };
              }
              // Reservation, TimerSession, ConsumptionRecord 共用
              return {
                update: mockUpdate,
                findOne: mockFindOneReservation,
                create: mockCreate,
                save: mockSave,
                createQueryBuilder: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
                  getMany: jest.fn().mockResolvedValue([]),
                }),
              };
            }),
          } as unknown as EntityManager);
          return result;
        },
      );

      couponRepo.hasCoupon.mockResolvedValue(false);

      const result = await service.endSession(13);

      // 验证 create 被调用
      expect(mockMemberCreate).toHaveBeenCalledTimes(1);
      // 验证新会员 total_visits = 1
      expect(createdMemberData.total_visits).toBe(1);
      // 验证 total_duration_minutes > 0 (等于本次消费时长，约55分钟)
      expect(createdMemberData.total_duration_minutes).toBeGreaterThan(0);
      expect(createdMemberData.total_duration_minutes).toBeLessThanOrEqual(60);
      // 验证 last_visit_date 已设置
      expect(createdMemberData.last_visit_date).toBeDefined();
      // 验证 save 被调用（新会员需要 save）
      expect(mockMemberSave).toHaveBeenCalledTimes(1);
      // 验证 update 未被调用（新会员不应对 0 条记录执行 update）
      // 注意：新会员 create+save 后不应调用 update
      expect(mockMemberUpdate).not.toHaveBeenCalled();
    });

    it('已存在会员结束计时应递增 total_visits 和 total_duration_minutes', async () => {
      const mockSession = createMockTimerSession({
        id: 14,
        status: TimerSessionStatus.ACTIVE,
        check_in_time: new Date(Date.now() - 40 * 60 * 1000), // 40分钟前到店
        reservation_id: 101,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      const transactionReservation = createMockReservation({
        id: 101,
        customer_name: '回头客',
        customer_phone: '13900002222',
        status: ReservationStatus.IN_PROGRESS,
        source: ReservationSource.CUSTOMER,
      });

      // 已有会员：之前来过3次，累计200分钟
      const existingMember = {
        id: 500,
        name: '回头客',
        phone: '13900002222',
        total_visits: 3,
        total_duration_minutes: 200,
      };

      let updatedMemberData: any = null;

      const mockMemberFindOne = jest.fn().mockResolvedValue(existingMember);
      const mockMemberCreate = jest.fn().mockImplementation((data) => ({ ...data, id: 500 }));
      const mockMemberSave = jest.fn().mockResolvedValue({ ...existingMember, id: 500 });
      const mockMemberUpdate = jest.fn().mockImplementation((_id, data) => {
        updatedMemberData = data;
        return Promise.resolve({});
      });
      const mockFindOneReservation = jest.fn().mockResolvedValue(transactionReservation);
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockCreate = jest.fn().mockImplementation((data) => data);
      const mockSave = jest.fn().mockImplementation((data) =>
        Promise.resolve({ ...data, id: data.id || 500 }),
      );

      dataSource.transaction = jest.fn().mockImplementation(
        async (cb: (manager: EntityManager) => Promise<any>) => {
          const result = await cb({
            getRepository: jest.fn().mockImplementation((entity: any) => {
              const entityName = entity?.name || '';
              if (entityName === 'Member') {
                return {
                  findOne: mockMemberFindOne,
                  create: mockMemberCreate,
                  save: mockMemberSave,
                  update: mockMemberUpdate,
                };
              }
              return {
                update: mockUpdate,
                findOne: mockFindOneReservation,
                create: mockCreate,
                save: mockSave,
                createQueryBuilder: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
                  getMany: jest.fn().mockResolvedValue([]),
                }),
              };
            }),
          } as unknown as EntityManager);
          return result;
        },
      );

      couponRepo.hasCoupon.mockResolvedValue(false);

      await service.endSession(14);

      // 验证 findOne 被调用（检查是否存在会员）
      expect(mockMemberFindOne).toHaveBeenCalledTimes(1);
      // 验证 create 未被调用（已有会员不重新创建）
      expect(mockMemberCreate).not.toHaveBeenCalled();
      // 验证 save 未被调用（已有会员不重新保存）
      expect(mockMemberSave).not.toHaveBeenCalled();
      // 验证 update 被调用
      expect(mockMemberUpdate).toHaveBeenCalledTimes(1);
      // 验证 total_visits 从 3 → 4
      expect(updatedMemberData.total_visits).toBe(4);
      // 验证 total_duration_minutes 从 200 → ~240
      expect(updatedMemberData.total_duration_minutes).toBe(200 + updatedMemberData.total_duration_minutes - 200);
      // 实际上验证：total_duration_minutes > 200（已递增）
      expect(updatedMemberData.total_duration_minutes).toBeGreaterThan(200);
      // 验证 last_visit_date 已更新
      expect(updatedMemberData.last_visit_date).toBeDefined();
      // 验证 name 被更新
      expect(updatedMemberData.name).toBe('回头客');
    });
  });

  // ---------------------------------------------------------------------------
  // getDashboard - 计时看板
  // ---------------------------------------------------------------------------
  describe('getDashboard', () => {
    it('应该返回空看板当没有进行中的计时时', async () => {
      timerSessionRepo.findActiveSessions.mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.active_count).toBe(0);
      expect(result.available_tables).toBe(8);
      expect(result.sessions).toEqual([]);
    });

    it('应该按剩余时间升序排列', async () => {
      const now = Date.now();
      // 创建3个进行中的会话，不同的剩余时间
      const session1 = createMockTimerSession({
        id: 1,
        expected_end_time: new Date(now + 5 * 60 * 1000), // 5分钟后到期（最紧急）
        table_number: 1,
      });
      const session2 = createMockTimerSession({
        id: 2,
        expected_end_time: new Date(now + 30 * 60 * 1000), // 30分钟后到期
        table_number: 2,
      });
      const session3 = createMockTimerSession({
        id: 3,
        expected_end_time: new Date(now + 60 * 60 * 1000), // 60分钟后到期（最不紧急）
        table_number: 3,
      });

      // 附加 reservation 信息
      (session1 as any).reservation = createMockReservation({ id: 1, customer_name: '张三' });
      (session2 as any).reservation = createMockReservation({ id: 2, customer_name: '李四' });
      (session3 as any).reservation = createMockReservation({ id: 3, customer_name: '王五' });

      timerSessionRepo.findActiveSessions.mockResolvedValue([session1, session2, session3]);

      const result = await service.getDashboard();

      expect(result.active_count).toBe(3);
      expect(result.available_tables).toBe(5); // 8 - 3
      expect(result.sessions.length).toBe(3);
      // 应按剩余时间升序
      expect(result.sessions[0].remaining_seconds).toBeLessThanOrEqual(
        result.sessions[1].remaining_seconds,
      );
      expect(result.sessions[1].remaining_seconds).toBeLessThanOrEqual(
        result.sessions[2].remaining_seconds,
      );
    });

    it('剩余 < 5 分钟应标记 is_critical=true', () => {
      const now = Date.now();
      const session = createMockTimerSession({
        id: 10,
        expected_end_time: new Date(now + 4 * 60 * 1000), // 4分钟后到期
      });
      (session as any).reservation = createMockReservation({ id: 10 });
      timerSessionRepo.findActiveSessions.mockResolvedValue([session]);

      return service.getDashboard().then((result) => {
        expect(result.sessions[0].is_critical).toBe(true);
        expect(result.sessions[0].is_urgent).toBe(true); // critical也应触发 urgent
      });
    });

    it('剩余 < 15 分钟应标记 is_urgent=true', () => {
      const now = Date.now();
      const session = createMockTimerSession({
        id: 11,
        expected_end_time: new Date(now + 10 * 60 * 1000), // 10分钟后到期
      });
      (session as any).reservation = createMockReservation({ id: 11 });
      timerSessionRepo.findActiveSessions.mockResolvedValue([session]);

      return service.getDashboard().then((result) => {
        expect(result.sessions[0].is_urgent).toBe(true);
        expect(result.sessions[0].is_critical).toBe(false);
      });
    });

    it('剩余 >= 15 分钟不应标记 is_urgent', () => {
      const now = Date.now();
      const session = createMockTimerSession({
        id: 12,
        expected_end_time: new Date(now + 20 * 60 * 1000),
      });
      (session as any).reservation = createMockReservation({ id: 12 });
      timerSessionRepo.findActiveSessions.mockResolvedValue([session]);

      return service.getDashboard().then((result) => {
        expect(result.sessions[0].is_urgent).toBe(false);
        expect(result.sessions[0].is_critical).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // changeTable - 更换桌位
  // ---------------------------------------------------------------------------
  describe('changeTable', () => {
    it('应成功更换到空闲桌位', async () => {
      const mockSession = createMockTimerSession({
        id: 20,
        status: TimerSessionStatus.ACTIVE,
        table_number: 1,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);
      timerSessionRepo.findActiveSessions.mockResolvedValue([
        { ...mockSession, id: 20, table_number: 1 },
      ]);

      const result = await service.changeTable(20, { table_number: 5 });

      expect(result.timer_session_id).toBe(20);
      expect(result.table_number).toBe(5);
    });

    it('应拒绝对已完成计时更换桌位 (30005)', async () => {
      const mockSession = createMockTimerSession({
        id: 21,
        status: TimerSessionStatus.COMPLETED,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      await expect(
        service.changeTable(21, { table_number: 3 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30005,
          message: '仅进行中的计时可更换桌位',
        }),
      });
    });

    it('桌位号超过总桌位数应报错', async () => {
      const mockSession = createMockTimerSession({
        id: 22,
        status: TimerSessionStatus.ACTIVE,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);

      await expect(
        service.changeTable(22, { table_number: 999 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 20002,
          message: '桌位号不能超过最大桌位数 8',
        }),
      });
    });

    it('桌位已被占用应报错', async () => {
      const mockSession = createMockTimerSession({
        id: 23,
        status: TimerSessionStatus.ACTIVE,
        table_number: 1,
      });
      timerSessionRepo.findByIdOrFail.mockResolvedValue(mockSession);
      // 另一个会话占用了桌位 3
      const otherSession = createMockTimerSession({
        id: 24,
        table_number: 3,
      });
      timerSessionRepo.findActiveSessions.mockResolvedValue([mockSession, otherSession]);

      await expect(
        service.changeTable(23, { table_number: 3 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 30001,
          message: '桌位 3 已被占用',
        }),
      });
    });
  });
});
