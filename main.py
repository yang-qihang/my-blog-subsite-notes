from datetime import datetime, timedelta, timezone

def define_env(env):
    @env.macro
    def build_time_cst():
        # Get UTC time and add 8 hours
        cst_time = datetime.now(timezone.utc) + timedelta(hours=8)
        return cst_time.strftime('%Y-%m-%d %H:%M')
