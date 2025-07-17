const API_BASE_URL = 'http://localhost:4000/api/v1';

export interface GlucosePrediction {
  success: boolean;
  predictions: {
    "30min": number;
    "60min": number;
  };
  message: string;
}

export interface HealthData {
  glucose: number;
  sleep: string;
  heartRate: number;
  steps: number;
  lastReading: string;
}

export interface PredictionRequest {
  glucose_readings: number[];
  meal_flags?: number[];
  activity_levels?: number[];
  sleep_quality?: number;
  horizon?: '30min' | '60min' | 'both';
}

// Generate sample glucose readings for demonstration
const generateSampleGlucoseReadings = (currentValue: number = 120): number[] => {
  const readings: number[] = [];
  let value = currentValue;
  
  for (let i = 0; i < 18; i++) {
    value += (Math.random() - 0.5) * 10;
    value = Math.max(70, Math.min(250, value));
    readings.push(Math.round(value));
  }
  
  return readings;
};

export const apiService = {
  // Fetch glucose predictions from LSTM model
  async getGlucosePrediction(currentGlucose: number): Promise<GlucosePrediction> {
    try {
      const glucose_readings = generateSampleGlucoseReadings(currentGlucose);
      const meal_flags = new Array(18).fill(0);
      const activity_levels = new Array(18).fill(0);
      
      const requestData: PredictionRequest = {
        glucose_readings,
        meal_flags,
        activity_levels,
        sleep_quality: 1,
        horizon: 'both'
      };

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching glucose prediction:', error);
      throw error;
    }
  },

  // Fetch sample prediction for testing
  async getSamplePrediction(): Promise<GlucosePrediction> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict/sample`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sample prediction:', error);
      throw error;
    }
  },

  // Check API health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict/health`);
      return response.ok;
    } catch (error) {
      console.error('Error checking API health:', error);
      return false;
    }
  },

  // Get mock health data - in a real implementation, this would come from sensors/database
  async getHealthData(): Promise<HealthData> {
    try {
      // For now, return mock data with some variation
      const baseGlucose = 100 + Math.random() * 100;
      const glucose = Math.round(baseGlucose);
      
      const sleepHours = 7 + Math.random() * 2;
      const sleepMinutes = Math.random() * 60;
      const sleep = `${Math.floor(sleepHours)}h ${Math.floor(sleepMinutes)}m`;
      
      const heartRate = 70 + Math.random() * 30;
      const steps = 5000 + Math.random() * 5000;
      
      return {
        glucose,
        sleep,
        heartRate: Math.round(heartRate),
        steps: Math.round(steps),
        lastReading: "5 min ago"
      };
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  },

  // Get glucose trend data
  async getGlucoseTrend(): Promise<number[]> {
    try {
      // Generate trend data with some realistic variation
      const trendData: number[] = [];
      let currentValue = 100 + Math.random() * 50;
      
      for (let i = 0; i < 24; i++) {
        currentValue += (Math.random() - 0.5) * 8;
        currentValue = Math.max(70, Math.min(200, currentValue));
        trendData.push(Math.round(currentValue));
      }
      
      return trendData;
    } catch (error) {
      console.error('Error fetching glucose trend:', error);
      throw error;
    }
  }
}; 