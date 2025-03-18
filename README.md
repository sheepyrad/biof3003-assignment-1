# HeartLen App

## Project Overview

The HeartLen App is a web-based tool designed to process photoplethysmography (PPG) signals captured via a webcam. It calculates heart rate, heart rate variability (HRV), and signal quality using machine learning models. The processed data can be saved to a MongoDB database for further analysis.

## Repository Structure

```
/biof3003-assignment-1
  ├── /app
  │    ├── /components       # React components (e.g., CameraFeed, ChartComponent)
  │    ├── /hooks            # Custom hooks (e.g., usePPGProcessing, useSignalQuality)
  │    ├── /api              # Backend API routes (e.g., save-record)
  │    └── page.tsx          # Main application file
  ├── /public                # Public assets (e.g., TensorFlow.js model)
  ├── /types                 # TypeScript types (if applicable)
  ├── README.md              # Developer instructions
  └── package.json           # Dependencies and script
```

## Installation Instructions

### Prerequisites
- Node.js (v20.18.1 or higher)
- MongoDB Atlas account (or local MongoDB instance)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/heartlen-app.git
   cd heartlen-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open the app in your browser:
   - Navigate to http://localhost:3000

## Linking to Database

### Connecting to MongoDB
To link the app to your MongoDB database:
1. Create a MongoDB Atlas cluster or use a local MongoDB instance.
2. Copy the connection string from MongoDB Atlas and paste it into the `.env.local` file as shown above.
3. Ensure the database has a collection named `records` to store PPG data.

## Deployment

### Deployment to Vercel
This app is designed to be easily deployed on Vercel:

1. Build the production version:
   ```bash
   npm run build
   ```

2. Deploy to Vercel:
   - Connect your GitHub repository to Vercel
   - Configure environment variables in the Vercel dashboard
   - Vercel will automatically detect the Next.js app and deploy it

Alternatively, you can use the [Vercel CLI](https://vercel.com/docs/cli):
   ```bash
   npm install -g vercel
   vercel
   ```

## Features

- Real-time PPG signal processing from webcam input
- Heart rate calculation using frequency domain analysis
- Heart rate variability (HRV) metrics calculation
- Signal quality assessment
- Data storage in MongoDB for historical analysis
- Interactive charts for visualization

## Technologies Used

- Next.js 14 with App Router
- TypeScript
- TensorFlowjs for signal quality prediction
- MongoDB for data storage
- Tailwind CSS for styling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
