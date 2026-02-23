import { Schema, model, Document, Types } from 'mongoose';
import { OrderStatus } from '../../types/order.types';

export interface IOrder extends Document {
    orderNumber: string;
    client: Types.ObjectId;
    procurementManager: Types.ObjectId;
    inspectionManager?: Types.ObjectId;
    checklist?: Types.ObjectId;
    status: OrderStatus;
    notes?: string;
}

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: {
            type: String,
            unique: true,
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Client is required'],
        },
        procurementManager: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Procurement manager is required'],
        },
        inspectionManager: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        checklist: {
            type: Schema.Types.ObjectId,
            ref: 'Checklist',
            default: null,
        },
        status: {
            type: String,
            enum: {
                values: Object.values(OrderStatus),
                message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
            },
            default: OrderStatus.PENDING,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true, versionKey: false },
);

// ── Auto-generate order number before save ────────────────────────────────────
// ── Auto-generate order number before save ────────────────────────────────────
orderSchema.pre('save', async function () {
    if (!this.isNew) return;
    const count = await model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
});

export const Order = model<IOrder>('Order', orderSchema);
