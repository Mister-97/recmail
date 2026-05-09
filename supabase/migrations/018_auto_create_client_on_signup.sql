-- Update the auth trigger to also auto-create a clients row and link it
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_client_id UUID;
BEGIN
  -- Create a client row for this new user
  INSERT INTO public.clients (business_name, owner_id)
  VALUES ('My Business', NEW.id)
  RETURNING id INTO new_client_id;

  -- Create the users row linked to that client
  INSERT INTO public.users (id, email, client_id, role)
  VALUES (NEW.id, NEW.email, new_client_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
