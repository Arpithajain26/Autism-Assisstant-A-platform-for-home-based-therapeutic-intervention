import csv
import random
from datetime import datetime, timedelta

def generate_data():
    random.seed(42)
    start_date = datetime(2026, 1, 5)

    focus_areas = ['Communication', 'Social Skills', 'Sensory and Motor', 'Cognitive']
    engagement_levels = ['Low', 'Medium', 'High']
    engagement_map = {'Low': 1, 'Medium': 2, 'High': 3}

    # 50 children setup: 75% improving (38), 15% plateau (7), 10% regression (5)
    children = []
    for i in range(1, 51):
        child_id = f"child_{i:02d}"
        level = random.choice([1, 2, 3])
        # Base starting score between 40 and 65
        base_score = random.randint(40, 65)

        if i <= 38:
            traj = 'improving'
        elif i <= 45:
            traj = 'plateau'
        else:
            traj = 'regression'

        children.append({
            'child_id': child_id,
            'level': level,
            'base_score': base_score,
            'trajectory': traj
        })

    session_rows = []
    weekly_rows = []

    for child in children:
        c_id = child['child_id']
        c_level = child['level']
        traj = child['trajectory']
        cur_score = float(child['base_score'])
        prior_week_avg = cur_score

        for week in range(1, 13):
            # Compute weekly progression target
            if traj == 'improving':
                weekly_shift = random.uniform(1.5, 4.0)
            elif traj == 'plateau':
                weekly_shift = random.uniform(-1.0, 1.0)
            else: # regression
                if 4 <= week <= 7:
                    weekly_shift = random.uniform(-4.5, -2.0)
                elif week >= 8:
                    weekly_shift = random.uniform(3.0, 5.5)
                else:
                    weekly_shift = random.uniform(-0.5, 1.5)

            cur_score = max(10.0, min(100.0, cur_score + weekly_shift))

            num_sessions = random.randint(2, 5)
            week_start_date = start_date + timedelta(weeks=week - 1)

            week_scores = []
            week_engagements = []

            for s in range(num_sessions):
                session_day = week_start_date + timedelta(days=random.randint(0, 6))
                # Add noise per session
                perf_score = max(0, min(100, int(random.gauss(cur_score, 4.0))))
                
                # Determine engagement correlated with score
                if perf_score >= 70:
                    eng = random.choice(['Medium', 'High', 'High'])
                elif perf_score >= 45:
                    eng = random.choice(['Low', 'Medium', 'High'])
                else:
                    eng = random.choice(['Low', 'Low', 'Medium'])

                duration = random.choice([10, 15, 20, 25, 30])
                fa = random.choice(focus_areas)

                session_rows.append({
                    'child_id': c_id,
                    'session_date': session_day.strftime('%Y-%m-%d'),
                    'week_number': week,
                    'level': c_level,
                    'focus_area': fa,
                    'performance_score': perf_score,
                    'engagement': eng,
                    'duration_min': duration,
                    'prior_week_avg_score': round(prior_week_avg, 2)
                })

                week_scores.append(perf_score)
                week_engagements.append(engagement_map[eng])

            avg_perf = round(sum(week_scores) / len(week_scores), 2)
            avg_eng = round(sum(week_engagements) / len(week_engagements), 2)
            score_delta = round(avg_perf - prior_week_avg, 2)

            # Trend label using threshold band (-5 to +5)
            if score_delta > 5.0:
                trend = 'Improving'
            elif score_delta < -5.0:
                trend = 'Regressing'
            else:
                trend = 'Stable'

            weekly_rows.append({
                'child_id': c_id,
                'week_number': week,
                'level': c_level,
                'avg_performance_score': avg_perf,
                'score_delta': score_delta,
                'session_count': num_sessions,
                'avg_engagement': avg_eng,
                'trend_label': trend
            })

            # Update prior week avg for next week
            prior_week_avg = avg_perf

    # Save synthetic_sessions.csv
    session_headers = ['child_id', 'session_date', 'week_number', 'level', 'focus_area', 'performance_score', 'engagement', 'duration_min', 'prior_week_avg_score']
    with open('synthetic_sessions.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=session_headers)
        writer.writeheader()
        writer.writerows(session_rows)
    print(f"[OK] Generated synthetic_sessions.csv with {len(session_rows)} session rows.")

    # Save weekly_trends.csv
    weekly_headers = ['child_id', 'week_number', 'level', 'avg_performance_score', 'score_delta', 'session_count', 'avg_engagement', 'trend_label']
    with open('weekly_trends.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=weekly_headers)
        writer.writeheader()
        writer.writerows(weekly_rows)
    print(f"[OK] Generated weekly_trends.csv with {len(weekly_rows)} weekly feature rows.")

if __name__ == '__main__':
    generate_data()
