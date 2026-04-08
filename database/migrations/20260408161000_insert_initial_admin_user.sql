INSERT INTO users (
  name,
  email,
  password_hash,
  must_change_password,
  password_changed_at,
  status
)
SELECT
  'Programador',
  'programador@linher.com.mx',
  '$2b$12$jYMMNtZrnhZ/ewNenye3H.TAUfQ67n6YPRrdSdXMOMaqvblNPXyVG',
  0,
  NOW(),
  'active'
WHERE NOT EXISTS (
  SELECT 1
  FROM users
  WHERE email = 'programador@linher.com.mx'
);

INSERT IGNORE INTO user_roles (
  user_id,
  role_id,
  assigned_by_user_id
)
SELECT u.id, r.id, NULL
FROM users u
INNER JOIN roles r
  ON r.role_key = 'admin'
WHERE u.email = 'programador@linher.com.mx';
