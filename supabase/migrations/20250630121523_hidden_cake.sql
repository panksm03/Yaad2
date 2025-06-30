/*
  # Create tags table

  1. New Tables
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `family_id` (uuid, foreign key to families)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `tags` table
    - Add policy for family members to read tags
    - Add policy for family members to create tags
  3. Indexes
    - Add index on family_id for faster queries
    - Add index on name for searching
    - Add unique constraint on family_id + name
*/

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policy for family members to read tags
CREATE POLICY "Family members can read family tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for family members to create tags
CREATE POLICY "Family members can create tags"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- Policy for tag creators and family admins to update tags
CREATE POLICY "Tag creators and family admins can update tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for tag creators and family admins to delete tags
CREATE POLICY "Tag creators and family admins can delete tags"
  ON tags
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tags_family_id_idx ON tags(family_id);
CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);
CREATE INDEX IF NOT EXISTS tags_created_by_idx ON tags(created_by);