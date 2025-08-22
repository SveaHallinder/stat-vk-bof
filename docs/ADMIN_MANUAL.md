# Admin Manual

## Create invite
1. Navigate to **Admin** → **Skapa inbjudan**.
2. Copy the link via **Kopiera länk**.

## Accept invite
1. Recipient opens `/invite/<token>` while logged out.
2. Set name and password; after submission you are redirected to `/login`.

## Reset password
```sql
UPDATE handlers SET password_hash = crypt('newpassword', gen_salt('bf')) WHERE id = <handler_id>;
```

## Common errors
- `invalid_token`: Token not found or malformed.
- `expired_token`: Token has passed its expiry.
- `already_used`: Token was already used.
