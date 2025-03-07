
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  users_count: number;
}

export const useRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: roles,
    isLoading,
    error
  } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('Fetching roles data...');
      
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('id, name, description, created_at');
        
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }

        if (!rolesData) {
          throw new Error('No roles data returned');
        }

        console.log('Roles data fetched:', rolesData);

        const rolesWithCounts = await Promise.all(
          rolesData.map(async (role) => {
            const { count } = await supabase
              .from('user_roles')
              .select('*', { count: 'exact', head: true })
              .eq('role_id', role.id);

            return {
              ...role,
              users_count: count || 0
            };
          })
        );

        console.log('Roles with counts:', rolesWithCounts);
        return rolesWithCounts;
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    },
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          title: "Error",
          description: "Failed to fetch roles data. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const createRole = async (values: { name: string; description: string }) => {
    try {
      const { error } = await supabase
        .from('roles')
        .insert([values]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateRole = async (roleId: string, values: { description: string }) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ description: values.description })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    roles,
    isLoading,
    error,
    createRole,
    updateRole
  };
};
