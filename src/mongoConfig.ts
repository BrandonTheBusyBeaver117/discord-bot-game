import dotenv from 'dotenv';
dotenv.config();

const { MONGODB_URL } = process.env;

if (!MONGODB_URL) {
    throw new Error('Environment variables are missing');
}

const mongoConfig: Record<string, string> = {
    MONGODB_URL,
};

export default mongoConfig;
