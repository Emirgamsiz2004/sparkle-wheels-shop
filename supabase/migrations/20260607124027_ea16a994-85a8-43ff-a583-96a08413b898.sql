
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to own notifications channel" ON realtime.messages;
CREATE POLICY "Users can only subscribe to own notifications channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications:' || auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can broadcast to own notifications channel" ON realtime.messages;
CREATE POLICY "Authenticated users can broadcast to own notifications channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'notifications:' || auth.uid()::text
);
