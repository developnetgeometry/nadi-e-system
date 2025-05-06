
import { UserType } from "@/types/auth";

export interface UserFormData {
  email: string;
  full_name: string;
  user_type: UserType;
  user_group?: string;
  phone_number?: string;
  ic_number: string;
  password?: string;
  confirm_password?: string;
  gender?: string; // Added gender field
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  user_group?: string;
  phone_number?: string;
  ic_number?: string;
  gender?: string; // Added gender field
}
