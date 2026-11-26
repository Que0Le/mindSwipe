DBeaver → New Connection → PostgreSQL:

Field	Value
Host	192.168.178.38
Port	5432 (session mode — use this for DBeaver)
Database	postgres
Username	postgres.your-tenant-id
Password	(the box's POSTGRES_PASSWORD — fetch it, below)

Get the password yourself (I'm not printing it into the chat) — run this and paste the result into DBeaver:

ssh dev1-u26 "grep '^POSTGRES_PASSWORD=' ~/mindswipe/mindswipe-project/.env | cut -d= -f2-"

Notes:

Port 6543 is the transaction pooler — don't use it in DBeaver (it drops session features like prepared statements and temp tables, which DBeaver relies on). Stick to 5432.
If you hit an SSL error, in the connection's SSL tab set SSL mode to disable (it's a LAN connection to your own box).
The username really is postgres.your-tenant-id (dot-separated) because supavisor derives it from POOLER_TENANT_ID, which is still the default your-tenant-id.

Off-LAN alternative (SSH tunnel): in DBeaver's SSH tab, enable tunnel → Host 192.168.178.38, your SSH user/key (the same dev1-u26 config), then set the main Host to 127.0.0.1 / Port 5432, same username/password. That routes through the box.

No-install option: Supabase Studio in a browser at http://192.168.178.38:8000 (basic-auth user supabase, password = DASHBOARD_PASSWORD in the same .env) gives you a SQL editor + table browser without DBeaver.