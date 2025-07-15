import logging
from datetime import datetime, timedelta, date
import random
import re

import numpy as np
import pandas as pd
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, func

from db.models import Base, CGMStream, MealEvent, ActivityLog, SleepLog, CGMAggregate, ChatTurn

# --- LOGGING ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
DB_PATH = "data/buhai.db"
HIGH_GI_KEYWORDS = ["rice", "bread", "soda", "cake", "sweet", "chocolate", "kan-on", "tinapay"]

def is_high_gi(food_description: str) -> bool:
    """Simplified check for high-glycemic index foods based on keywords."""
    if not isinstance(food_description, str):
        return False
    return any(keyword in food_description.lower() for keyword in HIGH_GI_KEYWORDS)

class DataHandler:
    def __init__(self, db_session=None, db_path=DB_PATH):
        """Initializes the data handler by connecting to the database."""
        if db_session:
            self.session = db_session
            logger.info("Using provided database session.")
        else:
            try:
                engine = create_engine(f'sqlite:///{db_path}')
                Base.metadata.bind = engine
                DBSession = sessionmaker(bind=engine)
                self.session = DBSession()
                logger.info("Database session created successfully.")
            except Exception as e:
                logger.error(f"Failed to connect to database at {db_path}: {e}", exc_info=True)
                self.session = None

    def _get_effective_today(self, df: pd.DataFrame, requested_date: date) -> date:
        """
        Determines the effective date to use for queries.
        If the requested_date is beyond the latest data point, it uses the latest data point's date.
        This makes the demo work even if the user's clock is ahead of the data.
        """
        latest_data_date = df['date'].max().date()
        if requested_date > latest_data_date:
            logger.warning(f"Requested date {requested_date} is after latest data {latest_data_date}. Using latest data date as 'today'.")
            return latest_data_date
        return requested_date

    def get_last_cgm_readings(self, n: int = 3) -> list:
        """
        Fetches the last N CGM readings from the database.
        """
        if not self.session:
            return []
        
        readings = self.session.query(CGMStream).order_by(CGMStream.timestamp.desc()).limit(n).all()
        return readings

    def get_daily_and_weekly_stats(self, today: date) -> dict:
        """
        Fetches daily and weekly glucose stats by computing them directly from the CGM stream CSV.
        This avoids using pre-aggregated data and respects the requested date.
        """
        try:
            df_stream = pd.read_csv("data/dataset-user/cgm_stream.csv", parse_dates=['timestamp'])
            df_stream['date'] = df_stream['timestamp'].dt.date

            daily_stats = {}
            weekly_stats = {}

            # --- Calculate Daily Stats ---
            day_stream = df_stream[df_stream['date'] == today].copy()
            
            if not day_stream.empty and 'glucose_level' in day_stream.columns and day_stream['glucose_level'].notna().any():
                mean_glucose = day_stream['glucose_level'].mean()
                in_range_count = day_stream['glucose_level'].between(70, 180).sum()
                time_in_range_pct = (in_range_count / len(day_stream)) * 100 if len(day_stream) > 0 else 0
                # Standard GMI formula: 3.31 + 0.02392 * mean_glucose
                gmi = 3.31 + (0.02392 * mean_glucose)

                daily_stats = {
                    "date": today.isoformat(),
                    "mean_glucose": mean_glucose,
                    "time_in_range_pct": time_in_range_pct,
                    "gmi": gmi,
                    "sd": day_stream['glucose_level'].std(),
                    "cv": day_stream['glucose_level'].std() / mean_glucose if mean_glucose and mean_glucose > 0 else 0,
                    "hyper_flag": int((day_stream['glucose_level'] > 180).any()),
                    "hypo_flag": int((day_stream['glucose_level'] < 70).any()),
                    "mage": 0  # MAGE calculation is complex, using placeholder
                }
                logger.info(f"Successfully computed daily stats from stream for {today}")
            else:
                logger.warning(f"No CGM stream data found for {today}. Daily stats will be empty.")
                daily_stats = {"date": today.isoformat(), "mean_glucose": None}

            # --- Calculate Weekly Stats ---
            seven_days_ago = today - timedelta(days=6)  # 7 days including today
            weekly_df = df_stream[
                (df_stream['date'] >= seven_days_ago) &
                (df_stream['date'] <= today)
            ]

            if not weekly_df.empty and 'glucose_level' in weekly_df.columns and weekly_df['glucose_level'].notna().any():
                weekly_mean_glucose = weekly_df['glucose_level'].mean()
                weekly_time_in_range = (weekly_df['glucose_level'].between(70, 180).sum() / len(weekly_df)) * 100 if len(weekly_df) > 0 else 0
                weekly_stats = {
                    "avg_glucose": weekly_mean_glucose,
                    "avg_time_in_range_pct": weekly_time_in_range
                }
                logger.info(f"Successfully computed weekly stats from stream for period ending {today}")
            else:
                logger.warning(f"No CGM stream data found for the week ending {today}. Weekly stats will be empty.")

            return {"daily": daily_stats, "weekly": weekly_stats}

        except Exception as e:
            logger.error(f"Failed to read or process stats from CGM stream CSV: {e}", exc_info=True)
            placeholder_stats = {"date": today.isoformat(), "mean_glucose": None}
            return {"daily": placeholder_stats, "weekly": {}}

    def get_historical_meal_examples(self, food_description: str, n: int = 3) -> list:
        """
        Finds historical meal examples from the CSV that are similar to the given description.
        Similarity is based on shared keywords. Returns a list of dictionaries.
        """
        try:
            df_meals = pd.read_csv("data/dataset-user/meal_events.csv")
            
            # Simple keyword extraction from the new meal description
            keywords = set(re.findall(r'\b\w+\b', food_description.lower()))
            if not keywords:
                return []

            def find_matches(row):
                if not isinstance(row['food_items'], str):
                    return 0
                historical_keywords = set(re.findall(r'\b\w+\b', row['food_items'].lower()))
                return len(keywords.intersection(historical_keywords))

            df_meals['match_score'] = df_meals.apply(find_matches, axis=1)
            
            # Filter for meals with at least one match and valid glucose data
            similar_meals = df_meals[
                (df_meals['match_score'] > 0) &
                (df_meals['glucose_at_t+60min'].notna()) &
                (df_meals['baseline_glucose'].notna())
            ].copy()

            if similar_meals.empty:
                return []

            # Calculate the glucose delta
            similar_meals['delta'] = similar_meals['glucose_at_t+60min'] - similar_meals['baseline_glucose']
            
            # Sort by match score and get the top N
            top_examples = similar_meals.sort_values(by='match_score', ascending=False).head(n)
            
            logger.info(f"Found {len(top_examples)} similar meal examples from historical data.")
            return top_examples[['food_items', 'delta']].to_dict('records')

        except FileNotFoundError:
            logger.warning("meal_events.csv not found, cannot fetch historical examples.")
            return []
        except Exception as e:
            logger.error(f"Failed to get historical meal examples from CSV: {e}")
            return []

    def get_contextual_data_for_insights(self, today: date) -> dict:
        """
        Gathers recent data from various logs to provide context for generating daily insights.
        This reads directly from CSVs for demo purposes.
        """
        insights_context = {
            "recent_meals": [],
            "recent_sleep": [],
            "recent_activity": []
        }
        
        try:
            # Load all potential data sources first
            df_meals = pd.read_csv("data/dataset-user/meal_events.csv", parse_dates=['timestamp'])
            df_meals['date'] = df_meals['timestamp'].dt.date

            df_sleep = pd.read_csv("data/dataset-user/sleep_logs.csv", parse_dates=['sleep_start'])
            df_sleep['date'] = df_sleep['sleep_start'].dt.date

            df_activity = pd.read_csv("data/dataset-user/activity_logs.csv", parse_dates=['timestamp_start'])
            df_activity['date'] = df_activity['timestamp_start'].dt.date

            # The effective date for insights is the date the user is asking about.
            # This ensures the context is relevant to their query.
            effective_today = today
            # A two-day window allows for comparisons like "today vs. yesterday".
            two_days_ago = effective_today - timedelta(days=2)

            # Filter data to the relevant time window based on the user's requested date
            recent_meals = df_meals[df_meals['date'].between(two_days_ago, effective_today, inclusive='both')].copy()
            if not recent_meals.empty:
                insights_context['recent_meals'] = recent_meals[['timestamp', 'food_items', 'glucose_at_t+60min']].tail(3).to_dict('records')

            recent_sleep = df_sleep[df_sleep['date'].between(two_days_ago, effective_today, inclusive='both')].copy()
            if not recent_sleep.empty:
                insights_context['recent_sleep'] = recent_sleep[['sleep_start', 'duration_h', 'sleep_quality']].tail(2).to_dict('records')

            recent_activity = df_activity[df_activity['date'].between(two_days_ago, effective_today, inclusive='both')].copy()
            if not recent_activity.empty:
                insights_context['recent_activity'] = recent_activity[['timestamp_start', 'activity_type', 'duration_min']].tail(3).to_dict('records')

            # Convert datetimes to strings for JSON serialization
            for meal in insights_context['recent_meals']:
                meal['timestamp'] = meal['timestamp'].isoformat() if pd.notnull(meal['timestamp']) else None
            for sleep in insights_context['recent_sleep']:
                sleep['sleep_start'] = sleep['sleep_start'].isoformat() if pd.notnull(sleep['sleep_start']) else None
            for activity in insights_context['recent_activity']:
                activity['timestamp_start'] = activity['timestamp_start'].isoformat() if pd.notnull(activity['timestamp_start']) else None

            logger.info("Successfully gathered contextual data for insights from CSVs.")
            return insights_context

        except Exception as e:
            logger.error(f"Failed to read or process insight data from CSVs: {e}")
            return None

    def add_chat_turn(self, user_id: str, actor: str, message: str, max_turns: int = 8):
        """
        Adds a new chat turn to the database and ensures the history does not exceed max_turns.
        """
        if not self.session:
            logger.error("Cannot add chat turn: no database session.")
            return

        # 1. Add the new turn
        new_turn = ChatTurn(user_id=user_id, actor=actor, message=message)
        self.session.add(new_turn)
        self.session.commit()

        # 2. Trim excess history
        turn_count = self.session.query(ChatTurn).filter_by(user_id=user_id).count()
        if turn_count > max_turns:
            # Find the oldest turns to delete
            turns_to_delete = self.session.query(ChatTurn).filter_by(user_id=user_id) \
                .order_by(ChatTurn.timestamp.asc()) \
                .limit(turn_count - max_turns) \
                .all()
            
            for turn in turns_to_delete:
                self.session.delete(turn)
            self.session.commit()
            logger.info(f"Trimmed {len(turns_to_delete)} old chat turns for user {user_id}.")

    def get_chat_history(self, user_id: str, n: int = 4) -> list:
        """
        Retrieves the last N chat turns for a given user.
        """
        if not self.session:
            return []
        
        history = self.session.query(ChatTurn).filter_by(user_id=user_id) \
            .order_by(ChatTurn.timestamp.desc()) \
            .limit(n) \
            .all()
        
        # Reverse to return in chronological order
        return history[::-1]

    def get_last_log_timestamp(self) -> datetime:
        """
        Finds the latest timestamp from all user-generated log tables.

        Returns:
            datetime: The most recent timestamp found, or None if no logs exist.
        """
        if not self.session:
            logger.error("Cannot fetch data: no database session.")
            return None

        # Query for the max timestamp in each relevant table
        last_meal_time = self.session.query(func.max(MealEvent.timestamp)).scalar()
        last_activity_time = self.session.query(func.max(ActivityLog.timestamp_start)).scalar()
        last_sleep_time = self.session.query(func.max(SleepLog.sleep_start)).scalar()

        # Filter out None values and find the overall maximum
        timestamps = [t for t in [last_meal_time, last_activity_time, last_sleep_time] if t is not None]

        if not timestamps:
            logger.warning("No user logs found in the database.")
            return None

        return max(timestamps)

    def get_last_meal_timestamp(self) -> datetime:
        """
        Finds the latest timestamp from the meal_events table.

        Returns:
            datetime: The most recent meal timestamp, or None if no meal logs exist.
        """
        if not self.session:
            logger.error("Cannot fetch data: no database session.")
            return None

        last_meal_time = self.session.query(func.max(MealEvent.timestamp)).scalar()
        return last_meal_time

    def get_daily_summary(self, target_date: date) -> dict:
        """
        Fetches the aggregated CGM summary for a specific date and the day before.

        Args:
            target_date (date): The primary date for the summary.

        Returns:
            dict: A dictionary containing summary stats for the target date and the previous day.
        """
        if not self.session:
            logger.error("Cannot fetch data: no database session.")
            return None
        
        previous_date = target_date - timedelta(days=1)

        summary_today = self.session.query(CGMAggregate).filter(
            CGMAggregate.date == target_date
        ).first()

        summary_yesterday = self.session.query(CGMAggregate).filter(
            CGMAggregate.date == previous_date
        ).first()

        return {
            "today": summary_today,
            "yesterday": summary_yesterday
        }

    def get_prediction_features(self, end_time: datetime, window_minutes: int = 90) -> pd.DataFrame:
        """
        Fetches and prepares the feature DataFrame needed for an ML prediction.

        Args:
            end_time (datetime): The timestamp for which to make a prediction (e.g., now).
            window_minutes (int): The duration of historical data to fetch.

        Returns:
            pd.DataFrame: A DataFrame with the required features, resampled to 5-minute intervals.
                          Returns an empty DataFrame on error.
        """
        if not self.session:
            logger.error("Cannot fetch data: no database session.")
            return pd.DataFrame()

        start_time = end_time - timedelta(minutes=window_minutes)
        
        # 1. Fetch and process CGM data
        cgm_query = self.session.query(CGMStream).filter(
            CGMStream.timestamp.between(start_time, end_time)
        ).statement
        df_cgm = pd.read_sql(cgm_query, self.session.bind)
        if df_cgm.empty:
            logger.warning("No CGM data found in the specified window.")
            return pd.DataFrame()
            
        df_cgm['timestamp'] = pd.to_datetime(df_cgm['timestamp'])
        df_cgm = df_cgm[['timestamp', 'glucose_level']].set_index('timestamp').resample('5T').mean()
        df_cgm['glucose_level'] = df_cgm['glucose_level'].interpolate(method='linear')
        
        # 2. Fetch and process Meal data for high-GI flag
        meal_query = self.session.query(MealEvent).filter(
            MealEvent.timestamp.between(start_time, end_time)
        ).statement
        df_meal = pd.read_sql(meal_query, self.session.bind)
        df_meal['timestamp'] = pd.to_datetime(df_meal['timestamp'])
        df_meal['meal_flag_hiGI'] = df_meal['food_items'].apply(is_high_gi).astype(int)
        
        df_meal_flags = df_meal.set_index('timestamp')[['meal_flag_hiGI']]
        meal_flags_reindexed = df_meal_flags.reindex(df_cgm.index, fill_value=0)
        df_cgm['meal_flag_hiGI'] = meal_flags_reindexed.rolling(window=f"{window_minutes}min", min_periods=1).max()
        df_cgm['meal_flag_hiGI'].fillna(0, inplace=True)

        # 3. Fetch and process Activity data
        activity_query = self.session.query(ActivityLog).filter(
             ActivityLog.timestamp_start.between(start_time - timedelta(minutes=60), end_time) # Widen search
        ).statement
        df_activity = pd.read_sql(activity_query, self.session.bind)
        intensity_map = {"low": 0, "medium": 1, "high": 2}
        df_activity["activity_intensity"] = df_activity["intensity"].map(intensity_map)
        df_activity['timestamp_start'] = pd.to_datetime(df_activity['timestamp_start'])
        df_cgm["activity_intensity"] = 0.0

        for _, row in df_activity.iterrows():
            act_start = row["timestamp_start"]
            act_end = act_start + pd.to_timedelta(row["duration_min"], unit="m")
            df_cgm.loc[df_cgm.index.between(act_start, act_end), "activity_intensity"] = row["activity_intensity"]

        # 4. Fetch and process Sleep data
        sleep_query = self.session.query(SleepLog).filter(
            SleepLog.sleep_end.between(end_time - timedelta(days=2), end_time)
        ).statement
        df_sleep = pd.read_sql(sleep_query, self.session.bind)
        if not df_sleep.empty:
            quality_map = {"good": 0, "poor": 1}
            last_sleep = df_sleep.sort_values('sleep_end').iloc[-1]
            df_cgm['sleep_quality'] = quality_map.get(last_sleep['sleep_quality'], 0.5) # Default to neutral
        else:
            df_cgm['sleep_quality'] = 0.5 # Default if no sleep data
            
        # 5. Engineer time features
        df_cgm["hour"] = df_cgm.index.hour
        df_cgm["hour_sin"] = np.sin(2 * np.pi * df_cgm["hour"] / 24)
        df_cgm["hour_cos"] = np.cos(2 * np.pi * df_cgm["hour"] / 24)

        # Finalize and ensure correct column order
        features_columns = [
            "glucose_level", "meal_flag_hiGI", "activity_intensity", 
            "sleep_quality", "hour_sin", "hour_cos"
        ]
        final_df = df_cgm[features_columns].copy()
        final_df.ffill(inplace=True) # Fill any gaps from resampling
        final_df.bfill(inplace=True)
        
        if final_df.isnull().values.any():
            logger.warning("Feature DataFrame contains NaNs after processing. Filling with 0.")
            final_df.fillna(0, inplace=True)

        return final_df

    def get_historical_meal_estimate(self, food_description: str) -> float:
        """
        Provides a simple glucose estimate based on historical averages for similar meals,
        factoring in the quantity mentioned in the description.

        Args:
            food_description (str): The description of the meal (e.g., "2 cups of rice").

        Returns:
            float: An estimated glucose value, or a default value if no history is found.
        """
        if not self.session:
            logger.error("Cannot fetch data: no database session.")
            return 140.0 + random.uniform(-2, 2)

        # --- Quantity Parsing ---
        quantity_match = re.search(r'\b(\d+(\.\d+)?)\b', food_description)
        quantity = float(quantity_match.group(1)) if quantity_match else 1.0
        # Basic sanity check for quantity
        if quantity > 10: # Cap quantity to avoid extreme values from faulty parsing
            quantity = 10
        
        logger.info(f"Parsed quantity: {quantity} from description: '{food_description}'")


        # Find keywords in the new meal description
        keywords = [word for word in HIGH_GI_KEYWORDS if word in food_description.lower()]
        
        # Base estimate for a single unit of a high-GI meal
        base_high_gi_estimate = 165.0

        if not keywords:
            # If no high-GI keywords, assume it's a standard meal. Quantity has less impact.
            logger.info("No high-GI keywords found. Returning a default low-GI estimate.")
            # Let's make quantity have a smaller effect on low-GI foods
            return 120.0 + (quantity - 1) * 5 + random.uniform(-2, 2)

        # Build a query to find past meals with similar keywords
        query = self.session.query(MealEvent)
        for keyword in keywords:
            query = query.filter(MealEvent.food_items.like(f'%{keyword}%'))
        
        past_meals = query.limit(10).all()

        if not past_meals:
            logger.warning(f"No similar past meals found for '{food_description}'. Using scaled default estimate.")
            # Scale the default high-GI estimate by the parsed quantity
            return base_high_gi_estimate * quantity * 0.5 + random.uniform(-2, 2) #use 0.5 as factor

        # For each similar meal, find the CGM reading ~30-60 minutes after
        glucose_peaks = []
        for meal in past_meals:
            meal_time = meal.timestamp
            cgm_after = self.session.query(CGMStream.glucose_level).filter(
                CGMStream.timestamp.between(meal_time + timedelta(minutes=25), meal_time + timedelta(minutes=65))
            ).order_by(CGMStream.glucose_level.desc()).first()
            
            if cgm_after:
                glucose_peaks.append(cgm_after[0])

        if not glucose_peaks:
            logger.warning(f"Found {len(past_meals)} similar meals, but no corresponding CGM peaks. Using scaled default.")
            return base_high_gi_estimate * quantity * 0.75 + random.uniform(-2, 2)
        
        # Average the peaks and scale by quantity
        avg_peak = np.mean(glucose_peaks)
        # Simple scaling: assume linear relationship with quantity, but dampen it slightly
        final_estimate = avg_peak + (quantity - 1) * (avg_peak * 0.25) # Add 25% of avg peak per extra unit
        
        logger.info(f"Estimated glucose for '{food_description}' based on {len(glucose_peaks)} similar meals: {final_estimate:.2f} mg/dL")
        
        return final_estimate + random.uniform(-2, 2) 