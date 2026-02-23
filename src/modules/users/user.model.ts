import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../types/user.types';

export interface IUser extends Document {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    role: UserRole;
    createdBy?: Types.ObjectId;
    assignedProcurementManager?: Types.ObjectId;
    isActive: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true,
            unique: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        mobile: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
            match: [/^\+?[1-9]\d{9,14}$/, 'Please provide a valid mobile number'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Never return password in queries unless explicitly asked
        },
        role: {
            type: String,
            enum: {
                values: Object.values(UserRole),
                message: 'Role must be one of: admin, procurement_manager, inspection_manager, client',
            },
            required: [true, 'Role is required'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedProcurementManager: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform(_doc, ret) {
                delete (ret as any).password;
                return ret;
            },
        },
    },
);

// ── Pre-save: hash password only when modified ────────────────────────────────
// ── Pre-save: hash password only when modified ────────────────────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// ── Role-based validation ─────────────────────────────────────────────────────
userSchema.pre('validate', async function () {
    const emailRoles: UserRole[] = [
        UserRole.ADMIN,
        UserRole.PROCUREMENT_MANAGER,
        UserRole.CLIENT,
    ];

    if (emailRoles.includes(this.role) && !this.email) {
        this.invalidate('email', `Email is required for role: ${this.role}`);
    }

    if (this.role === UserRole.INSPECTION_MANAGER && !this.mobile) {
        this.invalidate('mobile', 'Mobile number is required for inspection manager');
    }
});

// ── Instance method: compare passwords ───────────────────────────────────────
userSchema.methods.comparePassword = async function (
    candidatePassword: string,
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
