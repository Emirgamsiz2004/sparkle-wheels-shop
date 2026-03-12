-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net;

-- Create function to notify Make.com when a new vehicle is created
create or replace function notify_make_vehicle_created()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://hook.eu1.make.com/dqt33t15bylujh6frpmjfx760bn7werp',
    body := jsonb_build_object(
      'event_type', 'vehicle.created',
      'id', NEW.id,
      'merk', NEW.merk,
      'model', NEW.model,
      'bouwjaar', NEW.bouwjaar,
      'kleur', NEW.kleur,
      'kenteken', NEW.kenteken,
      'status', NEW.status,
      'inkoopprijs', NEW.inkoopprijs,
      'inkoop_datum', NEW.inkoop_datum
    )
  );
  return NEW;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists vehicle_created_webhook on vehicles;

-- Create new trigger
create trigger vehicle_created_webhook
  after insert on vehicles
  for each row execute function notify_make_vehicle_created();