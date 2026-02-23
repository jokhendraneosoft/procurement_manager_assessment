import mongoose from 'mongoose';
import { UserRole } from '@/types/user.types';
import { OrderStatus } from '@/types/order.types';
import {
    createOrderService,
    getOrderByIdService,
    getAllOrdersService,
    updateOrderStatusService,
} from '@/modules/orders/order.service';

jest.mock('@/modules/orders/order.repository', () => ({
    orderRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
        count: jest.fn(),
        save: jest.fn(),
    },
}));

const { orderRepository } = require('@/modules/orders/order.repository');

describe('order.service', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrderService', () => {
        it('should create order with PM id', async () => {
            const created = { _id: 'ord-1', procurementManager: validId };
            (orderRepository.create as jest.Mock).mockResolvedValue(created);

            const result = await createOrderService(
                { client: validId } as any,
                validId,
            );
            expect(orderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    procurementManager: expect.any(mongoose.Types.ObjectId),
                }),
            );
            expect(result).toEqual(created);
        });
    });

    describe('getOrderByIdService', () => {
        it('should throw badRequest for invalid order id', async () => {
            await expect(
                getOrderByIdService('invalid', 'user-id', UserRole.ADMIN),
            ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid Order ID' });
        });

        it('should throw notFound when order does not exist', async () => {
            (orderRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(
                getOrderByIdService(validId, 'user-id', UserRole.PROCUREMENT_MANAGER),
            ).rejects.toMatchObject({ statusCode: 404, message: 'Order not found' });
        });

        it('should return order when PM owns it', async () => {
            const order = {
                _id: validId,
                procurementManager: { _id: { toString: () => 'pm-1' } },
                client: {},
                inspectionManager: null,
            };
            (orderRepository.findById as jest.Mock).mockResolvedValue(order);

            const result = await getOrderByIdService(validId, 'pm-1', UserRole.PROCUREMENT_MANAGER);
            expect(result).toEqual(order);
        });

        it('should throw forbidden when Client views another client order', async () => {
            const order = {
                _id: validId,
                client: { _id: { toString: () => 'other-client' } },
            };
            (orderRepository.findById as jest.Mock).mockResolvedValue(order);

            await expect(
                getOrderByIdService(validId, 'my-client-id', UserRole.CLIENT),
            ).rejects.toMatchObject({
                statusCode: 403,
                message: 'You can only view your own orders',
            });
        });
    });

    describe('getAllOrdersService', () => {
        it('should filter by client when role is CLIENT', async () => {
            const clientId = new mongoose.Types.ObjectId().toString();
            const items = [{ _id: '1' }];
            (orderRepository.find as jest.Mock).mockResolvedValue(items);
            (orderRepository.count as jest.Mock).mockResolvedValue(1);

            const result = await getAllOrdersService(clientId, UserRole.CLIENT, 1, 10);
            expect(result.items).toEqual(items);
            expect(orderRepository.find).toHaveBeenCalledWith(
                { client: expect.any(mongoose.Types.ObjectId) },
                0,
                10,
            );
        });
    });

    describe('updateOrderStatusService', () => {
        it('should throw notFound when order does not exist', async () => {
            (orderRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(
                updateOrderStatusService(validId, OrderStatus.IN_PROGRESS, 'pm-1', UserRole.PROCUREMENT_MANAGER),
            ).rejects.toMatchObject({ statusCode: 404, message: 'Order not found' });
        });

        it('should throw forbidden when Client tries to update status', async () => {
            const order = { status: OrderStatus.PENDING, procurementManager: 'pm-1', save: jest.fn() };
            (orderRepository.findById as jest.Mock).mockResolvedValue(order);

            await expect(
                updateOrderStatusService(validId, OrderStatus.IN_PROGRESS, 'client-1', UserRole.CLIENT),
            ).rejects.toMatchObject({
                statusCode: 403,
                message: 'Clients cannot update order status',
            });
        });

        it('should update status when PM owns the order', async () => {
            const order = {
                status: OrderStatus.PENDING,
                procurementManager: { toString: () => 'pm-1' },
                save: jest.fn().mockResolvedValue(undefined),
            };
            (orderRepository.findById as jest.Mock).mockResolvedValue(order);
            (orderRepository.save as jest.Mock).mockResolvedValue({ ...order, status: OrderStatus.IN_PROGRESS });

            const result = await updateOrderStatusService(
                validId,
                OrderStatus.IN_PROGRESS,
                'pm-1',
                UserRole.PROCUREMENT_MANAGER,
            );
            expect(order.status).toBe(OrderStatus.IN_PROGRESS);
        });
    });
});
