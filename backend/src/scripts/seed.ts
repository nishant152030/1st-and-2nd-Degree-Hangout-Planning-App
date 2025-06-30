import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import User from '../models/User';
import Hangout from '../models/Hangout';
import ConnectionRequest from '../models/ConnectionRequest';
import { MOCK_USERS_DATA } from '../constants'; // Adjust path as needed

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MongoDB URI not found in .env file');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected for Seeding`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Hangout.deleteMany({});
        await ConnectionRequest.deleteMany({});
        console.log('Old data cleared.');

        // The mock data uses 'userX' as IDs. We need to create real Mongo _id values
        // and then map the old IDs to the new ones to correctly link friends.
        const createdUsers = [];
        const idMap = new Map<string, string>();

        for (const userData of MOCK_USERS_DATA) {
            // We can't save the 'id' field directly as it conflicts with mongoose.
            const { id, approvedSecondDegreeConnections, ...restOfData } = userData;

            const newUser = new User({ ...restOfData });
            const savedUser = await newUser.save() as mongoose.Document & { _id: mongoose.Types.ObjectId };

            idMap.set(id, savedUser._id.toString());
            createdUsers.push(savedUser);
        }

        // Now, update friend lists with the new MongoDB IDs
        for (const userData of MOCK_USERS_DATA) {
            const newId = idMap.get(userData.id);
            if (!newId) continue;

            const newFriendIds = userData.firstDegreeFriendIds
                .map(friendId => idMap.get(friendId))
                .filter((id): id is string => !!id);

            await User.findByIdAndUpdate(newId, { firstDegreeFriendIds: newFriendIds });
        }

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error during data import: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany({});
        await Hangout.deleteMany({});
        await ConnectionRequest.deleteMany({});
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Error during data destruction: ${error}`);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();
    if (process.argv[2] === '-d') {
        await destroyData();
    } else {
        await importData();
    }
};

run();