ALTER TABLE ticket_attachments
  ADD COLUMN file_storage_path VARCHAR(400) NULL AFTER file_name,
  ADD COLUMN file_mime_type VARCHAR(120) NULL AFTER file_storage_path,
  ADD COLUMN file_size_bytes BIGINT UNSIGNED NULL AFTER file_mime_type;
