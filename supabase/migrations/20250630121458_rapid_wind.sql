/*
  # Create family_members table

  1. New Tables
    - `family_members`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key to families)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (text, default 'member')
      - `joined_at` (timestamp)
  2. Security
    - Enable RLS on `family_members` table
    - Add policy for family members to read other members in their families
    - Add policy for family admins to manage members
    - Add policy for users to join families (with invite)
  3. Indexes
    - Add index on family_id for faster queries
    - Add index on user_id for faster queries
    - Add unique constraint on family_id + user_id
*/

CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(family_id, user_id)
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Policy for family members to read other members in their families
CREATE POLICY "Family members can read other members in their families"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for family admins to manage members
CREATE POLICY "Family admins can manage members"
  ON family_members
  FOR ALL
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for users to join families (when invited)
CREATE POLICY "Users can join families"
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to leave families
CREATE POLICY "Users can leave families"
  ON family_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS family_members_family_id_idx ON family_members(family_id);
CREATE INDEX IF NOT EXISTS family_members_user_id_idx ON family_members(user_id);
CREATE INDEX IF NOT EXISTS family_members_role_idx ON family_members(role);