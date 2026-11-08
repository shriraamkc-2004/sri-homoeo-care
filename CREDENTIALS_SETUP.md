# Temporary seed credentials (CHANGE AFTER FIRST LOGIN)

These passwords are for **initial bootstrap only**. Change them immediately in production.

| Account | Phone / Email | Temporary password |
|---------|----------------|--------------------|
| Doctor | +919443726526 / doctor@srihomoeoclinic.com | `ChangeMe_Doctor_5397!` |
| Admin | +919791426526 / admin@srihomoeoclinic.com | `ChangeMe_Admin_5397!` |
| Member | +919791426527 / member@srihomoeoclinic.com | `ChangeMe_Member_5397!` |
| Demo patient | +919876543210 / suresh@example.com | `ChangeMe_Patient_Demo!` |

## Apply hashes to an existing database

```bash
mysql -u sri_app_user -p sri_homoeo_clinic < Sri/database/migration_secure_seed_passwords.sql
```

## Rotate MySQL server password

If a DB password was ever shared in chat or docs:

```sql
ALTER USER 'sri_app_user'@'%' IDENTIFIED BY 'NEW_LONG_RANDOM_PASSWORD';
FLUSH PRIVILEGES;
```

Update host `.env` `MYSQL_PASSWORD` and restart the app (`pm2 reload`).
