
import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    bio: string;
    profileImageUrl: string;
    phoneNumber: string;
    password: string;
    firstDegreeFriendIds: string[];
    approvedSecondDegreeConnections: string[];
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    bio: { type: String, required: false, default: '' },
    profileImageUrl: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstDegreeFriendIds: [{ type: String, required: true }],
    approvedSecondDegreeConnections: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;