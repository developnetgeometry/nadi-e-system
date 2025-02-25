
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { menuGroups } from "@/utils/menu-groups";

interface MenuVisibility {
  menu_key: string;
  visible_to: string[];
}

interface SubmoduleVisibility {
  parent_module: string;
  submodule_key: string;
  visible_to: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export const MenuVisibilitySettings = () => {
  const { toast } = useToast();
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibility[]>([]);
  const [submoduleVisibility, setSubmoduleVisibility] = useState<SubmoduleVisibility[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('id, name, description')
          .order('name');

        if (rolesError) throw rolesError;
        setRoles(rolesData || []);

        // Load menu visibility
        const { data: menuData, error: menuError } = await supabase
          .from('menu_visibility')
          .select('*');

        if (menuError) throw menuError;
        setMenuVisibility(menuData || []);

        // Load submodule visibility
        const { data: submoduleData, error: submoduleError } = await supabase
          .from('submodule_visibility')
          .select('*');

        if (submoduleError) throw submoduleError;
        setSubmoduleVisibility(submoduleData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load visibility settings",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  const handleUpdateMenuVisibility = async (menuKey: string, roleName: string, checked: boolean) => {
    const currentMenu = menuVisibility.find(m => m.menu_key === menuKey) || {
      menu_key: menuKey,
      visible_to: []
    };

    const updatedVisibleTo = checked
      ? [...new Set([...currentMenu.visible_to, roleName])]
      : currentMenu.visible_to.filter(t => t !== roleName);

    try {
      const { error } = await supabase
        .from('menu_visibility')
        .upsert({
          menu_key: menuKey,
          visible_to: updatedVisibleTo
        });

      if (error) throw error;

      setMenuVisibility(prev => 
        prev.map(m => m.menu_key === menuKey ? { ...m, visible_to: updatedVisibleTo } : m)
      );

      toast({
        title: "Success",
        description: "Menu visibility updated successfully",
      });
    } catch (error) {
      console.error('Error updating menu visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update menu visibility",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubmoduleVisibility = async (
    parentModule: string,
    submoduleKey: string,
    roleName: string,
    checked: boolean
  ) => {
    const currentSubmodule = submoduleVisibility.find(
      s => s.parent_module === parentModule && s.submodule_key === submoduleKey
    ) || {
      parent_module: parentModule,
      submodule_key: submoduleKey,
      visible_to: []
    };

    const updatedVisibleTo = checked
      ? [...new Set([...currentSubmodule.visible_to, roleName])]
      : currentSubmodule.visible_to.filter(t => t !== roleName);

    try {
      const { error } = await supabase
        .from('submodule_visibility')
        .upsert({
          parent_module: parentModule,
          submodule_key: submoduleKey,
          visible_to: updatedVisibleTo
        });

      if (error) throw error;

      setSubmoduleVisibility(prev => 
        prev.map(s => 
          s.parent_module === parentModule && s.submodule_key === submoduleKey
            ? { ...s, visible_to: updatedVisibleTo }
            : s
        )
      );

      toast({
        title: "Success",
        description: "Submodule visibility updated successfully",
      });
    } catch (error) {
      console.error('Error updating submodule visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update submodule visibility",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu & Submodule Visibility</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-4">
          {menuGroups.map((group) => (
            <AccordionItem key={group.label} value={group.label}>
              <AccordionTrigger className="text-lg font-semibold">
                {group.label}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pl-4">
                  {/* Main menu visibility */}
                  <div className="space-y-4">
                    <Label className="text-base">Main Menu Visibility</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${group.label}-${role.name}`}
                            checked={menuVisibility.some(
                              m => m.menu_key === group.label && m.visible_to.includes(role.name)
                            )}
                            onCheckedChange={(checked) => 
                              handleUpdateMenuVisibility(group.label, role.name, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`${group.label}-${role.name}`}
                            title={role.description || undefined}
                            className="cursor-help"
                          >
                            {role.name.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submodules visibility */}
                  {group.items.map((item) => (
                    <div key={item.title} className="space-y-4 border-l-2 border-gray-200 pl-4">
                      <Label className="text-base">{item.title}</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {roles.map((role) => (
                          <div key={`${item.title}-${role.name}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${group.label}-${item.title}-${role.name}`}
                              checked={submoduleVisibility.some(
                                s => s.parent_module === group.label &&
                                     s.submodule_key === item.title &&
                                     s.visible_to.includes(role.name)
                              )}
                              onCheckedChange={(checked) => 
                                handleUpdateSubmoduleVisibility(
                                  group.label,
                                  item.title,
                                  role.name,
                                  checked as boolean
                                )
                              }
                            />
                            <Label 
                              htmlFor={`${group.label}-${item.title}-${role.name}`}
                              title={role.description || undefined}
                              className="cursor-help"
                            >
                              {role.name.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
