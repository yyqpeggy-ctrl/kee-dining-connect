
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles: users can read their own roles, admins can manage all
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now tighten RLS on existing tables: require authentication

-- event_participants: only authenticated users
DROP POLICY IF EXISTS "Anyone can view participants" ON public.event_participants;
DROP POLICY IF EXISTS "Anyone can insert participants" ON public.event_participants;
DROP POLICY IF EXISTS "Anyone can update participants" ON public.event_participants;
DROP POLICY IF EXISTS "Anyone can delete participants" ON public.event_participants;

CREATE POLICY "Authenticated users can view participants" ON public.event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert participants" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update participants" ON public.event_participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete participants" ON public.event_participants FOR DELETE TO authenticated USING (true);

-- event_notifications: only authenticated users
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.event_notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.event_notifications;
DROP POLICY IF EXISTS "Anyone can update notifications" ON public.event_notifications;

CREATE POLICY "Authenticated users can view notifications" ON public.event_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notifications" ON public.event_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications" ON public.event_notifications FOR UPDATE TO authenticated USING (true);

-- event_reminder_rules: only authenticated users
DROP POLICY IF EXISTS "Anyone can manage rules" ON public.event_reminder_rules;
DROP POLICY IF EXISTS "Anyone can view rules" ON public.event_reminder_rules;

CREATE POLICY "Authenticated users can view rules" ON public.event_reminder_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rules" ON public.event_reminder_rules FOR ALL TO authenticated USING (true);

-- menu_items: public read, authenticated write
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can delete menu items" ON public.menu_items;

CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (true);
