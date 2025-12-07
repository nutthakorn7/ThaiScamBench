# Scripts Directory

This directory contains utility scripts organized by purpose.

## 📁 Directory Structure

```
scripts/
├── deployment/     # Deployment and provisioning
├── migrations/     # Database migrations
├── utils/          # Utility and helper scripts
└── maintenance/    # Maintenance and cleanup tasks
```

---

## 🚀 Deployment Scripts (`deployment/`)

### `deploy.sh`
Deploy the application to production server.

```bash
./scripts/deployment/deploy.sh
```

### `deploy_linode.sh`
Deploy to Linode server with specific configurations.

```bash
./scripts/deployment/deploy_linode.sh
```

### `provision_linode.sh`
Provision a new Linode server with required dependencies.

```bash
./scripts/deployment/provision_linode.sh
```

---

## 🗄️ Database Migration Scripts (`migrations/`)

### `migrate_to_postgres.py`
Migrate data from SQLite to PostgreSQL.

```bash
python scripts/migrations/migrate_to_postgres.py
```

### `migrate_add_audit_logs.py`
Add audit logging tables to the database.

```bash
python scripts/migrations/migrate_add_audit_logs.py
```

### `migrate_add_key_expiration.py`
Add API key expiration fields.

```bash
python scripts/migrations/migrate_add_key_expiration.py
```

### `migrate_add_reason_advice.py`
Add reason and advice fields to detection results.

```bash
python scripts/migrations/migrate_add_reason_advice.py
```

---

## 🛠️ Utility Scripts (`utils/`)

### `create_partner.py`
Create a new partner API account.

```bash
python scripts/utils/create_partner.py
```

### `hash_password.py`
Generate bcrypt password hash for admin accounts.

```bash
python scripts/utils/hash_password.py
```

### `init_db.py`
Initialize the database with tables and initial data.

```bash
python scripts/utils/init_db.py
```

### `create_dataset.py`
Create training/test datasets from collected data.

```bash
python scripts/utils/create_dataset.py
```

### `evaluate.py`
Evaluate model performance on test dataset.

```bash
python scripts/utils/evaluate.py
```

### `fix_database.sh`
Fix common database issues and inconsistencies.

```bash
./scripts/utils/fix_database.sh
```

---

## 🔧 Maintenance Scripts (`maintenance/`)

### `cleanup_old_data.py`
Clean up old detection history based on retention policy.

```bash
python scripts/maintenance/cleanup_old_data.py
```

**Recommended:** Run daily via cron
```bash
0 2 * * * cd /path/to/ThaiScamBench && python scripts/maintenance/cleanup_old_data.py
```

### `promote_threats.py`
Promote frequently reported threats to active threat list.

```bash
python scripts/maintenance/promote_threats.py
```

### `production_test.py`
Run comprehensive production API tests.

```bash
python scripts/maintenance/production_test.py
```

---

## 📝 Usage Notes

- All Python scripts should be run from the project root directory
- Make sure virtual environment is activated before running Python scripts
- Shell scripts (.sh) should have execute permissions (`chmod +x`)
- Check script comments for specific requirements and dependencies

## 🔐 Security

- Never commit sensitive data or credentials
- Use environment variables for configuration
- Review scripts before execution in production
