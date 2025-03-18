// app/api/save-record/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

// Cache to reuse an existing connection
let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Define the schema with an extra field for ppgData and subjectId
const RecordSchema = new mongoose.Schema({
  subjectId: { type: String, required: true, index: true },
  heartRate: {
    bpm: { type: Number, required: true },
    confidence: { type: Number, required: true },
  },
  hrv: {
    sdnn: { type: Number, required: true },
    confidence: { type: Number, required: true },
  },
  ppgData: { type: [Number], required: true },
  timestamp: { type: Date, default: Date.now },
});

const Record = mongoose.models.Record || mongoose.model('Record', RecordSchema);

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Ensure subjectId is provided
    if (!body.subjectId) {
      return NextResponse.json(
        { success: false, error: "Subject ID is required" },
        { status: 400 }
      );
    }

    const newRecord = await Record.create({
      subjectId: body.subjectId,
      heartRate: body.heartRate,
      hrv: body.hrv,
      ppgData: body.ppgData, // The whole ppgData array is posted here
      timestamp: body.timestamp || new Date(),
    });

    return NextResponse.json(
      { success: true, data: newRecord },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Get subjectId from query parameters
    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');
    
    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: "Subject ID is required" },
        { status: 400 }
      );
    }
    
    // Get all records for the subject
    const records = await Record.find({ subjectId }).sort({ timestamp: -1 });
    
    if (records.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          data: { 
            avgHeartRate: 0, 
            avgHRV: 0, 
            lastAccess: null 
          } 
        },
        { status: 200 }
      );
    }
    
    // Calculate averages
    const totalHeartRate = records.reduce((sum, record) => sum + record.heartRate.bpm, 0);
    const totalHRV = records.reduce((sum, record) => sum + record.hrv.sdnn, 0);
    const avgHeartRate = totalHeartRate / records.length;
    const avgHRV = totalHRV / records.length;
    
    // Get last access date
    const lastAccess = records[0].timestamp;
    
    return NextResponse.json(
      { 
        success: true, 
        data: {
          avgHeartRate,
          avgHRV,
          lastAccess: lastAccess.toISOString()
        } 
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}