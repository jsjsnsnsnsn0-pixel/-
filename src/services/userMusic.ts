import {supabase} from './supabase';

// Each song belongs to exactly one account and is stored in a private bucket.
// Listening from a second phone downloads the file under the same logged-in user.
export type SavedMusic = {
  id:string; user_id:string; name:string; storage_path:string;
  content_type:string; file_size_bytes:number; duration_seconds:number; created_at:string;
};
const bucket='user-music';
const mimeByExt:Record<string,string>={
  mp3:'audio/mpeg',m4a:'audio/mp4',mp4:'audio/mp4',
  ogg:'audio/ogg',webm:'audio/webm',wav:'audio/wav',
};
export const musicFileType=(file:File)=>{
  const ext=file.name.split('.').pop()?.toLowerCase()||'';
  if(!mimeByExt[ext]||(file.type&&!file.type.startsWith('audio/')&&file.type!=='application/octet-stream'))throw new Error('اختر ملفاً صوتياً MP3 أو M4A أو OGG أو WebM أو WAV.');
  return {ext,mime:mimeByExt[ext]};
};
export async function loadUserMusic(userId:string):Promise<SavedMusic[]>{
  const {data,error}=await supabase.from('user_music_library')
    .select('id,user_id,name,storage_path,content_type,file_size_bytes,duration_seconds,created_at')
    .eq('user_id',userId).order('created_at',{ascending:false}).limit(30);
  if(error)throw error;
  return (data||[]) as SavedMusic[];
}
export async function uploadUserMusic(userId:string,file:File,duration:number):Promise<SavedMusic>{
  const {ext,mime}=musicFileType(file);
  if(!file.size||file.size>15*1024*1024)throw new Error('حجم الأغنية يجب أن يكون أقل من 15MB.');
  if(!Number.isFinite(duration)||duration<=0||duration>3600)throw new Error('مدة الأغنية يجب أن تكون أقل من ساعة.');
  const id=crypto.randomUUID();
  const path=`${userId}/${id}.${ext}`;
  const {error:storageError}=await supabase.storage.from(bucket).upload(path,file,{
    contentType:mime,cacheControl:'3600',upsert:false,
  });
  if(storageError)throw storageError;
  const row={id,user_id:userId,name:file.name.slice(0,160).trim(),storage_path:path,
    content_type:mime,file_size_bytes:file.size,duration_seconds:Math.round(duration*100)/100};
  const {data,error}=await supabase.from('user_music_library').insert(row).select('*').single();
  if(error){
    await supabase.storage.from(bucket).remove([path]).catch(()=>{});
    throw error;
  }
  return data as SavedMusic;
}
export async function downloadUserMusic(track:SavedMusic):Promise<File>{
  const {data,error}=await supabase.storage.from(bucket).download(track.storage_path);
  if(error||!data)throw error||new Error('تعذر تحميل الملف الصوتي من حسابك.');
  return new File([data],track.name,{type:track.content_type});
}
export async function removeUserMusic(track:SavedMusic):Promise<void>{
  // Only drop metadata once the private file itself has been removed.
  const {error:removeError}=await supabase.storage.from(bucket).remove([track.storage_path]);
  if(removeError)throw removeError;
  const {error}=await supabase.from('user_music_library').delete().eq('id',track.id).eq('user_id',track.user_id);
  if(error)throw error;
}
