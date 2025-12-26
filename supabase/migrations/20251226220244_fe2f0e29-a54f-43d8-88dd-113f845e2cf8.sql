-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'surgeon', 'data_entry', 'viewer');

-- Create enum for sex
CREATE TYPE public.sex_type AS ENUM ('Male', 'Female', 'Other');

-- Create enum for eye selection
CREATE TYPE public.eye_type AS ENUM ('RE', 'LE');

-- Create enum for surgery types
CREATE TYPE public.surgery_type AS ENUM ('PK', 'Tectonic PK', 'TPK', 'DSAEK', 'DALK', 'DMEK', 'Others');

-- Create enum for IOL options
CREATE TYPE public.iol_option AS ENUM ('with IOL', 'without IOL', '±IOL');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients (waiting list) table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wl_number SERIAL NOT NULL,
    date_of_registration DATE NOT NULL DEFAULT CURRENT_DATE,
    eb_number TEXT,
    patient_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex sex_type NOT NULL,
    address TEXT,
    contact_numbers TEXT[] DEFAULT '{}',
    diagnosis_eye eye_type,
    diagnosis TEXT,
    diagnosis_eye_left eye_type,
    diagnosis_left TEXT,
    surgery_eye eye_type,
    surgery_type surgery_type,
    surgery_custom TEXT,
    iol_option iol_option,
    remarks TEXT,
    surgeon_name TEXT,
    is_operated BOOLEAN DEFAULT false,
    operation_date DATE,
    donor_eye_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donors table
CREATE TABLE public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number SERIAL NOT NULL,
    donor_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex sex_type NOT NULL,
    cause_of_death TEXT,
    address TEXT,
    death_to_retrieval_hours INTEGER DEFAULT 0,
    death_to_retrieval_minutes INTEGER DEFAULT 0,
    source_of_awareness TEXT,
    eye_number_right TEXT NOT NULL,
    eye_number_left TEXT NOT NULL,
    retrieval_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donor_eyes table for tissue tracking
CREATE TABLE public.donor_eyes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
    eye_number TEXT NOT NULL UNIQUE,
    eye_side eye_type NOT NULL,
    is_assigned BOOLEAN DEFAULT false,
    assigned_to_patient_id UUID REFERENCES public.patients(id),
    assigned_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create eye_bank_settings table for storing bank start date
CREATE TABLE public.eye_bank_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_start_date DATE NOT NULL DEFAULT '2020-01-01',
    bank_name TEXT DEFAULT 'Eye Bank',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.eye_bank_settings (bank_name) VALUES ('Eye Bank');

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_eyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eye_bank_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any role (for authenticated access)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

-- RLS Policies for patients (all authenticated staff can access)
CREATE POLICY "Staff can view patients"
ON public.patients FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid()) AND NOT public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Staff can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid()) AND NOT public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Admins can delete patients"
ON public.patients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for donors
CREATE POLICY "Staff can view donors"
ON public.donors FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can insert donors"
ON public.donors FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid()) AND NOT public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Staff can update donors"
ON public.donors FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid()) AND NOT public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Admins can delete donors"
ON public.donors FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for donor_eyes
CREATE POLICY "Staff can view donor eyes"
ON public.donor_eyes FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can manage donor eyes"
ON public.donor_eyes FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid()) AND NOT public.has_role(auth.uid(), 'viewer'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for eye_bank_settings
CREATE POLICY "All authenticated can view settings"
ON public.eye_bank_settings FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can update settings"
ON public.eye_bank_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to create donor_eyes when donor is created
CREATE OR REPLACE FUNCTION public.handle_new_donor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.donor_eyes (donor_id, eye_number, eye_side)
  VALUES 
    (NEW.id, NEW.eye_number_right, 'RE'),
    (NEW.id, NEW.eye_number_left, 'LE');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donor_created
  AFTER INSERT ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_donor();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();