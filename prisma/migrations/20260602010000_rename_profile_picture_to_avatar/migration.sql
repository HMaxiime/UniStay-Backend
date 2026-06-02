-- Preserve profile image data across both legacy field names.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'profilePicture'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "profilePicture" TO "avatar";
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'Avatar'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "Avatar" TO "avatar";
  END IF;
END $$;
