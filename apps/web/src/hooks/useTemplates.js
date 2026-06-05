
import { useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const useTemplates = () => {
  const { currentUser } = useAuth();

  const listTemplates = useCallback(async () => {
    if (!currentUser) return [];
    try {
      console.log('Fetching templates for user:', currentUser.id);
      const records = await pb.collection('settings').getList(1, 50, {
        filter: `user_id="${currentUser.id}"`,
        sort: '-created_at',
        $autoCancel: false
      });
      console.log('Templates fetched successfully:', records.items.length);
      return records.items;
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar templates.');
      return [];
    }
  }, [currentUser]);

  const createTemplate = async (templateName, templateContent) => {
    if (!currentUser) return null;
    if (!templateName?.trim() || !templateContent?.trim()) {
      toast.error('Nome e conteúdo do template são obrigatórios.');
      return null;
    }

    try {
      console.log('Creating new template:', templateName);
      const record = await pb.collection('settings').create({
        user_id: currentUser.id,
        template_name: templateName.trim(),
        template_content: templateContent.trim(),
        is_default: false
      }, { $autoCancel: false });
      
      console.log('Template created successfully:', record.id);
      toast.success('Template criado com sucesso!');
      return record;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar template.');
      return null;
    }
  };

  const updateTemplate = async (templateId, templateName, templateContent) => {
    if (!templateName?.trim() || !templateContent?.trim()) {
      toast.error('Nome e conteúdo do template são obrigatórios.');
      return null;
    }

    try {
      console.log('Updating template:', templateId);
      const record = await pb.collection('settings').update(templateId, {
        template_name: templateName.trim(),
        template_content: templateContent.trim()
      }, { $autoCancel: false });
      
      console.log('Template updated successfully:', record.id);
      toast.success('Template atualizado com sucesso!');
      return record;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Erro ao atualizar template.');
      return null;
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      console.log('Deleting template:', templateId);
      await pb.collection('settings').delete(templateId, { $autoCancel: false });
      console.log('Template deleted successfully');
      toast.success('Template excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir template.');
      return false;
    }
  };

  const setDefaultTemplate = async (templateId) => {
    if (!currentUser) return false;
    try {
      console.log('Setting default template:', templateId);
      
      // First, get all current templates to unset their default status
      const allTemplates = await listTemplates();
      
      // Update all templates in parallel
      const updatePromises = allTemplates.map(t => {
        const isTarget = t.id === templateId;
        if (t.is_default !== isTarget) {
          return pb.collection('settings').update(t.id, {
            is_default: isTarget
          }, { $autoCancel: false });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      console.log('Default template updated successfully');
      toast.success('Template padrão definido com sucesso!');
      return true;
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Erro ao definir template padrão.');
      return false;
    }
  };

  const getDefaultTemplate = useCallback(async () => {
    if (!currentUser) return null;
    try {
      console.log('Fetching default template for user:', currentUser.id);
      const records = await pb.collection('settings').getList(1, 1, {
        filter: `user_id="${currentUser.id}" && is_default=true`,
        $autoCancel: false
      });
      
      if (records.items.length > 0) {
        console.log('Default template found:', records.items[0].id);
        return records.items[0];
      }
      console.log('No default template found');
      return null;
    } catch (error) {
      console.error('Error fetching default template:', error);
      return null;
    }
  }, [currentUser]);

  return {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getDefaultTemplate
  };
};
