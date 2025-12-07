
import logging
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import SessionLocal
from app.models.database import Detection, Dataset
from app.config import settings

logger = logging.getLogger(__name__)

THRESHOLD_REPORTS = 5  # If >5 people report, it's a threat
LOOKBACK_DAYS = 1

def run_promote_threats_task():
    """
    Scheduled task to promote confirmed threats to blacklist.
    """
    logger.info("🔍 Running Adaptive Security Task: Promoting Threats...")
    
    session = SessionLocal()
    try:
        # 1. Find frequent scams
        cutoff = datetime.utcnow() - timedelta(days=LOOKBACK_DAYS)
        
        results = (
             session.query(
                 Detection.message_hash, 
                 func.count(Detection.id).label('count'),
                 Dataset.content
             )
             .join(Dataset, Detection.request_id == Dataset.request_id)
             .filter(Detection.created_at >= cutoff)
             .filter(Detection.is_scam == True)
             .group_by(Detection.message_hash, Dataset.content)
             .having(func.count(Detection.id) >= THRESHOLD_REPORTS)
             .all()
        )
        
        if not results:
            logger.info("✅ No new threats found exceeding threshold.")
            return

        logger.info(f"📊 Found {len(results)} potential threats.")
        
        new_threats = []
        blacklist_path = "app/data/blacklist.txt"
        whitelist_path = "app/data/whitelist.txt"
        
        # 2. Load Lists
        existing_blacklist = _load_list(blacklist_path)
        whitelist = _load_list(whitelist_path)
            
        # 3. Extract Entities
        for row in results:
            content = row.content
            # Phones
            phones = re.findall(r'0\d{1,2}-?\d{3,4}-?\d{4}', content)
            # URLs
            urls = re.findall(r'(https?://[^\s]+)', content)
            
            candidates = phones + urls
            
            for item in candidates:
                clean_item = item.replace("-", "").strip()
                
                # GUARD: Do not ban if in Whitelist
                if clean_item in whitelist:
                    logger.info(f"🛡️ Protected: '{clean_item}' is in Whitelist. Skipping auto-ban.")
                    continue
                    
                if clean_item not in existing_blacklist:
                    new_threats.append(clean_item)
                    existing_blacklist.add(clean_item)


        
        # 4. Update Blacklist
        if new_threats:
            logger.warning(f"🚨 PROMOTING {len(new_threats)} THREATS to Layer 1: {new_threats}")
            with open(blacklist_path, "a") as f:
                f.write(f"\n# Auto-Promoted {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}\n")
                for threat in new_threats:
                    f.write(f"{threat}\n")
        else:
            logger.info("✅ Threats analyzed but no new unique entities found.")
            
    except Exception as e:
        logger.error(f"❌ Error in Adaptive Security Task: {e}", exc_info=True)
    finally:
        session.close()

def _load_list(path: str) -> set:
    try:
        with open(path, "r", encoding='utf-8') as f:
            return {line.strip() for line in f if line.strip() and not line.startswith('#')}
    except FileNotFoundError:
        return set()
