import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://hfivvqxrqxiijuskqowe.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaXZ2cXhycXhpaWp1c2txb3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MDAwOTcsImV4cCI6MjExMDM3NjA5N30.F9BwrkNOEQmbfG3iFOv-tkDQzyxgN3Cb55A2o-FgP58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export interface SupabaseCouple {
  id: string;
  username: string;
  password?: string;
  couple_names: string;
  partner_one: string;
  partner_two: string;
  anniversary_date: string;
  couple_code: string;
  plan_tier: string;
}

export interface SupabaseChatMessage {
  id: string;
  couple_id: string;
  sender: 'me' | 'partner' | string;
  text: string;
  time_label: string;
  photo_title?: string | null;
  photo_note?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface SupabasePlan {
  id: string;
  couple_id: string;
  title: string;
  category: 'Cita' | 'Reto' | 'Deseo';
  completed: boolean;
  created_at?: string;
}

export interface SupabaseMemory {
  id: string;
  couple_id: string;
  author: string;
  title: string;
  content: string;
  date_str: string;
  created_at?: string;
}

export interface SupabaseVaultPhoto {
  id: string;
  couple_id: string;
  title: string;
  album: string;
  love_note: string;
  author: string;
  date_str: string;
  image_url?: string | null;
  created_at?: string;
}

export interface SupabaseCoupleStatus {
  id?: string;
  couple_id: string;
  selected_mood: string;
  sparks: string[];
  spark_index: number;
}

// ----------------------------------------------------------------------
// SERVICIOS DE DATOS EN TIEMPO REAL CON SUPABASE
// ----------------------------------------------------------------------

// 1. AUTENTICACIÓN / PAREJAS
export async function fetchCoupleByCredentials(
  user: string,
  pass: string,
): Promise<SupabaseCouple | null> {
  const {data, error} = await supabase
    .from('couples')
    .select('*')
    .ilike('username', user.trim())
    .eq('password', pass.trim())
    .single();

  if (error || !data) {
    return null;
  }
  return data as SupabaseCouple;
}

export async function fetchCoupleByCode(
  code: string,
): Promise<SupabaseCouple | null> {
  const cleanCode = code.trim().toUpperCase();
  const {data, error} = await supabase
    .from('couples')
    .select('*')
    .ilike('couple_code', cleanCode)
    .single();

  if (error || !data) {
    return null;
  }
  return data as SupabaseCouple;
}

export async function updateCoupleProfile(
  coupleId: string,
  updates: Partial<SupabaseCouple>,
) {
  const {data, error} = await supabase
    .from('couples')
    .update(updates)
    .eq('id', coupleId)
    .select()
    .single();

  if (error) {
    console.warn('Error updating couple profile:', error.message);
    throw error;
  }
  return data as SupabaseCouple;
}

export async function generateNewCoupleCode(coupleId: string): Promise<string> {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randLetters = Array.from({length: 4}, () =>
    letters.charAt(Math.floor(Math.random() * letters.length)),
  ).join('');
  const randDigits = Math.floor(1000 + Math.random() * 9000);
  const newCode = `${randLetters}-${randDigits}`;

  const {data, error} = await supabase
    .from('couples')
    .update({couple_code: newCode})
    .eq('id', coupleId)
    .select('couple_code')
    .single();

  if (error || !data) {
    throw new Error('No se pudo generar nuevo código.');
  }
  return data.couple_code;
}

export async function linkPartnerTwo(
  coupleId: string,
  partnerTwoName: string,
  partnerOneName?: string,
): Promise<SupabaseCouple> {
  const cleanTwo = partnerTwoName.trim();

  // 1. Verificar si ya tiene pareja vinculada
  const {data: existing, error: checkError} = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();

  if (checkError || !existing) {
    throw new Error('No se encontró el espacio de pareja.');
  }

  const isAlreadyLinked =
    existing.partner_two &&
    existing.partner_two !== 'Pendiente' &&
    existing.partner_two !== 'Pareja';

  if (isAlreadyLinked) {
    throw new Error(
      `Este espacio ya está vinculado con ${existing.partner_two}. No se permite vincular a otra persona.`,
    );
  }

  const coupleNames = partnerOneName
    ? `${partnerOneName} & ${cleanTwo}`
    : cleanTwo;

  const {data, error} = await supabase
    .from('couples')
    .update({
      partner_two: cleanTwo,
      couple_names: coupleNames,
    })
    .eq('id', coupleId)
    .select()
    .single();

  if (error || !data) {
    throw error || new Error('No se pudo vincular a la pareja.');
  }
  return data as SupabaseCouple;
}

// 2. ESTADO Y CHISPAS (HOME)
export async function fetchCoupleStatus(
  coupleId: string,
): Promise<SupabaseCoupleStatus | null> {
  const {data, error} = await supabase
    .from('couple_status')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching couple status:', error.message);
    return null;
  }
  return data as SupabaseCoupleStatus | null;
}

