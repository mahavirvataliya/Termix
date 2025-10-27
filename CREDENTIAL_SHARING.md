# Credential Sharing Feature

## Overview

Termix now supports sharing SSH credentials between users. This feature allows credential owners to grant access to their credentials to other users, with optional restrictions to specific hosts.

## Features

- **User-to-User Sharing**: Share credentials with specific users
- **Host Restrictions**: Optionally limit shared credentials to specific hosts
- **Read-Only Access**: Shared credentials can be used but not modified by recipients
- **Full Audit Trail**: All sharing operations are logged
- **Owner Control**: Only credential owners can manage shares

## API Endpoints

### 1. Share a Credential

Share a credential with another user.

**Endpoint:** `POST /credentials/:id/share`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "sharedWithUserId": "user-id-456",
  "hostIds": [1, 2, 3]  // Optional: restrict to specific hosts
}
```

**Response (201 Created):**
```json
{
  "message": "Credential shared successfully"
}
```

**Response (200 OK) if share already exists:**
```json
{
  "message": "Credential share updated successfully"
}
```

### 2. Unshare a Credential

Remove access to a shared credential.

**Endpoint:** `DELETE /credentials/:id/share/:sharedWithUserId`

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
{
  "message": "Credential unshared successfully"
}
```

### 3. List Shares for a Credential

Get all users who have access to a credential.

**Endpoint:** `GET /credentials/:id/shares`

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "credentialId": 123,
    "sharedWithUserId": "user-id-456",
    "sharedWithUsername": "john.doe",
    "hostIds": [1, 2, 3],
    "createdAt": "2025-10-27T10:00:00.000Z",
    "updatedAt": "2025-10-27T10:00:00.000Z"
  }
]
```

### 4. Get Users List

Get all users available for sharing (excludes current user).

**Endpoint:** `GET /credentials/users/list`

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
[
  {
    "id": "user-id-456",
    "username": "john.doe"
  },
  {
    "id": "user-id-789",
    "username": "jane.smith"
  }
]
```

### 5. Get All Credentials (Updated)

The existing credentials endpoint now includes shared credentials.

**Endpoint:** `GET /credentials`

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
[
  {
    "id": 123,
    "name": "My Production Server",
    "username": "ubuntu",
    "isShared": false,
    ...
  },
  {
    "id": 456,
    "name": "Shared Database Credential",
    "username": "dbuser",
    "isShared": true,
    "ownerId": "user-id-123",
    "ownerUsername": "admin",
    ...
  }
]
```

### 6. Get Single Credential (Updated)

Access to individual credentials now includes shared credentials.

**Endpoint:** `GET /credentials/:id`

**Authentication:** Required (JWT)

**Response:** Returns credential with sensitive data if user owns it or has shared access.

## Database Schema

### ssh_credential_shares Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| credential_id | INTEGER | Foreign key to ssh_credentials |
| owner_id | TEXT | Foreign key to users (owner) |
| shared_with_user_id | TEXT | Foreign key to users (recipient) |
| host_ids | TEXT | Comma-separated list of host IDs (optional) |
| created_at | TEXT | Timestamp of share creation |
| updated_at | TEXT | Timestamp of last update |

**Constraints:**
- UNIQUE(credential_id, shared_with_user_id) - Prevents duplicate shares

## Use Cases

### Example 1: Share a Database Credential

Alice wants to share her production database credential with Bob:

```bash
curl -X POST http://localhost:8080/credentials/123/share \
  -H "Authorization: Bearer <alice-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sharedWithUserId": "bob-user-id"
  }'
```

Bob can now use credential #123 to connect to the database, but cannot modify it.

### Example 2: Share with Host Restrictions

Alice wants to share her SSH credential with Bob, but only for specific hosts:

```bash
curl -X POST http://localhost:8080/credentials/123/share \
  -H "Authorization: Bearer <alice-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sharedWithUserId": "bob-user-id",
    "hostIds": [1, 5, 10]
  }'
```

Bob can use credential #123, but the application can enforce that it's only used with hosts 1, 5, and 10.

### Example 3: View All Shares

Alice wants to see who has access to her credential:

```bash
curl -X GET http://localhost:8080/credentials/123/shares \
  -H "Authorization: Bearer <alice-token>"
```

### Example 4: Remove Access

Alice wants to revoke Bob's access:

```bash
curl -X DELETE http://localhost:8080/credentials/123/share/bob-user-id \
  -H "Authorization: Bearer <alice-token>"
```

## Security Considerations

1. **Authentication Required**: All endpoints require JWT authentication
2. **Ownership Validation**: Only credential owners can share/unshare
3. **Read-Only Access**: Recipients can use but not modify shared credentials
4. **Audit Logging**: All sharing operations are logged
5. **Data Encryption**: Shared credentials maintain the same encryption as owned credentials
6. **Access Control**: Recipients cannot view the list of other users who have access

## Migration Notes

- The `ssh_credential_shares` table is created automatically on first run
- Existing databases will have the table added without data loss
- No action required from users to enable this feature
- Backward compatible with existing credential management

## Limitations

1. **Host Restrictions**: The `hostIds` field is informational and must be enforced by the application logic when applying credentials to hosts
2. **Group Sharing**: Currently only supports individual user sharing (not groups)
3. **Nested Sharing**: Recipients cannot re-share credentials they've received

## Future Enhancements

Potential improvements for future versions:
- Group-based sharing
- Permission levels (view-only, use-only, etc.)
- Separate junction table for host restrictions
- Notification system for share events
- Expiration dates for shares
