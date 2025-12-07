
"""
Adaptive Security: Threat Promotion Script
Role: The "Judge" 👨‍⚖️

This script analyzes Crowd Reports (Layer 3) and promotes confirmed threats
to the Blacklist (Layer 1) for instant blocking.

Usage:
    python scripts/maintenance/promote_threats.py
"""
import sys
import os
import re
from datetime import datetime, timedelta
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.getcwd())

from app.models.database import Detection, Dataset
from app.config import settings

# Configuration
THRESHOLD_REPORTS = 5  # If >5 people report, it's a threat
LOOKBACK_DAYS = 1

def promote_threats():
    print(f"🕵️  Starting Threat Analysis (Lookback: {LOOKBACK_DAYS} days)...")
    
    # 1. Connect to DB
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 2. Find frequent scams (Group by content/hash)
        # Note: In real production we use 'message_hash', but we need 'raw content' to extract phone numbers.
        # We join with 'datasets' table to get raw content.
        
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
             .group_by(Detection.message_hash)
             .having(func.count(Detection.id) >= THRESHOLD_REPORTS)
             .all()
        )
        
        print(f"📊 Found {len(results)} potential threats exceeding threshold ({THRESHOLD_REPORTS}).")
        
        new_threats = []
        
        # 3. Load existing blacklist
        with open("app/data/blacklist.txt", "r") as f:
            existing_blacklist = {line.strip() for line in f if line.strip()}
            
        # 4. Extract Entities (Phone/URL)
        for row in results:
            content = row.content
            # Simple Regex for Phone (08x-xxx-xxxx or 08xxxxxxxx)
            phones = re.findall(r'0\d{1,2}-?\d{3,4}-?\d{4}', content)
            
            # Simple Regex for URL
            urls = re.findall(r'(https?://[^\s]+)', content)
            
            candidates = phones + urls
            
            for item in candidates:
                clean_item = item.replace("-", "").strip() # Normalize
                if clean_item not in existing_blacklist:
                    new_threats.append(clean_item)
                    existing_blacklist.add(clean_item)
        
        # 5. Update Blacklist
        if new_threats:
            print(f"🚨 CONFIRMED: Promoting {len(new_threats)} new threats to Layer 1:")
            with open("app/data/blacklist.txt", "a") as f:
                f.write(f"\n# Auto-Promoted {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}\n")
                for threat in new_threats:
                    print(f"   - {threat}")
                    f.write(f"{threat}\n")
            print("✅ Blacklist updated successfully.")
        else:
            print("✅ No new unique threats found to promote.")
            
    except Exception as e:
        print(f"❌ Error during promotion: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    promote_threats()