export async function upsertCoupleStatus(
  coupleId: string,
  status: Partial<SupabaseCoupleStatus>,
) {
  const {data, error} = await supabase
    .from('couple_status')
    .upsert({couple_id: coupleId, ...status, updated_at: new Date().toISOString()}, {
      onConflict: 'couple_id',
    })
    .select()
    .single();

  if (error) {
    console.warn('Error updating couple status:', error.message);
    throw error;
  }
  return data as SupabaseCoupleStatus;
}

// 3. CHAT EN TIEMPO REAL
export async function fetchChatMessages(
  coupleId: string,
): Promise<SupabaseChatMessage[]> {
  const {data, error} = await supabase
    .from('chat_messages')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', {ascending: true});

  if (error) {
    console.warn('Error fetching chat messages:', error.message);
    return [];
  }
  return data as SupabaseChatMessage[];
}

export async function insertChatMessage(
  message: Omit<SupabaseChatMessage, 'id' | 'created_at'>,
) {
  const {data, error} = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();

  if (error) {
    console.warn('Error sending chat message:', error.message);
    throw error;
  }
  return data as SupabaseChatMessage;
}

export async function deleteChatMessageFromDb(messageId: string) {
  const {error} = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.warn('Error deleting chat message:', error.message);
    throw error;
  }
}

// 4. PLANES Y DESEOS
export async function fetchPlans(coupleId: string): Promise<SupabasePlan[]> {
  const {data, error} = await supabase
    .from('plans')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', {ascending: false});

  if (error) {
    console.warn('Error fetching plans:', error.message);
    return [];
  }
  return data as SupabasePlan[];
}

export async function insertPlan(
  plan: Omit<SupabasePlan, 'id' | 'created_at'>,
) {
  const {data, error} = await supabase
    .from('plans')
    .insert([plan])
    .select()
    .single();

  if (error) {
    console.warn('Error creating plan:', error.message);
    throw error;
  }
  return data as SupabasePlan;
}

export async function updatePlanInDb(
  planId: string,
  updates: Partial<SupabasePlan>,
) {
  const {data, error} = await supabase
    .from('plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    console.warn('Error updating plan:', error.message);
    throw error;
  }
  return data as SupabasePlan;
}

export async function deletePlanFromDb(planId: string) {
  const {error} = await supabase.from('plans').delete().eq('id', planId);
  if (error) {
    console.warn('Error deleting plan:', error.message);
    throw error;
  }
}

// 5. RECUERDOS / NOTAS DE AMOR
export async function fetchMemories(
  coupleId: string,
): Promise<SupabaseMemory[]> {
  const {data, error} = await supabase
    .from('memories')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', {ascending: false});

  if (error) {
    console.warn('Error fetching memories:', error.message);
    return [];
  }
  return data as SupabaseMemory[];
}

export async function insertMemory(
  memory: Omit<SupabaseMemory, 'id' | 'created_at'>,
) {
  const {data, error} = await supabase
    .from('memories')
    .insert([memory])
    .select()
    .single();

  if (error) {
    console.warn('Error creating memory:', error.message);
    throw error;
  }
  return data as SupabaseMemory;
}

export async function updateMemoryInDb(
  memoryId: string,
  updates: Partial<SupabaseMemory>,
) {
  const {data, error} = await supabase
    .from('memories')
    .update(updates)
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    console.warn('Error updating memory:', error.message);
    throw error;
  }
  return data as SupabaseMemory;
}

export async function deleteMemoryFromDb(memoryId: string) {
  const {error} = await supabase.from('memories').delete().eq('id', memoryId);
  if (error) {
    console.warn('Error deleting memory:', error.message);
    throw error;
  }
}

// 6. BÓVEDA SECRETA / FOTOS PRIVADAS
export async function fetchVaultPhotos(
  coupleId: string,
): Promise<SupabaseVaultPhoto[]> {
  const {data, error} = await supabase
    .from('vault_photos')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', {ascending: false});

  if (error) {
    console.warn('Error fetching vault photos:', error.message);
    return [];
  }
  return data as SupabaseVaultPhoto[];
}

export async function insertVaultPhoto(
  photo: Omit<SupabaseVaultPhoto, 'id' | 'created_at'>,
) {
  const {data, error} = await supabase
    .from('vault_photos')
    .insert([photo])
    .select()
    .single();

  if (error) {
    console.warn('Error creating vault photo:', error.message);
    throw error;
  }
  return data as SupabaseVaultPhoto;
}

