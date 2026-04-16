// Document Types
import { supabase } from './supabase';

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  file_url: string;
  file_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  expiry_date?: string;
  driver?: { full_name?: string };
}

export interface ParentDocument {
  id: string;
  parent_id: string;
  document_type: string;
  file_url: string;
  file_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  parent?: { full_name?: string };
  child?: { full_name?: string };
}

export const documentService = {
  async uploadDocument(file: any, fileName: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);
    if (error) throw error;
    return data;
  },
  async getDriverDocuments() {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async saveDriverDocument(driverId: string, docType: string, fileUrl: string, fileName: string, expiryDate?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .insert({
        driver_id: driverId,
        document_type: docType,
        file_url: fileUrl,
        file_name: fileName,
        expiry_date: expiryDate,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async reviewDriverDocument(documentId: string, status: 'approved' | 'rejected', reviewedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .update({ status, reviewed_by: reviewedBy, review_notes: notes })
      .eq('id', documentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getAllDriverDocuments() {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*, driver:drivers(full_name)')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getAllParentDocuments() {
    const { data, error } = await supabase
      .from('parent_documents')
      .select('*, parent:profiles(full_name)')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async reviewParentDocument(documentId: string, status: 'approved' | 'rejected', reviewedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('parent_documents')
      .update({ status, reviewed_by: reviewedBy, review_notes: notes })
      .eq('id', documentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
