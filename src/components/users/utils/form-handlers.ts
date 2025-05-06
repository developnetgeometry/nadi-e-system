
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/auth";
import { UserFormData } from "../types";

/**
 * Handle the creation of a new user
 * @param data Form data
 * @returns Created user
 */
export const handleCreateUser = async (data: UserFormData): Promise<any> => {
  try {
    // First, create the user account
    const { data: userData, error: createError } = await supabase.functions.invoke('create-user', {
      body: {
        email: data.email,
        fullName: data.full_name,
        userType: data.user_type,
        userGroup: data.user_group || null,
        phoneNumber: data.phone_number || null,
        icNumber: data.ic_number,
        password: data.password!,
      },
    });

    if (createError) throw createError;
    if (!userData) throw new Error("Failed to create user");

    // Create profile in the corresponding table based on user group
    if (data.user_group) {
      switch (data.user_group) {
        case '1': // MCMC
          if (data.position_id) {
            await supabase.from('nd_mcmc_profile').insert({
              user_id: userData.id,
              fullname: data.full_name,
              work_email: data.email,
              mobile_no: data.phone_number,
              ic_no: data.ic_number,
              position_id: data.position_id,
              is_active: true,
            });
          }
          break;
          
        case '3': // TP (Tech Partner)
          await supabase.from('nd_tech_partner_profile').insert({
            user_id: userData.id,
            fullname: data.full_name,
            work_email: data.email,
            mobile_no: data.phone_number,
            ic_no: data.ic_number,
            personal_email: data.personal_email,
            join_date: data.join_date || null,
            qualification: data.qualification || null,
            dob: data.dob || null,
            place_of_birth: data.place_of_birth || null,
            marital_status: data.marital_status || null,
            race_id: data.race_id || null,
            religion_id: data.religion_id || null,
            nationality_id: data.nationality_id || null,
            is_active: true,
          });
          break;
          
        case '2': // DUSP
          if (data.position_id) {
            await supabase.from('nd_dusp_profile').insert({
              user_id: userData.id,
              fullname: data.full_name,
              work_email: data.email,
              mobile_no: data.phone_number,
              ic_no: data.ic_number,
              position_id: data.position_id,
              is_active: true,
            });
          }
          break;
          
        case '4': // SSO
          if (data.position_id) {
            await supabase.from('nd_sso_profile').insert({
              user_id: userData.id,
              fullname: data.full_name,
              work_email: data.email,
              mobile_no: data.phone_number,
              ic_no: data.ic_number,
              position_id: data.position_id,
              is_active: true,
            });
          }
          break;
          
        default:
          break;
      }
    }

    return userData;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message || 'Failed to create user');
  }
};

/**
 * Handle the update of an existing user
 * @param data Form data
 * @param user Existing user profile
 * @returns Updated user
 */
export const handleUpdateUser = async (data: UserFormData, user: Profile): Promise<Profile> => {
  try {
    // Update the profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone_number: data.phone_number,
        ic_number: data.ic_number,
        user_type: data.user_type,
        user_group: data.user_group ? parseInt(data.user_group) : null,
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Update the specific profile table based on user group
    if (data.user_group) {
      switch (data.user_group) {
        case '1': // MCMC
          const { data: existingMcmc } = await supabase
            .from('nd_mcmc_profile')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (existingMcmc) {
            await supabase
              .from('nd_mcmc_profile')
              .update({
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                position_id: data.position_id || null,
              })
              .eq('id', existingMcmc.id);
          } else if (data.position_id) {
            await supabase
              .from('nd_mcmc_profile')
              .insert({
                user_id: user.id,
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                position_id: data.position_id,
                is_active: true,
              });
          }
          break;

        case '3': // TP (Tech Partner)
          const { data: existingTp } = await supabase
            .from('nd_tech_partner_profile')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (existingTp) {
            await supabase
              .from('nd_tech_partner_profile')
              .update({
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                personal_email: data.personal_email || null,
                join_date: data.join_date || null,
                qualification: data.qualification || null,
                dob: data.dob || null,
                place_of_birth: data.place_of_birth || null,
                marital_status: data.marital_status || null,
                race_id: data.race_id || null,
                religion_id: data.religion_id || null,
                nationality_id: data.nationality_id || null,
              })
              .eq('id', existingTp.id);
          } else {
            await supabase
              .from('nd_tech_partner_profile')
              .insert({
                user_id: user.id,
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                personal_email: data.personal_email || null,
                join_date: data.join_date || null,
                qualification: data.qualification || null,
                dob: data.dob || null,
                place_of_birth: data.place_of_birth || null,
                marital_status: data.marital_status || null,
                race_id: data.race_id || null,
                religion_id: data.religion_id || null,
                nationality_id: data.nationality_id || null,
                is_active: true,
              });
          }
          break;

        case '2': // DUSP
          const { data: existingDusp } = await supabase
            .from('nd_dusp_profile')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (existingDusp) {
            await supabase
              .from('nd_dusp_profile')
              .update({
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                position_id: data.position_id || null,
              })
              .eq('id', existingDusp.id);
          } else if (data.position_id) {
            await supabase
              .from('nd_dusp_profile')
              .insert({
                user_id: user.id,
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                position_id: data.position_id,
                is_active: true,
              });
          }
          break;

        case '4': // SSO
          const { data: existingSso } = await supabase
            .from('nd_sso_profile')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (existingSso) {
            await supabase
              .from('nd_sso_profile')
              .update({
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                position_id: data.position_id || null,
              })
              .eq('id', existingSso.id);
          } else if (data.position_id) {
            await supabase
              .from('nd_sso_profile')
              .insert({
                user_id: user.id,
                fullname: data.full_name,
                work_email: data.email,
                mobile_no: data.phone_number,
                ic_no: data.ic_number,
                position_id: data.position_id,
                is_active: true,
              });
          }
          break;
      }
    }

    // Update password if provided
    if (data.password && data.password.trim()) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: data.password }
      );
      
      if (passwordError) throw passwordError;
    }

    // Return the updated user
    return {
      ...user,
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      ic_number: data.ic_number,
      user_type: data.user_type as any,
      user_group: data.user_group ? parseInt(data.user_group) : null,
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};