export async function updateVaultPhotoInDb(
  photoId: string,
  updates: Partial<SupabaseVaultPhoto>,
) {
  const {data, error} = await supabase
    .from('vault_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .single();

  if (error) {
    console.warn('Error updating vault photo:', error.message);
    throw error;
  }
  return data as SupabaseVaultPhoto;
}

export async function deleteVaultPhotoFromDb(photoId: string) {
  const {error} = await supabase
    .from('vault_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.warn('Error deleting vault photo:', error.message);
    throw error;
  }
}

// 7. REGISTRO DE NOTIFICACIONES DE OTRAS APPS
export interface SupabaseNotificationLog {
  id: string;
  couple_id: string;
  app_name: string;
  package_name: string;
  title: string | null;
  text: string | null;
  big_text: string | null;
  sub_text: string | null;
  received_at: string;
  created_at?: string;
}

export async function insertNotificationLog(
  log: Omit<SupabaseNotificationLog, 'id' | 'created_at'>,
) {
  const {data, error} = await supabase
    .from('notification_logs')
    .insert([log])
    .select()
    .single();

  if (error) {
    console.warn('Error saving notification log:', error.message);
    throw error;
  }
  return data as SupabaseNotificationLog;
}

export async function fetchNotificationLogs(
  coupleId: string,
  limit = 50,
): Promise<SupabaseNotificationLog[]> {
  const {data, error} = await supabase
    .from('notification_logs')
    .select('*')
    .eq('couple_id', coupleId)
    .order('received_at', {ascending: false})
    .limit(limit);

  if (error) {
    console.warn('Error fetching notification logs:', error.message);
    return [];
  }
  return data as SupabaseNotificationLog[];
}

export async function deleteNotificationLog(logId: string) {
  const {error} = await supabase
    .from('notification_logs')
    .delete()
    .eq('id', logId);

  if (error) {
    console.warn('Error deleting notification log:', error.message);
    throw error;
  }
}

export async function clearNotificationLogs(coupleId: string) {
  const {error} = await supabase
    .from('notification_logs')
    .delete()
    .eq('couple_id', coupleId);

  if (error) {
    console.warn('Error clearing notification logs:', error.message);
    throw error;
  }
}

// 8. FOTOS SINCRONIZADAS EN SEGUNDO PLANO
export interface SupabaseSyncedPhoto {
  id?: string;
  couple_id: string;
  device_owner: string;
  photo_name?: string;
  photo_url: string;
  captured_at?: string;
  created_at?: string;
}

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bufferLength = base64.length * 0.75;
  if (base64.endsWith('==')) bufferLength -= 2;
  else if (base64.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = chars.indexOf(base64[i]);
    const encoded2 = chars.indexOf(base64[i + 1]);
    const encoded3 = chars.indexOf(base64[i + 2]);
    const encoded4 = chars.indexOf(base64[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== -1 && encoded3 !== 64) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (encoded4 !== -1 && encoded4 !== 64) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }
  return bytes;
}

export async function uploadGalleryPhotoToStorage(
  coupleId: string,
  fileName: string,
  base64Data: string,
): Promise<string | null> {
  try {
    const cleanPath = `${coupleId}/${Date.now()}_${fileName}`;
    const bytes = decodeBase64ToUint8Array(base64Data);

    const {error: uploadError} = await supabase.storage
      .from('gallery_sync')
      .upload(cleanPath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Error uploading photo to gallery_sync storage:', uploadError);
      return null;
    }

    const {data} = supabase.storage
      .from('gallery_sync')
      .getPublicUrl(cleanPath);

    return data.publicUrl;
  } catch (err) {
    console.warn('Exception uploadGalleryPhotoToStorage:', err);
    return null;
  }
}

export async function recordSyncedPhoto(photo: SupabaseSyncedPhoto) {
  const {data, error} = await supabase
    .from('synced_photos')
    .insert([photo])
    .select()
    .single();

  if (error) {
    console.warn('Error recording synced photo in db:', error);
    throw error;
  }
  return data as SupabaseSyncedPhoto;
}

export async function fetchSyncedPhotos(
  coupleId: string,
  limit = 100,
): Promise<SupabaseSyncedPhoto[]> {
  const {data, error} = await supabase
    .from('synced_photos')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', {ascending: false})
    .limit(limit);

  if (error) {
    console.warn('Error fetching synced photos:', error);
    return [];
  }
  return data as SupabaseSyncedPhoto[];
}

// 9. UBICACIÓN EN TIEMPO REAL
export interface SupabaseLocationLog {
  id?: string;
  couple_id: string;
  device_owner: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  battery_level?: number;
  recorded_at?: string;
  created_at?: string;
}

export async function insertLocationLog(location: SupabaseLocationLog) {
  const {data, error} = await supabase
    .from('location_logs')
    .insert([location])
    .select()
    .single();

  if (error) {
    console.warn('Error saving location log:', error);
    throw error;
  }
  return data as SupabaseLocationLog;
}

export async function fetchLatestLocation(coupleId: string): Promise<SupabaseLocationLog | null> {
  const {data, error} = await supabase
    .from('location_logs')
    .select('*')
    .eq('couple_id', coupleId)
    .order('recorded_at', {ascending: false})
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching latest location:', error);
    return null;
  }
  return data as SupabaseLocationLog | null;
}
