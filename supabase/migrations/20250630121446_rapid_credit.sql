/*
  # Create families table

  1. New Tables
    - `families`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `created_by` (uuid, foreign key to auth.users)
      - `privacy_level` (text, default 'family-only')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `families` table
    - Add policy for family members to read their families
    - Add policy for authenticated users to create families
    - Add policy for family creators to update their families
*/

CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_level text DEFAULT 'family-only' CHECK (privacy_level IN ('private', 'family-only', 'extended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Policy for family members to read families they belong to
CREATE POLICY "Family members can read their families"
  ON families
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for authenticated users to create families
CREATE POLICY "Authenticated users can create families"
  ON families
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy for family creators and admins to update families
CREATE POLICY "Family creators and admins can update families"
  ON families
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for family creators and admins to delete families
CREATE POLICY "Family creators and admins can delete families"
  ON families
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_families_updated_at'
  ) THEN
    CREATE TRIGGER update_families_updated_at
      BEFORE UPDATE ON families
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;